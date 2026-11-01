import { Injectable, OnDestroy, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AgentEmployeeService } from './agent-employee.service';
import { environment } from '../../../environments/environment';
import {
  FALLBACK_TTS_VOICES,
  TtsVoiceOption,
  VoicePreference,
  VoiceUiState,
} from '../models/agent.model';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal?: boolean }>;
};

/**
 * Turn-based speech for Sophia. The browser transcribes one utterance, then the server
 * answers and synthesizes speech. This is not a full-duplex realtime call.
 */
@Injectable({ providedIn: 'root' })
export class SophiaVoiceService implements OnDestroy {
  private readonly agentService = inject(AgentEmployeeService);

  private recognition: SpeechRecognitionLike | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private audioObjectUrl: string | null = null;
  private ttsAbort: AbortController | null = null;
  private disposingAudio = false;
  private holdPlayback = false;
  private prefs: VoicePreference | null = null;
  private pushToTalkActive = false;
  private speakGeneration = 0;
  private catalogDefaultVoice = 'coral';

  readonly voiceState = signal<VoiceUiState>('idle');
  /** True from the moment a reply is queued until playback finishes or is stopped. */
  readonly utteranceActive = signal(false);
  /** Increments each time a new utterance starts, so other screens can tell playback apart. */
  readonly playbackId = signal(0);
  readonly voices = signal<TtsVoiceOption[]>(FALLBACK_TTS_VOICES);
  readonly selectedVoice = signal('coral');
  readonly voiceProvider = signal('openai');
  readonly playbackNotice = signal<string | null>(null);
  /** Stays on from the click that starts the mic until the click that stops it. */
  readonly micEngaged = signal(false);
  readonly isListening = computed(() => this.voiceState() === 'listening');
  readonly isSpeaking = computed(() => this.voiceState() === 'speaking');
  readonly isPaused = computed(() => this.voiceState() === 'paused');
  readonly isMuted = signal(false);
  readonly transcriptInterim = signal('');
  readonly lastSpokenText = signal('');
  readonly micSupported = signal(false);
  readonly ttsSupported = signal(typeof window !== 'undefined' && 'speechSynthesis' in window);
  readonly language = signal(this.readStoredLanguage() ?? 'auto');
  /** Language of the latest reply, used when preference is automatic. */
  private replyLanguage = 'en';
  readonly autoSpeak = signal(true);
  readonly continuousListening = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Fired when a final transcript is ready to send as a chat message. */
  onFinalTranscript: ((text: string) => void) | null = null;

  constructor() {
    this.micSupported.set(this.createRecognition() != null);
    this.warmVoices();
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  async loadPreferences(): Promise<VoicePreference | null> {
    const [prefsResult, catalogResult] = await Promise.allSettled([
      firstValueFrom(this.agentService.getVoicePreferences()),
      firstValueFrom(this.agentService.listTtsVoices()),
    ]);

    if (catalogResult.status === 'fulfilled' && catalogResult.value.voices?.length) {
      this.voices.set(catalogResult.value.voices);
      this.voiceProvider.set(catalogResult.value.provider || 'openai');
      this.catalogDefaultVoice = catalogResult.value.defaultVoice || 'coral';
    }

    if (prefsResult.status === 'fulfilled') {
      this.applyPreferences(prefsResult.value);
      return prefsResult.value;
    }

    this.applyPreferences({
      language: 'en',
      voiceName: 'default',
      speechRate: 1,
      pitch: 1,
      continuousListening: false,
      autoSpeak: true,
      preferredAgentKey: 'sophia',
    });
    return null;
  }

  applyPreferences(prefs: VoicePreference): void {
    this.prefs = { ...prefs };
    const stored = this.readStoredLanguage();
    const server = this.normalizeLanguage(prefs.language || 'auto');
    const lang = stored ?? (server === 'en' ? 'auto' : server);
    this.language.set(lang);
    this.autoSpeak.set(prefs.autoSpeak !== false);
    this.continuousListening.set(!!prefs.continuousListening);
    this.selectedVoice.set(this.resolveVoiceId(prefs.voiceName));
    this.agentService.setPreferences({
      agentKey: prefs.preferredAgentKey || 'sophia',
      language: lang,
    });
  }

  pinLanguage(language: string): void {
    const lang = this.normalizeLanguage(language);
    this.language.set(lang);
    this.writeStoredLanguage(lang);
    this.agentService.setPreferences({ language: lang });
    if (this.prefs) this.prefs = { ...this.prefs, language: lang };
  }

  async selectLanguage(language: string): Promise<void> {
    const lang = this.normalizeLanguage(language);
    this.pinLanguage(lang);
    const base = this.prefs ?? {
      language: lang,
      voiceName: this.selectedVoice(),
      speechRate: 1,
      pitch: 1,
      continuousListening: this.continuousListening(),
      autoSpeak: this.autoSpeak(),
      preferredAgentKey: 'sophia',
    };
    this.prefs = { ...base, language: lang };
    try {
      const saved = await firstValueFrom(
        this.agentService.saveVoicePreferences({
          language: lang,
          voiceName: this.selectedVoice(),
          speechRate: base.speechRate ?? 1,
          pitch: base.pitch ?? 1,
          continuousListening: !!base.continuousListening,
          autoSpeak: base.autoSpeak !== false,
          preferredAgentKey: base.preferredAgentKey || 'sophia',
        }),
      );
      this.prefs = saved;
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('Could not save that language. It will still be used in this browser.');
    }
  }

  async selectVoice(voiceName: string): Promise<void> {
    const name = this.resolveVoiceId(voiceName);
    if (!name || name === this.selectedVoice()) return;

    this.stopSpeaking(false);
    this.selectedVoice.set(name);
    const base = this.prefs ?? {
      language: this.language(),
      voiceName: name,
      speechRate: 1,
      pitch: 1,
      continuousListening: this.continuousListening(),
      autoSpeak: this.autoSpeak(),
      preferredAgentKey: 'sophia',
    };
    this.prefs = { ...base, voiceName: name };

    try {
      const saved = await firstValueFrom(
        this.agentService.saveVoicePreferences({
          language: this.language(),
          voiceName: name,
          speechRate: base.speechRate ?? 1,
          pitch: base.pitch ?? 1,
          continuousListening: !!base.continuousListening,
          autoSpeak: base.autoSpeak !== false,
          preferredAgentKey: base.preferredAgentKey || 'sophia',
        }),
      );
      this.applyPreferences(saved);
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('Could not save that voice. It will still be used for this session.');
    }
  }

  setProcessing(active: boolean): void {
    if (active) {
      this.stopSpeaking(false);
      this.pauseRecognition();
      this.voiceState.set('processing');
      return;
    }

    if (this.utteranceActive()) return;

    if (this.voiceState() === 'processing' || this.voiceState() === 'working') {
      this.voiceState.set('idle');
    }
    if (this.voiceState() !== 'speaking' && this.voiceState() !== 'paused') {
      this.resumeIfEngaged();
    }
  }

  setWorking(active: boolean): void {
    if (this.utteranceActive()) return;
    this.voiceState.set(active ? 'working' : 'idle');
  }

  startListening(options?: { pushToTalk?: boolean }): void {
    this.errorMessage.set(null);
    if (!this.micSupported()) {
      this.micEngaged.set(false);
      this.errorMessage.set('Speech recognition is not supported in this browser.');
      return;
    }

    this.stopSpeaking(false);
    const recognition = this.createRecognition();
    if (!recognition) {
      this.micEngaged.set(false);
      return;
    }

    if (this.recognition) return;

    this.recognition = recognition;
    this.pushToTalkActive = !!options?.pushToTalk;
    const stayOn = this.micEngaged() && !this.pushToTalkActive;
    recognition.lang = this.recognitionLocale();
    recognition.continuous = stayOn || (this.continuousListening() && !this.pushToTalkActive);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      const start = event.resultIndex ?? 0;
      for (let i = start; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if ((result as { isFinal?: boolean }).isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      this.transcriptInterim.set(interim || finalText);
      if (finalText.trim()) {
        this.transcriptInterim.set('');
        this.onFinalTranscript?.(finalText.trim());
        if (!recognition.continuous) {
          this.stopListening();
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        if (!this.micEngaged()) this.voiceState.set('idle');
        return;
      }
      this.errorMessage.set(
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Allow mic access to talk to Sophia.'
          : `Speech error: ${event.error}`,
      );
      this.micEngaged.set(false);
      this.voiceState.set('idle');
    };

    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      this.recognition = null;
      if (!this.micEngaged()) {
        if (this.voiceState() === 'listening') this.voiceState.set('idle');
        return;
      }
      if (this.voiceState() === 'speaking' || this.voiceState() === 'processing' || this.voiceState() === 'working') {
        return;
      }
      // Chrome ends a session on silence and will not restart the same instance.
      window.setTimeout(() => {
        if (!this.micEngaged() || this.recognition) return;
        if (this.voiceState() === 'speaking' || this.voiceState() === 'processing' || this.voiceState() === 'working') {
          return;
        }
        this.startListening();
      }, 200);
    };

    try {
      recognition.start();
      this.voiceState.set('listening');
    } catch {
      this.micEngaged.set(false);
      this.recognition = null;
      this.errorMessage.set('Could not start the microphone.');
      this.voiceState.set('idle');
    }
  }

  stopListening(): void {
    this.micEngaged.set(false);
    this.pushToTalkActive = false;
    this.haltRecognition();
    this.transcriptInterim.set('');
    if (this.voiceState() === 'listening') {
      this.voiceState.set('idle');
    }
  }

  toggleListening(): void {
    if (this.micEngaged()) {
      this.stopListening();
      return;
    }
    this.micEngaged.set(true);
    this.startListening();
  }

  speak(text: string, options?: { manual?: boolean; language?: string | null }): void {
    const spoken = this.cleanForSpeech(text);
    if (!spoken) return;
    if (!options?.manual && (this.isMuted() || !this.autoSpeak())) return;

    this.stopSpeaking(false);
    this.pauseRecognition();
    this.playbackId.update((id) => id + 1);
    const generation = this.speakGeneration;
    if (options?.language) this.replyLanguage = options.language;
    this.lastSpokenText.set(text);
    this.utteranceActive.set(true);
    this.errorMessage.set(null);
    void this.playWithProvider(spoken, generation);
  }

  pause(): void {
    if (!this.utteranceActive() && !this.audioEl && !this.utterance) return;
    this.holdPlayback = true;
    if (this.audioEl && !this.audioEl.paused && !this.audioEl.ended) {
      this.audioEl.pause();
      return;
    }
    if (this.utterance && this.ttsSupported()) {
      window.speechSynthesis.pause();
      this.voiceState.set('paused');
      return;
    }
    this.voiceState.set('paused');
  }

  resume(): void {
    this.holdPlayback = false;
    if (this.audioEl && this.audioEl.paused && !this.audioEl.ended) {
      void this.audioEl.play().catch(() => {
        if (this.utteranceActive()) this.errorMessage.set('Could not resume playback.');
      });
      return;
    }
    if (this.utterance && this.ttsSupported()) {
      window.speechSynthesis.resume();
      this.voiceState.set('speaking');
      return;
    }
    this.replay();
  }

  stopSpeaking(resumeMic = true): void {
    this.speakGeneration++;
    this.utteranceActive.set(false);
    this.holdPlayback = false;
    this.ttsAbort?.abort();
    this.ttsAbort = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
    this.disposeAudio();
    if (this.voiceState() === 'speaking' || this.voiceState() === 'paused') {
      this.voiceState.set('idle');
    }
    if (resumeMic) this.resumeIfEngaged();
  }

  replay(): void {
    const text = this.lastSpokenText();
    if (text) this.speak(text, { manual: true });
  }

  toggleMute(): void {
    this.isMuted.update((m) => !m);
    if (this.isMuted()) this.stopSpeaking();
  }

  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    this.onFinalTranscript = null;
  }

  private async playWithProvider(text: string, generation: number): Promise<void> {
    const abort = new AbortController();
    this.ttsAbort = abort;
    try {
      const speech = await this.agentService.synthesizeSpeech(text, {
        language: this.speechLocale(this.activeSpeechLanguage()),
        speechRate: this.prefs?.speechRate ?? 1,
        voiceName: this.selectedVoice(),
        signal: abort.signal,
      });
      if (generation !== this.speakGeneration) return;
      if (!speech.blob.size) throw new Error('Empty audio');

      if (this.voiceProvider() === 'openai' && speech.provider && speech.provider !== 'openai') {
        this.playbackNotice.set('The AI voice had a problem, so a backup voice was used.');
      } else {
        this.playbackNotice.set(null);
      }
      this.playBlob(speech.blob, generation);
    } catch (err) {
      if (generation !== this.speakGeneration || this.isAbortError(err)) return;
      if (environment.browserSpeechFallback && this.ttsSupported()) {
        this.playbackNotice.set('AI speech is unavailable, so the browser voice is being used.');
        if (this.holdPlayback) {
          this.voiceState.set('paused');
          return;
        }
        this.speakBrowser(text, generation);
        return;
      }
      this.failPlayback('Voice is unavailable right now. You can still read the reply.');
    }
  }

  private playBlob(blob: Blob, generation: number): void {
    this.disposeAudio();
    const url = URL.createObjectURL(blob);
    this.audioObjectUrl = url;
    const audio = new Audio(url);
    this.audioEl = audio;

    audio.onplaying = () => {
      if (generation === this.speakGeneration) this.voiceState.set('speaking');
    };
    audio.onpause = () => {
      if (generation !== this.speakGeneration || this.disposingAudio || audio.ended) return;
      this.voiceState.set('paused');
    };
    audio.onended = () => {
      if (generation !== this.speakGeneration) return;
      this.finishPlayback();
    };
    audio.onerror = () => {
      if (generation !== this.speakGeneration) return;
      if (environment.browserSpeechFallback && this.ttsSupported()) {
        this.playbackNotice.set('AI speech is unavailable, so the browser voice is being used.');
        this.speakBrowser(this.cleanForSpeech(this.lastSpokenText()), generation);
        return;
      }
      this.failPlayback('Could not play the voice audio.');
    };

    if (this.holdPlayback) {
      this.voiceState.set('paused');
      return;
    }

    void audio.play().catch(() => {
      if (generation !== this.speakGeneration) return;
      this.holdPlayback = true;
      this.voiceState.set('paused');
      this.playbackNotice.set('Tap play to hear the reply.');
    });
  }

  private speakBrowser(text: string, generation: number): void {
    if (!this.ttsSupported() || !text) {
      this.failPlayback('Voice is unavailable right now. You can still read the reply.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.speechLocale(this.activeSpeechLanguage());
    utterance.rate = this.prefs?.speechRate ?? 1;
    utterance.pitch = this.prefs?.pitch ?? 1;
    const voice = this.pickBestVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || utterance.lang;
    }

    utterance.onstart = () => {
      if (generation === this.speakGeneration) this.voiceState.set('speaking');
    };
    utterance.onend = () => {
      this.utterance = null;
      if (generation === this.speakGeneration) this.finishPlayback();
    };
    utterance.onerror = () => {
      this.utterance = null;
      if (generation !== this.speakGeneration) return;
      this.failPlayback('Voice is unavailable right now. You can still read the reply.');
    };

    this.utterance = utterance;
    window.speechSynthesis.cancel();
    // Chrome sometimes needs a tick after cancel.
    setTimeout(() => {
      if (generation !== this.speakGeneration) return;
      window.speechSynthesis.speak(utterance);
    }, 20);
  }

  private finishPlayback(): void {
    this.utteranceActive.set(false);
    if (this.voiceState() === 'speaking' || this.voiceState() === 'paused') {
      this.voiceState.set('idle');
    }
    this.resumeIfEngaged();
  }

  private failPlayback(message: string): void {
    this.utteranceActive.set(false);
    this.playbackNotice.set(null);
    this.errorMessage.set(message);
    if (this.voiceState() === 'speaking' || this.voiceState() === 'paused' || this.voiceState() === 'processing') {
      this.voiceState.set('idle');
    }
    this.resumeIfEngaged();
  }

  private disposeAudio(): void {
    this.disposingAudio = true;
    if (this.audioEl) {
      const audio = this.audioEl;
      audio.onplaying = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        /* ignore */
      }
      this.audioEl = null;
    }
    if (this.audioObjectUrl) {
      URL.revokeObjectURL(this.audioObjectUrl);
      this.audioObjectUrl = null;
    }
    this.disposingAudio = false;
  }

  private resolveVoiceId(voiceName: string | null | undefined): string {
    const requested = (voiceName || '').trim();
    if (requested && requested !== 'default' && this.voices().some((voice) => voice.id === requested)) {
      return requested;
    }
    if (this.voices().some((voice) => voice.id === this.catalogDefaultVoice)) {
      return this.catalogDefaultVoice;
    }
    return this.voices()[0]?.id || 'coral';
  }

  private isAbortError(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'AbortError';
  }

  private cleanForSpeech(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/`+/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }

  /** Drop the recognizer without turning the mic toggle off. */
  private pauseRecognition(): void {
    this.haltRecognition();
    this.transcriptInterim.set('');
  }

  private haltRecognition(): void {
    const recognition = this.recognition;
    this.recognition = null;
    try {
      recognition?.stop();
    } catch {
      /* ignore */
    }
  }

  private resumeIfEngaged(): void {
    if (!this.micEngaged() || this.recognition || this.utteranceActive()) return;
    if (this.voiceState() === 'speaking' || this.voiceState() === 'paused') return;
    this.startListening();
  }

  private createRecognition(): SpeechRecognitionLike | null {
    if (typeof window === 'undefined') return null;
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    return SpeechRecognitionCtor ? new SpeechRecognitionCtor() : null;
  }

  private warmVoices(): void {
    if (!this.ttsSupported()) return;
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
    // Nudge Chrome to populate the voice list.
    window.speechSynthesis.getVoices();
  }

  private pickBestVoice(): SpeechSynthesisVoice | null {
    if (!this.ttsSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const femaleHints = [
      'female',
      'zira',
      'susan',
      'samantha',
      'karen',
      'moira',
      'fiona',
      'tessa',
      'veena',
      'google uk english female',
      'aria',
      'jenny',
      'natasha',
    ];

    const prefix = this.speechLocale(this.activeSpeechLanguage()).slice(0, 2).toLowerCase();
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    return (
      langVoices.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
      langVoices.find((v) => /female|woman/i.test(v.name)) ||
      langVoices[0] ||
      voices.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
      voices[0] ||
      null
    );
  }

  private activeSpeechLanguage(): string {
    return this.language() === 'auto' ? this.replyLanguage : this.language();
  }

  private recognitionLocale(): string {
    return this.speechLocale(this.activeSpeechLanguage());
  }

  private speechLocale(language: string): string {
    const code = language.toLowerCase();
    if (code.startsWith('ur')) return 'ur-PK';
    if (code.startsWith('ar')) return 'ar-SA';
    if (code.startsWith('en')) return 'en-US';
    return 'en-US';
  }

  private normalizeLanguage(language: string): string {
    const value = (language || 'auto').trim().toLowerCase();
    if (value === 'ur' || value === 'urdu') return 'ur';
    if (value === 'ar' || value === 'arabic') return 'ar';
    if (value === 'en' || value === 'english') return 'en';
    return 'auto';
  }

  private readStoredLanguage(): string | null {
    try {
      const raw = localStorage.getItem('bos.sophia.lang');
      return raw ? this.normalizeLanguage(raw) : null;
    } catch {
      return null;
    }
  }

  private writeStoredLanguage(language: string): void {
    try {
      localStorage.setItem('bos.sophia.lang', language);
    } catch {
      /* private mode */
    }
  }
}

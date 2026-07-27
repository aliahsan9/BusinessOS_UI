import { Injectable, OnDestroy, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AgentEmployeeService } from './agent-employee.service';
import { VoicePreference, VoiceUiState } from '../models/agent.model';

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
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal?: boolean }>;
};

/**
 * Browser STT + TTS for Sophia (English).
 */
@Injectable({ providedIn: 'root' })
export class SophiaVoiceService implements OnDestroy {
  private readonly agentService = inject(AgentEmployeeService);

  private recognition: SpeechRecognitionLike | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private audioObjectUrl: string | null = null;
  private prefs: VoicePreference | null = null;
  private pushToTalkActive = false;
  private speakGeneration = 0;

  readonly voiceState = signal<VoiceUiState>('idle');
  readonly isListening = computed(() => this.voiceState() === 'listening');
  readonly isSpeaking = computed(() => this.voiceState() === 'speaking');
  readonly isMuted = signal(false);
  readonly transcriptInterim = signal('');
  readonly lastSpokenText = signal('');
  readonly micSupported = signal(false);
  readonly ttsSupported = signal(typeof window !== 'undefined' && 'speechSynthesis' in window);
  readonly language = signal('en');
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
    try {
      const prefs = await firstValueFrom(this.agentService.getVoicePreferences());
      this.applyPreferences(prefs);
      return prefs;
    } catch {
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
  }

  applyPreferences(prefs: VoicePreference): void {
    this.prefs = prefs;
    this.language.set('en');
    this.autoSpeak.set(prefs.autoSpeak !== false);
    this.continuousListening.set(!!prefs.continuousListening);
    this.agentService.setPreferences({
      agentKey: prefs.preferredAgentKey || 'sophia',
      language: 'en',
    });
  }

  setProcessing(active: boolean): void {
    if (active) {
      this.stopSpeaking();
      this.voiceState.set('processing');
    } else if (this.voiceState() === 'processing') {
      this.voiceState.set('idle');
    }
  }

  setWorking(active: boolean): void {
    this.voiceState.set(active ? 'working' : 'idle');
  }

  startListening(options?: { pushToTalk?: boolean }): void {
    this.errorMessage.set(null);
    if (!this.micSupported()) {
      this.errorMessage.set('Speech recognition is not supported in this browser.');
      return;
    }

    this.stopSpeaking();
    const recognition = this.createRecognition();
    if (!recognition) return;

    this.recognition = recognition;
    this.pushToTalkActive = !!options?.pushToTalk;
    recognition.lang = 'en-US';
    recognition.continuous = this.continuousListening() && !this.pushToTalkActive;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
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
      if (event.error === 'aborted' || event.error === 'no-speech') {
        this.voiceState.set('idle');
        return;
      }
      this.errorMessage.set(
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Allow mic access to talk to Sophia.'
          : `Speech error: ${event.error}`,
      );
      this.voiceState.set('idle');
    };

    recognition.onend = () => {
      if (this.voiceState() === 'listening' && this.continuousListening() && !this.pushToTalkActive) {
        try {
          recognition.start();
          return;
        } catch {
          /* fall through */
        }
      }
      if (this.voiceState() === 'listening') {
        this.voiceState.set('idle');
      }
    };

    try {
      recognition.start();
      this.voiceState.set('listening');
    } catch {
      this.errorMessage.set('Could not start the microphone.');
      this.voiceState.set('idle');
    }
  }

  stopListening(): void {
    this.pushToTalkActive = false;
    try {
      this.recognition?.stop();
    } catch {
      /* ignore */
    }
    this.recognition = null;
    if (this.voiceState() === 'listening') {
      this.voiceState.set('idle');
    }
  }

  toggleListening(): void {
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  speak(text: string): void {
    if (!text.trim() || this.isMuted() || !this.autoSpeak()) return;
    this.stopSpeaking();
    this.stopListening();

    const spoken = this.cleanForSpeech(text);
    if (!spoken) return;

    this.lastSpokenText.set(text);
    const generation = ++this.speakGeneration;
    this.speakBrowser(spoken, generation);
  }

  stopSpeaking(): void {
    this.speakGeneration++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
    this.disposeAudio();
    if (this.voiceState() === 'speaking') this.voiceState.set('idle');
  }

  replay(): void {
    const text = this.lastSpokenText();
    if (text) this.speak(text);
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

  private speakBrowser(text: string, generation: number): void {
    if (!this.ttsSupported()) {
      this.voiceState.set('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
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
      if (generation === this.speakGeneration && this.voiceState() === 'speaking') {
        this.voiceState.set('idle');
      }
    };
    utterance.onerror = () => {
      this.utterance = null;
      if (generation === this.speakGeneration && this.voiceState() === 'speaking') {
        this.voiceState.set('idle');
      }
    };

    this.utterance = utterance;
    window.speechSynthesis.cancel();
    // Chrome sometimes needs a tick after cancel.
    setTimeout(() => {
      if (generation !== this.speakGeneration) return;
      window.speechSynthesis.speak(utterance);
    }, 20);
  }

  private disposeAudio(): void {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.src = '';
      } catch {
        /* ignore */
      }
      this.audioEl = null;
    }
    if (this.audioObjectUrl) {
      URL.revokeObjectURL(this.audioObjectUrl);
      this.audioObjectUrl = null;
    }
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

    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return (
      langVoices.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
      langVoices.find((v) => /female|woman/i.test(v.name)) ||
      langVoices[0] ||
      voices.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
      voices[0] ||
      null
    );
  }
}

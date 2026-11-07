let prismReady: Promise<void> | null = null;

export function loadPrism(): Promise<void> {
  prismReady ??= import('./prism-setup').then(() => undefined);
  return prismReady;
}

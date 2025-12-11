/// <reference types="vite/client" />

declare module 'vite-plugin-pwa';

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): void;
}

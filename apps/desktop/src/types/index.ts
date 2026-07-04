import type { MjolnirApi } from '../../electron/preload';
export * from '@mjolnir/shared-types';

declare global {
  interface Window {
    mjolnir: MjolnirApi;
  }
}

export type NavTab = 'dashboard' | 'builder' | 'editor' | 'monitoring' | 'distributed' | 'settings' | 'reports';

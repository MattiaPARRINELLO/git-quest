import { Capacitor } from '@capacitor/core';

export type Platform = 'android' | 'ios' | 'web';

/** Vrai dans la coquille native (Capacitor), faux dans la PWA. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function platform(): Platform {
  const value = Capacitor.getPlatform();
  return value === 'android' || value === 'ios' ? value : 'web';
}

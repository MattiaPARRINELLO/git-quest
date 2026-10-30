import { useEffect, useState } from 'react';

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'sandbox' }
  | { readonly name: 'lesson'; readonly chapterId: string }
  | { readonly name: 'mission'; readonly missionId: string }
  | { readonly name: 'not-found' };

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '').replace(/^\/+/, '');
  const parts = clean.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'sandbox') return { name: 'sandbox' };
  if (parts[0] === 'chapter' && parts[1] && parts[2] === 'lesson') {
    return { name: 'lesson', chapterId: parts[1] };
  }
  if (parts[0] === 'mission' && parts[1]) {
    return { name: 'mission', missionId: parts[1] };
  }
  return { name: 'not-found' };
}

export function navigate(path: string): void {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = target;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export const routePaths = {
  home: '#/',
  sandbox: '#/sandbox',
  lesson: (chapterId: string) => `#/chapter/${encodeURIComponent(chapterId)}/lesson`,
  mission: (missionId: string) => `#/mission/${encodeURIComponent(missionId)}`,
};

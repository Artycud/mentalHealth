'use client';

import { Fragment, useEffect, useSyncExternalStore } from 'react';

import { browser } from '@/content/th/browser';

import styles from './OpenInBrowser.module.css';

/** Once per visit: we try to jump out by ourselves only once, then just offer. */
const TRIED_KEY = 'cud-open-out-tried';

type InApp = { app: 'instagram' | 'facebook' | 'line'; os: 'ios' | 'android' | 'other' } | null;

/** "app os", or '' outside an app: a string, so the snapshot compares equal. */
function detect(): string {
  const ua = navigator.userAgent;
  const app = /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV|FB_IAB/i.test(ua) ? 'facebook' : /\bLine\//i.test(ua) ? 'line' : '';
  if (!app) return '';
  const os = /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : 'other';
  return `${app} ${os}`;
}

function parse(found: string): InApp {
  if (!found) return null;
  const [app, os] = found.split(' ') as [NonNullable<InApp>['app'], NonNullable<InApp>['os']];
  return { app, os };
}

/** The address of this page in the phone's own browser, where there is a way to say so. */
function outside(where: NonNullable<InApp>): string | null {
  const { href, host, pathname, search, hash } = window.location;
  if (where.app === 'line') {
    // LINE's own switch: it opens the link in the phone's browser.
    const url = new URL(href);
    url.searchParams.set('openExternalBrowser', '1');
    return url.toString();
  }
  if (where.os === 'android') {
    // Chrome, through an intent; any other browser if Chrome is not there.
    return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
  }
  // iOS 17 and later open Safari for this; older ones ignore it.
  if (where.os === 'ios') return `x-safari-https://${host}${pathname}${search}${hash}`;
  return null;
}

const subscribe = () => () => {};

/** Thai breaks lines inside words on some phones; keep each phrase whole. */
function Phrases({ text }: { text: string }) {
  return text.split(' ').map((phrase, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className={styles.phrase}>{phrase}</span>
    </Fragment>
  ));
}

/**
 * Opened inside Instagram (the story's link sticker), Facebook or LINE: try once
 * to move to the phone's own browser, and if we are still here, say why and
 * offer a button, with the app's own menu as the way that always works. An app's
 * browser keeps its own storage and may clear it, and the ระบาย chat is kept on
 * the phone (lib/vent), so in the real browser the student finds it again.
 * Renders nothing anywhere else (and on the server).
 */
export function OpenInBrowser() {
  const found = useSyncExternalStore(subscribe, detect, () => '');

  useEffect(() => {
    const where = parse(found);
    if (!where) return;
    try {
      if (sessionStorage.getItem(TRIED_KEY)) return;
      sessionStorage.setItem(TRIED_KEY, '1');
    } catch {
      return; // no storage: never risk a loop, just offer the button
    }
    const to = outside(where);
    if (to) window.location.href = to;
  }, [found]);

  const where = parse(found);
  if (!where) return null;
  const name = where.os === 'ios' ? browser.safari : where.os === 'android' ? browser.chrome : browser.other;
  const to = outside(where);

  return (
    <aside className={styles.slip}>
      <p className={styles.title}>{browser.title(name)}</p>
      <p className={styles.body}>
        <Phrases text={browser.body} />
      </p>
      {to && (
        <a className={styles.open} href={to} data-press>
          {browser.open(name)}
        </a>
      )}
      <p className={styles.manual}>
        <Phrases text={browser.manual(where.os === 'android' ? '⋮' : '⋯')} />
      </p>
    </aside>
  );
}

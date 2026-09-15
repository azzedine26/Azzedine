/**
 * Ostad DZ - Random Student Draw & Picker Service
 * 100% Offline, Secure RNG (crypto.getRandomValues), Web Audio Effects
 */

import { StudentItem } from '../types';

export const DRAW_PURPOSES = [
  'مشاركة شفوية في الدرس',
  'حل تمرين على السبورة',
  'سؤال فوري / مراجعة',
  'قراءة نص / وثيقة',
  'نشاط فردي / تجربة',
  'تقويم تشخيصي ومستمر',
  'توزيع المهام البيداغوجية',
] as const;

/**
 * Fair cryptographic random element selection
 */
export function selectFairRandomStudent(students: StudentItem[]): StudentItem | null {
  if (!students || students.length === 0) return null;
  if (students.length === 1) return students[0];

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const index = array[0] % students.length;
      return students[index];
    }
  } catch (e) {
    console.warn('Crypto RNG fallback to Math.random', e);
  }

  const randomIndex = Math.floor(Math.random() * students.length);
  return students[randomIndex];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleStudents(students: StudentItem[]): StudentItem[] {
  const arr = [...students];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Web Audio API synthesized sound effects (100% offline, zero network requests)
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a light mechanical click/tick during name shuffling
 */
export function playShuffleTickSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // Audio playback optional
  }
}

/**
 * Play cheerful victory chime on winner selection
 */
export function playVictoryChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      const startTime = ctx.currentTime + i * 0.08;
      const duration = 0.35;

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch {
    // Audio playback optional
  }
}

/**
 * Date/Time Formatting in Algerian locale
 */
export function formatDrawDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }).format(new Date(timestamp));
  } catch {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }
}

export function formatDrawTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  } catch {
    const d = new Date(timestamp);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}

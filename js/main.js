import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CHAPTERS, BESTIARY } from '../data/gameData.js';

const ICONS = {
  scroll: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  leaf: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  calm: `<svg class="svg-icon" style="margin:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  bolt: `<svg class="svg-icon" style="margin:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  paw: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>`,
  check: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  cross: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  lock: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  star: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  volOn: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volOff: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
};

// --- Web Audio API Synthesizer (Traditional Thai Ranat Ek, Ching & Khong Wong) ---
let audioCtx = null;
let isMuted = false;

function getAudioCtx() {
  if (isMuted) return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// Ranat Ek (ระนาดเอก) wooden mallet bar strike
function playRanatNote(freq, delay = 0, dur = 0.28, vol = 0.14) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;

  // Fundamental wood tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(vol, now + 0.006);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + dur + 0.02);

  // Wooden mallet overtone (~2.76x harmonic, fast decay)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.76, now);
  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.linearRampToValueAtTime(vol * 0.35, now + 0.004);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.08);
}

// Ching (ฉิ่ง) shimmering high bronze cymbal ring
function playChingRing(delay = 0, vol = 0.055) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  [3136, 4698, 6272].forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol / (idx + 1), now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.58);
  });
}

// Khong Wong (ฆ้องวง) resonant bronze gong note
function playKhongNote(freq, delay = 0, dur = 0.55, vol = 0.14) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  [1, 1.49, 2.02].forEach((ratio, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = idx === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq * ratio, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol / (idx * 1.8 + 1), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur / (idx * 0.5 + 1));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  });
}

function playTone(freq, duration = 0.16, _type = 'sine', vol = 0.09) {
  playRanatNote(freq, 0, duration, vol);
}

// ตอบถูก: ทำนองรัวระนาดเอกบันไดเสียงไทย (D-E-F#-A-B-D) + เสียงฉิ่งกังวาน
function playSuccessChord() {
  const notes = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66];
  notes.forEach((f, i) => {
    playRanatNote(f, i * 0.068, 0.34, 0.13);
  });
  playChingRing(0.36, 0.06);
}

// ตอบผิด: เสียงฆ้องวงทุ้มลงต่ำ 2 จังหวะ (นุ่มนวลแบบไทย ไม่แสบหู)
function playErrorTone() {
  playKhongNote(220.0, 0, 0.42, 0.13);
  playKhongNote(164.81, 0.17, 0.55, 0.15);
}

// --- Voiceover Player (iOS Safari / Android / Desktop compatible) ---
const voicePlayer = new Audio();
voicePlayer.preload = 'auto';
voicePlayer.playsInline = true;
let audioUnlocked = false;

function unlockMobileAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  getAudioCtx();
  // Silently prime HTMLAudioElement inside user gesture for iOS Safari
  voicePlayer.muted = true;
  voicePlayer.play().then(() => {
    voicePlayer.pause();
    voicePlayer.currentTime = 0;
    voicePlayer.muted = false;
  }).catch(() => {
    voicePlayer.muted = false;
  });
}

window.addEventListener('pointerdown', unlockMobileAudio, { once: true, passive: true });
window.addEventListener('touchstart', unlockMobileAudio, { once: true, passive: true });

let voiceQueue = [];

function stopVoiceover() {
  voiceQueue = [];
  voicePlayer.onended = null;
  voicePlayer.pause();
  voicePlayer.currentTime = 0;
}

function playVoiceover(src) {
  stopVoiceover();
  if (isMuted || !src) return;
  voicePlayer.src = src;
  voicePlayer.volume = 1.0;
  voicePlayer.play().catch(() => {});
}

function playVoiceSequence(sources) {
  stopVoiceover();
  if (isMuted || !sources || !sources.length) return;
  voiceQueue = sources.filter(Boolean);
  const playNext = () => {
    if (isMuted || !voiceQueue.length) {
      voicePlayer.onended = null;
      return;
    }
    const nextSrc = voiceQueue.shift();
    voicePlayer.src = nextSrc;
    voicePlayer.volume = 1.0;
    voicePlayer.onended = playNext;
    voicePlayer.play().catch(() => {});
  };
  playNext();
}

const CHAPTER_BACKDROPS = [
  './images/bg_ch1_pier.jpg',
  './images/bg_ch2_forest.jpg',
  './images/bg_ch3_peacock.jpg',
  './images/bg_ch4_stream.jpg'
];

// --- Animated SVG Cutscenes + Ink-Restoration Verses per Chapter ---
const CHAPTER_CUTSCENES = [
  {
    badge: 'คัทซีนบทที่ ๑ • หมึกแห่งความทรงจำกลับคืนสู่สมุดไทยขาว',
    title: 'ขบวนพยุหยาตราเคลื่อนพล ณ ท่าเจ้าสนุก',
    caption: 'ช้างทรง "เทพลีลา" และเครื่องสูงพุดตานทอง-ชุมสาย',
    verseLines: [
      'งามทรงองค์พระเจ้า      เสด็จเนาคชาธาร',
      'พุดตานทองตระการ      ชุมสายพรายพรรณราย',
      'พระทรงคชาธารแก้ว     เทพลีลา',
      'เครื่องสูงงามเลิศแล้ว    เลื่อนคล้อยตามสถล'
    ],
    note: 'บันทึกขบวนเสด็จทางสถลมารคกลับคืนสมบูรณ์ ช้างทรงเทพลีลาและขบวนเครื่องสูงเคลื่อนตัวสู่ถนนส่องกล้องอย่างสง่างาม',
    svg: `
      <svg viewBox="0 0 320 240" fill="none">
        <defs>
          <linearGradient id="csGold1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff4b8"/><stop offset="100%" stop-color="#c99700"/>
          </linearGradient>
        </defs>
        <!-- Sun rays -->
        <circle cx="255" cy="48" r="24" stroke="#f3d97d" stroke-width="1.8" class="svg-draw-path"/>
        <path d="M255 14 V20 M255 76 V82 M221 48 H227 M283 48 H289" stroke="#f3d97d" stroke-width="1.6" class="svg-draw-path svg-draw-delay-1"/>
        <!-- Royal Regalia Umbrella (ชุมสาย) -->
        <path d="M58 195 V68 M34 92 Q58 68 82 92 Z M30 116 Q58 92 86 116 Z M26 140 Q58 116 90 140 Z" stroke="url(#csGold1)" stroke-width="2.2" class="svg-draw-path"/>
        <!-- Royal Elephant (เทพลีลา) -->
        <path d="M110 192 L110 132 C110 100, 152 88, 198 94 C228 98, 240 120, 234 150 L234 192 L214 192 L214 156 L190 156 L190 192 L166 192 L166 156 L136 156 L136 192 Z" stroke="url(#csGold1)" stroke-width="2.6" stroke-linejoin="round" class="svg-draw-path svg-draw-delay-1"/>
        <!-- Elephant Trunk & Tusk -->
        <path d="M230 118 C254 118, 260 146, 248 168 C243 176, 234 172, 238 160" stroke="#f3d97d" stroke-width="2.4" stroke-linecap="round" class="svg-draw-path svg-draw-delay-2"/>
        <path d="M234 134 Q256 142 268 128" stroke="#fff9e2" stroke-width="2.5" stroke-linecap="round" class="svg-draw-path svg-draw-delay-2"/>
        <!-- Golden Howdah (พุดตานทอง) -->
        <path d="M142 94 L152 60 L194 60 L204 94 Z M152 60 L173 34 L194 60" stroke="#ffd700" stroke-width="2.4" fill="rgba(212,175,55,0.18)" class="svg-draw-path svg-draw-delay-2"/>
        <path d="M22 195 H298" stroke="#c99700" stroke-width="2" class="svg-draw-path svg-draw-delay-3"/>
      </svg>`
  },
  {
    badge: 'คัทซีนบทที่ ๒ • หมึกแห่งความทรงจำกลับคืนสู่สมุดไทยขาว',
    title: 'ไขปริศนาคำพ้องแห่งพงไพรลึก',
    caption: 'งูเขียวพันตุ๊กแก และเถากระไดลิง-ต้นลางลิง',
    verseLines: [
      'งูเขียวแล่นมาพัน      ตุ๊กแกอันคางแข็งขัน',
      'กัดกันไม่ปล่อยกัน      พากันตกจากคบไม้',
      'ฝูงลิงยิงฟันหลอก      หูลิงลางลิงไพร',
      'กระไดลิงไต่ไม้         สนุกแท้ในดง'
    ],
    note: 'แยกแยะ "สัตว์" และ "พันธุ์ไม้" ในบทเล่นคำพ้องได้แม่นยำ ป่าเขาพระพุทธบาทเปิดทางสู่ลานไพรเบื้องหน้า',
    svg: `
      <svg viewBox="0 0 320 240" fill="none">
        <!-- Ancient Banyan & Monkey Ladder Vine (กระไดลิง) -->
        <path d="M40 210 C55 150, 75 95, 130 58 C185 22, 245 38, 285 62" stroke="#d4af37" stroke-width="3" stroke-linecap="round" class="svg-draw-path"/>
        <path d="M90 88 C78 110, 102 128, 86 152 C74 170, 96 190, 84 210" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" class="svg-draw-path svg-draw-delay-1"/>
        <!-- Green Snake coiling (งูเขียว) -->
        <path d="M120 135 C138 95, 178 165, 205 112 C222 80, 250 102, 242 124" stroke="#4ade80" stroke-width="3.2" stroke-linecap="round" class="svg-draw-path svg-draw-delay-1"/>
        <circle cx="242" cy="124" r="4.5" fill="#4ade80" class="svg-fade-fill"/>
        <!-- Gecko silhouette (ตุ๊กแก) -->
        <path d="M148 148 Q175 132 208 146 Q226 154 246 144" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" class="svg-draw-path svg-draw-delay-2"/>
        <!-- Mountain Goat / Forest Leaves -->
        <path d="M48 188 Q80 165 116 188 Q152 168 188 188 Q232 165 280 192" stroke="#f3d97d" stroke-width="1.8" class="svg-draw-path svg-draw-delay-3"/>
      </svg>`
  },
  {
    badge: 'คัทซีนบทที่ ๓ • สีสันแห่งวรรณศิลป์กลับคืนสู่ผืนป่า',
    title: 'ลานรำยูงทองและไก่ฟ้าคืนชีวิต',
    caption: 'จินตภาพสีสัน เสียง และการเคลื่อนไหวอันวิจิตร',
    verseLines: [
      'ยูงทองย่องเยื้องย่าง    รำแพนหางกลางพนา',
      'เลื่อมลายพรายพรรณา    งามโสภาดั่งวาดเขียน',
      'แววหางดั่งดาวแดน      เดือนเด่นกลางไพร',
      'สีสดดังแต้มหน้า         น่าชมยิ่งนักเอย'
    ],
    note: 'พู่กันวรรณศิลป์คืนสีทอง มรกต และชาดสดใสให้ผืนป่าที่เคยขาวดำกลับมามีชีวิตชีวาอีกครั้ง',
    svg: `
      <svg viewBox="0 0 320 240" fill="none">
        <!-- Peacock Fanned Tail Rays -->
        <path d="M160 170 L62 96 M160 170 L88 64 M160 170 L122 44 M160 170 L160 36 M160 170 L198 44 M160 170 L232 64 M160 170 L258 96" stroke="#f3d97d" stroke-width="2" class="svg-draw-path"/>
        <path d="M56 100 A112 112 0 0 1 264 100" stroke="#34d399" stroke-width="2.4" stroke-dasharray="6 4" class="svg-draw-path svg-draw-delay-1"/>
        <!-- Feather Eyes -->
        <g class="svg-fade-fill">
          <circle cx="62" cy="96" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="88" cy="64" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="122" cy="44" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="160" cy="36" r="9" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="198" cy="44" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="232" cy="64" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
          <circle cx="258" cy="96" r="8" fill="#10b981" stroke="#ffd700" stroke-width="2"/>
        </g>
        <!-- Peacock Body & Neck -->
        <path d="M148 186 C142 162, 152 138, 160 120 C164 108, 174 108, 172 118 C168 136, 178 162, 172 186 Z" stroke="#38bdf8" stroke-width="2.6" fill="rgba(56,189,248,0.22)" class="svg-draw-path svg-draw-delay-2"/>
        <path d="M154 186 L148 212 M166 186 L172 212 M80 212 H240" stroke="#d4af37" stroke-width="2" class="svg-draw-path svg-draw-delay-3"/>
      </svg>`
  },
  {
    badge: 'คัทซีนบทที่ ๔ • สมุดไทยขาวสมบูรณ์ทุกประการ',
    title: 'ลำธารใสแห่งพระตำหนักธารเกษม',
    caption: 'ธารทองแดงใสสะอาด และฝูงมัจฉาชาติแหวกว่าย',
    verseLines: [
      'ธารไหลใสสะอาด        มัจฉาชาติว่ายเวียนวน',
      'จอกแหนแลเกลื่อนกล่น    กินสาหร่ายพรายพร่างตา',
      'ธารใสไหลเย็นชื่น        รื่นรมย์ชมมัจฉา',
      'น้ำใสเห็นหินน้อย        น่าน้อมใจยล'
    ],
    note: 'กาพย์ยานี ๑๑ และโคลงสี่สุภาพร้อยเรียงสมบูรณ์ ธารทองแดงใสสะอาดสะท้อนแสงทองเปิดประตูส่งเทียนกลับสู่โลกปัจจุบัน!',
    svg: `
      <svg viewBox="0 0 320 240" fill="none">
        <!-- Royal Pavilion Roof Silhouette (พระตำหนักธารเกษม) -->
        <path d="M110 88 L160 36 L210 88 M124 88 L160 52 L196 88 M132 88 V124 M188 88 V124" stroke="#f3d97d" stroke-width="2.2" class="svg-draw-path"/>
        <!-- Crystal Stream Waves -->
        <path d="M20 142 Q65 128 110 142 T200 142 T300 142" stroke="#38bdf8" stroke-width="2.4" class="svg-draw-path svg-draw-delay-1"/>
        <path d="M20 176 Q65 162 110 176 T200 176 T300 176" stroke="#34d399" stroke-width="2.2" class="svg-draw-path svg-draw-delay-2"/>
        <path d="M20 208 Q65 196 110 208 T200 208 T300 208" stroke="#38bdf8" stroke-width="1.8" class="svg-draw-path svg-draw-delay-2"/>
        <!-- Golden Swimming Fish (ฝูงมัจฉาชาติ) -->
        <path d="M96 160 Q124 142 150 160 Q124 178 96 160 Z M96 160 L80 148 L80 172 Z" stroke="#ffd700" stroke-width="2.4" fill="rgba(255,215,0,0.22)" class="svg-draw-path svg-draw-delay-2"/>
        <path d="M188 192 Q212 178 236 192 Q212 206 188 192 Z M188 192 L174 182 L174 202 Z" stroke="#f3d97d" stroke-width="2.2" fill="rgba(243,217,125,0.2)" class="svg-draw-path svg-draw-delay-3"/>
      </svg>`
  }
];

// --- Visual Novel Script Flow per Chapter ---
const CHAPTER_DIALOGUES = [
  [
    {
      speaker: 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)',
      text: 'อาลักษณ์น้อย! บัดนี้ขบวนเสด็จของสมเด็จพระเจ้าอยู่หัวบรมโกศขึ้นบก ณ "ท่าเจ้าสนุก" แล้ว แต่หมึกในสมุดไทยของเจ้าจางหายไปเสียได้',
      audio: './audio/ch1_line1.wav'
    },
    {
      speaker: 'เทียน (อาลักษณ์ฝึกหัด)',
      text: 'เอ๊ะ... ที่นี่คือยุคปลายกรุงศรีอยุธยาหรือครับ! ช้างทรง "เทพลีลา" และขบวนเครื่องสูงหยุดนิ่งไปหมดแล้ว ผมจะรีบซ่อมแซมบันทึกให้เดี๋ยวนี้ครับ!',
      audio: './audio/ch1_line2.wav'
    }
  ],
  [
    {
      speaker: 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)',
      text: 'เข้าสู่เขตพงไพรลึกแล้วอาลักษณ์น้อย จงสังเกตเลียงผา กระจง งูเขียวกับตุ๊กแก และระวังกลวิธีเล่นคำพ้องจากฝูงลิงให้ดี!',
      audio: './audio/ch2_line1.wav'
    },
    {
      speaker: 'เทียน (อาลักษณ์ฝึกหัด)',
      text: 'ทั้งต้นลางลิง หูลิง กระไดลิง... ชื่อคล้ายสัตว์ไปหมดเลยครับ ผมจะสแกนแยก "สัตว์" กับ "พันธุ์ไม้" ให้แม่นยำเลย!',
      audio: './audio/ch2_line2.wav'
    }
  ],
  [
    {
      speaker: 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)',
      text: 'ดูเถิด ผืนป่าช่วงนี้สูญเสียสีสันจนกลายเป็นขาวดำไร้ชีวิต จงใช้ "พู่กันวรรณศิลป์" เก็บจินตภาพจากนกยูงทองและไก่ฟ้าเพื่อคืนสีสันให้พนา!',
      audio: './audio/ch3_line1.wav'
    }
  ],
  [
    {
      speaker: 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)',
      text: 'เรามาถึง "ธารทองแดง" ใกล้พระตำหนักธารเกษมแล้ว แต่สายน้ำกลับขุ่นมัว จงเรียงร้อยกาพย์ห่อโคลงบทสุดท้ายให้สมบูรณ์ เพื่อเปิดทางกลับสู่โลกของเจ้าเถิด!',
      audio: './audio/ch4_line1.wav'
    }
  ]
];

// --- Game State ---
const state = {
  started: false,
  chapterIndex: 0,
  stepType: 'dialogue', // 'dialogue' | 'task' | 'chapter_done'
  dialogueIndex: 0,
  taskIndex: 0,
  score: 0,
  harmony: 100,
  completedTasks: new Set(),
  unlockedBestiary: new Set(),
  activeModal: false
};

// --- DOM Refs ---
const backdropLayer = document.getElementById('backdrop-layer');
const canvasContainer = document.getElementById('canvas-container');
const titleScreen = document.getElementById('title-screen');
const startBtn = document.getElementById('start-btn');
const btnTitleJournal = document.getElementById('btn-title-journal');
const btnAudio = document.getElementById('btn-audio');
const dragHint = document.getElementById('drag-hint');

const hudChapterTitle = document.getElementById('hud-chapter-title');
const hudChapterSub = document.getElementById('hud-chapter-sub');
const hudScore = document.getElementById('hud-score');
const hudHarmony = document.getElementById('hud-harmony');
const hudBestiaryCount = document.getElementById('hud-bestiary-count');

const vnDialogueBox = document.getElementById('vn-dialogue-box');
const vnSpeaker = document.getElementById('vn-speaker');
const vnText = document.getElementById('vn-text');
const vnHint = document.getElementById('vn-hint');
const toastEl = document.getElementById('toast');

const taskModal = document.getElementById('task-modal');
const taskModalTitle = document.getElementById('task-modal-title');
const taskModalBody = document.getElementById('task-modal-body');
const taskModalClose = document.getElementById('task-modal-close');

const bestiaryModal = document.getElementById('bestiary-modal');
const bestiaryGrid = document.getElementById('bestiary-grid');
const openBestiaryBtn = document.getElementById('open-bestiary-btn');
const bestiaryClose = document.getElementById('bestiary-close');

const chapterModal = document.getElementById('chapter-modal');
const chapterList = document.getElementById('chapter-list');
const chapterSelectBtn = document.getElementById('chapter-select-btn');
const chapterClose = document.getElementById('chapter-close');

const menuToggleBtn = document.getElementById('menu-toggle-btn');
const sideDrawer = document.getElementById('side-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawerCloseBtn = document.getElementById('drawer-close-btn');

function openDrawer() {
  sideDrawer.classList.add('open');
  drawerBackdrop.classList.add('open');
}

function closeDrawer() {
  sideDrawer.classList.remove('open');
  drawerBackdrop.classList.remove('open');
}

const cutsceneOverlay = document.getElementById('cutscene-overlay');
const cutsceneBadge = document.getElementById('cutscene-badge');
const cutsceneTitle = document.getElementById('cutscene-title');
const cutsceneSvgStage = document.getElementById('cutscene-svg-stage');
const cutsceneArtCaption = document.getElementById('cutscene-art-caption');
const cutsceneInkVerse = document.getElementById('cutscene-ink-verse');
const cutsceneInkNote = document.getElementById('cutscene-ink-note');
const cutsceneContinueBtn = document.getElementById('cutscene-continue-btn');
let cutsceneCallback = null;

function showToast(msg) {
  toastEl.innerHTML = `${ICONS.star}<span>${msg}</span>`;
  toastEl.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

// --- Three.js Transparent 3D Character Stage ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.55, 3.15);
camera.lookAt(0, 1.45, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasContainer.appendChild(renderer.domElement);

renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
}, false);

// Studio-style warm Thai lighting
scene.add(new THREE.AmbientLight(0xfff2d6, 1.15));

const keyLight = new THREE.DirectionalLight(0xffe4a8, 1.65);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xd4af37, 1.1);
rimLight.position.set(-4, 3, -3);
scene.add(rimLight);

// Floating Golden Ink Particles
const particleCount = 45;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePos[i * 3] = (Math.random() - 0.5) * 6;
  particlePos[i * 3 + 1] = Math.random() * 3.5;
  particlePos[i * 3 + 2] = (Math.random() - 0.5) * 3;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particles = new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({ color: 0xf3d97d, size: 0.045, transparent: true, opacity: 0.75 })
);
scene.add(particles);

// 3D Character Container (responsive: left on desktop, centered on mobile portrait)
const princeRoot = new THREE.Group();
let characterBaseY = -0.35;
scene.add(princeRoot);

function updateResponsiveCharacterLayout() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  if (aspect < 1.05) {
    // Portrait / Mobile: center character above dialogue box
    camera.fov = 38;
    camera.position.set(0, 1.48, 3.75);
    camera.lookAt(0, 1.38, 0);
    princeRoot.position.x = 0;
    characterBaseY = -0.15;
  } else if (aspect < 1.55) {
    // Tablet / 4:3: keep character comfortably inside the left edge (no clipping)
    camera.fov = 36;
    camera.position.set(0, 1.52, 3.45);
    camera.lookAt(0, 1.42, 0);
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * aspect;
    princeRoot.position.x = -halfW * 0.42;
    characterBaseY = -0.3;
  } else {
    // Widescreen / Desktop: frame upper body on the left
    camera.fov = 34;
    camera.position.set(0, 1.55, 3.15);
    camera.lookAt(0, 1.45, 0);
    princeRoot.position.x = -1.15;
    characterBaseY = -0.35;
  }
  princeRoot.position.y = characterBaseY;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
updateResponsiveCharacterLayout();

const princeModelGroup = new THREE.Group();
const tianModelGroup = new THREE.Group();
tianModelGroup.visible = false;
princeRoot.add(princeModelGroup);
princeRoot.add(tianModelGroup);

function loadCharacterGLB(url, targetGroup, fallbackColor, targetHeight = 2.65, yOffset = 0) {
  gltfLoader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = targetHeight / maxDim;
      model.scale.setScalar(scale);
      box.setFromObject(model);
      model.position.y = -box.min.y + yOffset;
      targetGroup.add(model);
    },
    undefined,
    () => {
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 1.7, 16),
        new THREE.MeshStandardMaterial({ color: fallbackColor, roughness: 0.4, metalness: 0.35 })
      );
      robe.position.y = 0.85;
      targetGroup.add(robe);
    }
  );
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
loadCharacterGLB('./models/prince.glb', princeModelGroup, 0xb8860b, 2.65, 0);
loadCharacterGLB('./models/tian.glb', tianModelGroup, 0x2b3a55, 2.25, 0.22);

function setActiveSpeakerModel(speakerName) {
  const isTian = speakerName && speakerName.includes('เทียน');
  princeModelGroup.visible = !isTian;
  tianModelGroup.visible = isTian;
  targetRotY = 0;
}

// Unified PointerEvent Drag Rotation (Mouse, Touch, Trackpad, Apple Pencil)
let isDragging = false;
let activePointerId = null;
let lastPointerX = 0;
let targetRotY = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (state.activeModal) return;
  isDragging = true;
  activePointerId = e.pointerId;
  lastPointerX = e.clientX;
  try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
});

function endPointerDrag(e) {
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  isDragging = false;
  activePointerId = null;
}

window.addEventListener('pointerup', endPointerDrag);
window.addEventListener('pointercancel', endPointerDrag);

window.addEventListener('pointermove', (e) => {
  if (!isDragging || state.activeModal || e.pointerId !== activePointerId) return;
  const dx = e.clientX - lastPointerX;
  targetRotY += dx * 0.011;
  lastPointerX = e.clientX;
});

window.addEventListener('resize', updateResponsiveCharacterLayout);
window.addEventListener('orientationchange', () => {
  setTimeout(updateResponsiveCharacterLayout, 180);
});

// --- Visual Novel & Chapter Flow ---
function startChapter(index) {
  state.chapterIndex = index;
  state.stepType = 'dialogue';
  state.dialogueIndex = 0;
  state.taskIndex = 0;

  updateBackdropFilter();
  updateHUD();
  showCurrentDialogue();
}

function updateBackdropFilter() {
  const chapter = CHAPTERS[state.chapterIndex];
  const bgUrl = CHAPTER_BACKDROPS[state.chapterIndex] || './images/bg_ch1_pier.jpg';
  backdropLayer.style.backgroundImage = `linear-gradient(180deg, rgba(8, 17, 13, 0.35) 0%, rgba(8, 17, 13, 0.72) 100%), url('${bgUrl}')`;

  const doneCount = chapter.tasks.filter((t) => state.completedTasks.has(t.id)).length;
  backdropLayer.classList.remove('monochrome', 'half-color');
  if (chapter.monochromeStart) {
    if (doneCount === 0) backdropLayer.classList.add('monochrome');
    else if (doneCount < chapter.tasks.length) backdropLayer.classList.add('half-color');
  }
}

function showChapterCutscene(chapterIdx, onDone) {
  const cs = CHAPTER_CUTSCENES[chapterIdx];
  if (!cs) {
    if (onDone) onDone();
    return;
  }
  state.activeModal = true;
  cutsceneCallback = onDone;
  cutsceneBadge.textContent = cs.badge;
  cutsceneTitle.textContent = cs.title;
  cutsceneArtCaption.textContent = cs.caption;
  cutsceneSvgStage.innerHTML = cs.svg;
  cutsceneInkNote.textContent = cs.note;

  // Staggered ink-bloom lines restoring on Samut Thai Khao parchment
  cutsceneInkVerse.innerHTML = '';
  cs.verseLines.forEach((line, idx) => {
    const span = document.createElement('span');
    span.className = 'ink-line';
    span.style.animationDelay = `${0.4 + idx * 0.48}s`;
    span.textContent = line;
    cutsceneInkVerse.appendChild(span);
  });

  cutsceneOverlay.classList.remove('hidden');
  playSuccessChord();
}

function updateHUD() {
  const chapter = CHAPTERS[state.chapterIndex];
  hudChapterTitle.innerHTML = `${ICONS.scroll}${chapter.title}`;
  hudChapterSub.textContent = chapter.location;
  hudScore.textContent = state.score;
  hudHarmony.textContent = state.harmony;
  hudBestiaryCount.textContent = `${state.unlockedBestiary.size}/${Object.keys(BESTIARY).length}`;
}

function showCurrentDialogue() {
  const lines = CHAPTER_DIALOGUES[state.chapterIndex];
  const line = lines[state.dialogueIndex];
  vnSpeaker.textContent = line.speaker;
  vnText.textContent = line.text;
  vnHint.textContent = 'แตะเพื่ออ่านต่อ';
  vnDialogueBox.classList.remove('hidden');
  setActiveSpeakerModel(line.speaker);
  playVoiceover(line.audio);
}

function advanceVN() {
  if (state.activeModal) return;
  stopVoiceover();
  playTone(587.33, 0.1, 'sine', 0.06);

  const chapter = CHAPTERS[state.chapterIndex];
  const lines = CHAPTER_DIALOGUES[state.chapterIndex];

  if (state.stepType === 'dialogue') {
    if (state.dialogueIndex < lines.length - 1) {
      state.dialogueIndex++;
      showCurrentDialogue();
    } else {
      state.stepType = 'task';
      openTaskModal(chapter.tasks[state.taskIndex]);
    }
  } else if (state.stepType === 'chapter_done') {
    if (state.chapterIndex < CHAPTERS.length - 1) {
      startChapter(state.chapterIndex + 1);
    } else {
      showVictory();
    }
  } else if (state.stepType === 'task') {
    openTaskModal(chapter.tasks[state.taskIndex]);
  }
}

// --- Task & Puzzle Modal ---
function openTaskModal(task) {
  state.activeModal = true;
  taskModalTitle.textContent = task.name;
  taskModalBody.innerHTML = '';
  taskModal.classList.add('open');

  if (task.moralChoice && !state.completedTasks.has(task.id)) {
    renderMoralChoice(task);
  } else {
    renderPuzzle(task, null);
  }
}

function renderMoralChoice(task) {
  const mc = task.moralChoice;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="scenario-card">
      <div class="scenario-badge">${ICONS.leaf}ทางเลือกแห่งความรื่นรมย์ของธรรมชาติ</div>
      <p class="scenario-text">${mc.scenario}</p>
    </div>
    <div class="option-list">
      <button class="option-btn choice-card choice-calm" id="choice-calm">
        <span class="choice-icon">${ICONS.calm}</span>
        <span class="choice-body">${mc.calm.text}</span>
      </button>
      <button class="option-btn choice-card choice-harm" id="choice-harm">
        <span class="choice-icon">${ICONS.bolt}</span>
        <span class="choice-body">${mc.harm.text}</span>
      </button>
    </div>
  `;
  taskModalBody.appendChild(wrap);
  playVoiceover(`./audio/moral_${task.id}.mp3`);

  wrap.querySelector('#choice-calm').addEventListener('click', () => {
    state.harmony = Math.min(120, state.harmony + mc.calm.harmonyDelta);
    updateHUD();
    playSuccessChord();
    renderPuzzle(task, mc.calm.hint);
  });

  wrap.querySelector('#choice-harm').addEventListener('click', () => {
    state.harmony = Math.max(0, state.harmony + mc.harm.harmonyDelta);
    updateHUD();
    playErrorTone();
    showToast(mc.harm.feedback);
    renderPuzzle(task, null);
  });
}

function renderPuzzle(task, hintText) {
  taskModalBody.innerHTML = '';

  if (hintText) {
    const hint = document.createElement('div');
    hint.className = 'hint-box';
    hint.textContent = hintText;
    taskModalBody.appendChild(hint);
    playVoiceSequence([`./audio/hint_${task.id}.mp3`, `./audio/prompt_${task.id}.mp3`]);
  } else {
    playVoiceover(`./audio/prompt_${task.id}.mp3`);
  }

  const promptP = document.createElement('p');
  promptP.style.marginBottom = '10px';
  promptP.textContent = task.prompt;
  taskModalBody.appendChild(promptP);

  if (task.type === 'verse_pair') {
    const kapBox = document.createElement('div');
    kapBox.className = 'verse-box';
    kapBox.innerHTML = `<strong style="color:var(--gold-light);">กาพย์ยานี ๑๑:</strong>\n${task.kapDisplay}`;
    taskModalBody.appendChild(kapBox);

    const list = document.createElement('div');
    list.className = 'option-list';
    task.klongOptions.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (idx === task.correctKlongIndex) {
          btn.classList.add('correct');
          completeTask(task);
        } else {
          btn.classList.add('wrong');
          playErrorTone();
          showToast('ยังไม่ตรงตามความหมายของกาพย์ห่อโคลง ลองสังเกตคำสำคัญอีกครั้ง!');
        }
      });
      list.appendChild(btn);
    });
    taskModalBody.appendChild(list);
  } else if (task.type === 'quiz') {
    const qBox = document.createElement('div');
    qBox.className = 'verse-box';
    qBox.textContent = task.question;
    taskModalBody.appendChild(qBox);

    const list = document.createElement('div');
    list.className = 'option-list';
    task.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (idx === task.correctIndex) {
          btn.classList.add('correct');
          showToast(task.explanation);
          completeTask(task);
        } else {
          btn.classList.add('wrong');
          playErrorTone();
          showToast('ลองทบทวนคำศัพท์อีกครั้งนะ!');
        }
      });
      list.appendChild(btn);
    });
    taskModalBody.appendChild(list);
  } else if (task.type === 'wordplay_scan') {
    const thaiNums = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘'];
    const selections = {};
    const cards = [];
    const grid = document.createElement('div');
    grid.className = 'wordplay-grid';

    task.items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'wordplay-card';
      card.innerHTML = `
        <div class="wordplay-card-head">
          <h4>${item.word}</h4>
          <span class="wordplay-num">${thaiNums[idx] || idx + 1}</span>
        </div>
        <div class="wordplay-actions">
          <button data-cat="animal">${ICONS.paw}สัตว์</button>
          <button data-cat="plant">${ICONS.leaf}พันธุ์ไม้</button>
        </div>
        <div class="wordplay-note" id="note-${idx}"></div>
      `;
      const btns = card.querySelectorAll('button');
      btns.forEach((b) => {
        b.addEventListener('click', () => {
          btns.forEach((x) => x.classList.remove('selected'));
          b.classList.add('selected');
          card.classList.remove('is-correct', 'is-wrong');
          selections[idx] = b.dataset.cat;
          playTone(659.25, 0.08, 'sine', 0.05);
        });
      });
      cards.push(card);
      grid.appendChild(card);
    });
    taskModalBody.appendChild(grid);

    const submitWrap = document.createElement('div');
    submitWrap.className = 'wordplay-submit-wrap';
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary btn-shine';
    submitBtn.innerHTML = `${ICONS.check}ตรวจคำตอบการแยกแยะคำพ้อง`;
    submitBtn.addEventListener('click', () => {
      let allCorrect = true;
      task.items.forEach((item, idx) => {
        const noteEl = document.getElementById(`note-${idx}`);
        const card = cards[idx];
        card.classList.remove('is-correct', 'is-wrong');
        if (selections[idx] === item.category) {
          card.classList.add('is-correct');
          noteEl.innerHTML = `${ICONS.check}ถูกต้อง: ${item.note}`;
          noteEl.style.color = '#34d399';
        } else {
          allCorrect = false;
          card.classList.add('is-wrong');
          noteEl.innerHTML = `${ICONS.cross}ยังไม่ถูก ลองแยกใหม่นะ`;
          noteEl.style.color = '#f87171';
        }
      });
      if (allCorrect) {
        completeTask(task);
      } else {
        playErrorTone();
      }
    });
    submitWrap.appendChild(submitBtn);
    taskModalBody.appendChild(submitWrap);
  }
}

function completeTask(task) {
  stopVoiceover();
  if (!state.completedTasks.has(task.id)) {
    state.score += 100;
  }
  state.completedTasks.add(task.id);
  if (task.bestiaryId) state.unlockedBestiary.add(task.bestiaryId);
  playSuccessChord();
  updateBackdropFilter();
  updateHUD();
  showToast(`ซ่อมแซม ${task.name} สำเร็จ! +100 คะแนนวรรณศิลป์`);

  setTimeout(() => {
    closeAllModals();
    setActiveSpeakerModel('เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)');
    const chapter = CHAPTERS[state.chapterIndex];
    if (state.taskIndex < chapter.tasks.length - 1) {
      state.taskIndex++;
      vnSpeaker.textContent = 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)';
      vnText.textContent = `ยอดเยี่ยมมากอาลักษณ์น้อย! หมึกแห่งความทรงจำเริ่มกลับคืนมาแล้ว มาซ่อมแซมบันทึกถัดไปเรื่อง "${chapter.tasks[state.taskIndex].name}" กันเถิด`;
      vnHint.textContent = 'แตะเพื่อทำภารกิจถัดไป';
      if (chapter.tasks[state.taskIndex].id === 'ch1_regalia') {
        playVoiceover('./audio/ch1_next_regalia.wav');
      } else if (chapter.tasks[state.taskIndex].id === 'ch2_monkey_wordplay') {
        playVoiceover('./audio/ch2_next_monkeys.wav');
      } else if (chapter.tasks[state.taskIndex].id === 'ch3_pheasant') {
        playVoiceover('./audio/ch3_next_pheasant.wav');
      }
    } else {
      state.stepType = 'chapter_done';
      showChapterCutscene(state.chapterIndex, () => {
        vnSpeaker.textContent = 'เจ้าฟ้าธรรมธิเบศร (เจ้าฟ้ากุ้ง)';
        vnText.textContent =
          state.chapterIndex < CHAPTERS.length - 1
            ? `ดีมาก! บันทึกใน "${chapter.title}" กลับคืนสมบูรณ์แล้ว พร้อมออกเดินทางสู่บทถัดไปหรือยัง?`
            : 'สายน้ำแห่งธารทองแดงกลับมาใสสะอาดแล้ว! บัดนี้สมุดไทยขาวสมบูรณ์ทุกประการ จงกลับสู่โลกปัจจุบันพร้อมความรู้ที่จารึกไว้ในใจเถิด!';
        vnHint.textContent =
          state.chapterIndex < CHAPTERS.length - 1 ? 'แตะเพื่อเดินทางสู่บทถัดไป' : 'แตะเพื่อชมบทสรุป';
        if (state.chapterIndex === 0) {
          playVoiceover('./audio/ch1_complete.wav');
        } else if (state.chapterIndex === 1) {
          playVoiceover('./audio/ch2_complete.wav');
        } else if (state.chapterIndex === 2) {
          playVoiceover('./audio/ch3_complete.wav');
        } else if (state.chapterIndex === 3) {
          playVoiceover('./audio/ch4_complete.wav');
        }
      });
    }
  }, 850);
}

function closeAllModals() {
  stopVoiceover();
  state.activeModal = false;
  taskModal.classList.remove('open');
  bestiaryModal.classList.remove('open');
  chapterModal.classList.remove('open');
}

// --- Bestiary Modal ---
function openBestiary() {
  state.activeModal = true;
  bestiaryGrid.innerHTML = '';
  Object.entries(BESTIARY).forEach(([id, entry]) => {
    const unlocked = state.unlockedBestiary.has(id);
    const card = document.createElement('div');
    card.className = `bestiary-card${unlocked ? '' : ' locked'}`;
    if (unlocked) {
      card.innerHTML = `
        <div class="bestiary-svg">${entry.svg}</div>
        <div class="bestiary-tag">${entry.category}</div>
        <h4>${entry.title}</h4>
        <div class="bestiary-vocab">${entry.vocab}</div>
        <p style="font-size:0.9rem; line-height:1.55;">${entry.meaning}</p>
      `;
    } else {
      card.innerHTML = `<p>${ICONS.lock}ยังไม่ค้นพบ<br/><small>ดำเนินเรื่องเพื่อปลดล็อก</small></p>`;
    }
    bestiaryGrid.appendChild(card);
  });
  bestiaryModal.classList.add('open');
}

// --- Chapter Selector Modal ---
function openChapterModal() {
  state.activeModal = true;
  chapterList.innerHTML = '';
  CHAPTERS.forEach((ch, idx) => {
    const done = ch.tasks.filter((t) => state.completedTasks.has(t.id)).length;
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${ch.title} — ${ch.subtitle} (${done}/${ch.tasks.length})`;
    btn.addEventListener('click', () => {
      closeAllModals();
      titleScreen.classList.add('hidden');
      dragHint.classList.remove('hidden');
      state.started = true;
      startChapter(idx);
    });
    chapterList.appendChild(btn);
  });
  chapterModal.classList.add('open');
}

// --- Victory Modal ---
function showVictory() {
  state.activeModal = true;
  taskModalTitle.innerHTML = `${ICONS.star}ผ่านครบทั้ง ๔ บท! ธารทองแดงกลับมาใสสะอาด`;
  taskModalBody.innerHTML = `
    <div class="verse-box">
      สายน้ำแห่งธารทองแดงสะท้อนแสงทองของสมุดไทยขาวกลับคืนมาอย่างสมบูรณ์
      เทียนตื่นขึ้นบนโต๊ะเรียนพร้อมความรู้เรื่อง <strong>กาพย์ห่อโคลงประพาสธารทองแดง</strong>
      ทั้งขบวนพยุหยาตรา กลวิธีเล่นคำพ้อง จินตภาพสีสัน และฉันทลักษณ์กาพย์ห่อโคลงอย่างแม่นยำ!
    </div>
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-num">${state.score}</div>
        <div class="stat-label">คะแนนวรรณศิลป์รวม</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${state.harmony}</div>
        <div class="stat-label">ความรื่นรมย์ของธรรมชาติ</div>
      </div>
    </div>
    <button class="btn-primary" id="replay-btn">เล่นใหม่อีกครั้ง</button>
  `;
  taskModal.classList.add('open');
  playSuccessChord();
  document.getElementById('replay-btn').addEventListener('click', () => {
    closeAllModals();
    startChapter(0);
  });
}

// --- Events ---
startBtn.addEventListener('click', () => {
  unlockMobileAudio();
  state.started = true;
  titleScreen.classList.add('hidden');
  dragHint.classList.remove('hidden');
  startChapter(0);
  playSuccessChord();
});

vnDialogueBox.addEventListener('click', advanceVN);
vnDialogueBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') advanceVN();
});

menuToggleBtn.addEventListener('click', openDrawer);
drawerCloseBtn.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

btnTitleJournal.addEventListener('click', openBestiary);
openBestiaryBtn.addEventListener('click', () => {
  closeDrawer();
  openBestiary();
});
chapterSelectBtn.addEventListener('click', () => {
  closeDrawer();
  openChapterModal();
});
taskModalClose.addEventListener('click', closeAllModals);
bestiaryClose.addEventListener('click', closeAllModals);
chapterClose.addEventListener('click', closeAllModals);

cutsceneContinueBtn.addEventListener('click', () => {
  cutsceneOverlay.classList.add('hidden');
  state.activeModal = false;
  if (cutsceneCallback) {
    const cb = cutsceneCallback;
    cutsceneCallback = null;
    cb();
  }
});

btnAudio.addEventListener('click', () => {
  isMuted = !isMuted;
  if (isMuted) stopVoiceover();
  btnAudio.innerHTML = isMuted ? `${ICONS.volOff}เสียง: ปิด` : `${ICONS.volOn}เสียง: เปิด`;
});

// --- Render Loop ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Gentle breathing + smooth mouse/touch rotation on 3D Character
  princeRoot.position.y = characterBaseY + Math.sin(t * 1.6) * 0.025;
  if (!isDragging) {
    princeRoot.rotation.y += (targetRotY + Math.sin(t * 0.5) * 0.08 - princeRoot.rotation.y) * 0.06;
  } else {
    princeRoot.rotation.y += (targetRotY - princeRoot.rotation.y) * 0.18;
  }

  particles.rotation.y = t * 0.08;
  renderer.render(scene, camera);
}

animate();

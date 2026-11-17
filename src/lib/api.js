// mock API. 모든 화면은 이 파일만 호출한다.
// 지금은 localStorage에 저장하고 네트워크 지연을 흉내 낸다. 백엔드를 붙일 때 이 파일만 바꾼다.
import { makeSeed } from '../data/seed.js';

const KEY = 'rdt.db.v2';
const wait = (ms = 300 + Math.random() * 500) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 저장소 접근 불가 */ }
  const db = makeSeed();
  save(db);
  return db;
}
let mem = null;
function db() { return (mem ||= load()); }
function save(d = mem) {
  mem = d;
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 메모리에만 유지 */ }
}
const nextId = (prefix) => {
  const d = db();
  d.seq = (d.seq || 1200) + 1;
  return `${prefix}-${String(d.seq).padStart(4, '0')}`;
};
const token = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

function sendMail(to, kind, subject, ref, extra = {}) {
  const m = { id: nextId('M'), to, kind, subject, ref, sentAt: now(), ...extra };
  db().mails.unshift(m);
  return m;
}

export const api = {
  async stats() {
    await wait(150);
    const r = db().responses;
    const done = r.filter((x) => x.durationSec);
    return {
      responses: r.length + 1180,
      avgSec: done.length ? Math.round(done.reduce((s, x) => s + x.durationSec, 0) / done.length) : 520,
      peers: db().invites.filter((i) => i.doneAt).length + 2210,
      rev: 3,
    };
  },
  async recent(n = 8) {
    await wait(150);
    return db().responses.slice(0, n);
  },
  async createResponse(data) {
    await wait(900);
    const id = nextId('RD');
    const r = { id, createdAt: now(), status: '완료', ...data };
    db().responses.unshift(r);
    save();
    return r;
  },
  async getResponse(id) {
    await wait(200);
    return db().responses.find((r) => r.id === id) || null;
  },
  async sendReport(id, { email, name, agree }) {
    await wait(1100);
    const r = db().responses.find((x) => x.id === id);
    if (!r) throw new Error('진단 기록을 찾지 못했다');
    Object.assign(r, { email, name, agree, reportSentAt: now() });
    const m = sendMail(email, 'report', `[평판진단] ${name || ''}님의 진단 리포트 ${id}`, id);
    db().session = { email, at: now() };
    save();
    return m;
  },

  // 360 타인 평가
  async savePrediction(rid, prediction) {
    await wait(300);
    const r = db().responses.find((x) => x.id === rid);
    if (r) r.prediction = { ...prediction, at: now() };
    save();
    return r?.prediction;
  },
  async invites(rid) {
    await wait(200);
    return db().invites.filter((i) => i.rid === rid);
  },
  async createInvites(rid, people) {
    await wait(700);
    const r = db().responses.find((x) => x.id === rid);
    const out = people.map((p) => {
      const inv = { token: token(), rid, name: p.name, relation: p.relation, email: p.email || '', sentAt: now(), doneAt: null };
      db().invites.push(inv);
      if (p.email) sendMail(p.email, 'invite', `[평판진단] ${r?.name || '동료'}님이 4분짜리 평가를 부탁했습니다`, inv.token);
      return inv;
    });
    save();
    return out;
  },
  async getInvite(tok) {
    await wait(200);
    const inv = db().invites.find((i) => i.token === tok);
    if (!inv) return null;
    const r = db().responses.find((x) => x.id === inv.rid);
    return { ...inv, owner: r?.name || '요청자', target: r?.profile?.target };
  },
  async submitInvite(tok, answers, sentence) {
    await wait(800);
    const inv = db().invites.find((i) => i.token === tok);
    if (!inv) throw new Error('링크가 만료됐다');
    Object.assign(inv, { answers, sentence, doneAt: now() });
    save();
    return inv;
  },
  async demoFillInvites(rid) {
    await wait(600);
    const lines = ['일이 막히면 결국 찾게 되는 사람', '숫자로 설득하는 사람', '꼼꼼하지만 속도가 빠른 사람', '어려운 이야기를 먼저 꺼내는 사람', '조용히 끝까지 책임지는 사람'];
    const self = db().responses.find((x) => x.id === rid);
    db().invites.filter((i) => i.rid === rid && !i.doneAt).forEach((inv, k) => {
      const answers = {};
      Object.entries(self?.answers || {}).forEach(([key, v]) => {
        if (/^[atn]\d$/.test(key)) answers[key] = Math.max(1, Math.min(5, (v || 3) + Math.round(Math.random() * 2 - (key[0] === 'n' ? 1.4 : 0.6))));
      });
      Object.assign(inv, { answers, sentence: lines[k % lines.length], doneAt: now() });
    });
    save();
  },

  // 상담
  async busySlots() {
    await wait(200);
    return db().consults.filter((c) => c.status !== '취소').map((c) => `${c.date} ${c.time}`);
  },
  async createConsult(data) {
    await wait(1000);
    const c = { id: nextId('C'), createdAt: now(), status: '신청', ...data };
    db().consults.unshift(c);
    const m = sendMail(data.email, 'consult', `[평판진단] 상담 신청 확인 ${c.date} ${c.time}`, c.id);
    db().session = { email: data.email, at: now() };
    save();
    return { consult: c, mail: m };
  },
  async consults() {
    await wait(200);
    return db().consults;
  },
  async updateConsult(id, patch) {
    await wait(250);
    const c = db().consults.find((x) => x.id === id);
    Object.assign(c, patch, { updatedAt: now() });
    save();
    return c;
  },

  // 메일 미리보기
  async mail(id) {
    await wait(150);
    const m = db().mails.find((x) => x.id === id);
    if (!m) return null;
    let ref = null;
    if (m.kind === 'report') ref = db().responses.find((r) => r.id === m.ref);
    if (m.kind === 'consult') ref = db().consults.find((r) => r.id === m.ref);
    if (m.kind === 'invite') ref = db().invites.find((r) => r.token === m.ref);
    return { ...m, refObj: ref };
  },

  // 내 진단함 (매직링크 흉내)
  async requestLogin(email) {
    await wait(800);
    const m = sendMail(email, 'magic', '[평판진단] 로그인 링크', email);
    save();
    return m;
  },
  async confirmLogin(email) {
    await wait(300);
    db().session = { email, at: now() };
    save();
  },
  session() { return db().session || null; },
  logout() { db().session = null; save(); },
  async mine(email) {
    await wait(300);
    const responses = db().responses.filter((r) => r.email === email);
    const ids = new Set(responses.map((r) => r.id));
    return {
      responses,
      consults: db().consults.filter((c) => c.email === email),
      invites: db().invites.filter((i) => ids.has(i.rid)),
      mails: db().mails.filter((m) => m.to === email),
    };
  },

  // 한 문장 빌더, 로드맵
  async sentences(key) { await wait(150); return db().sentences[key] || []; },
  async saveSentences(key, list) { await wait(400); db().sentences[key] = list; save(); return list; },
  async roadmap(rid) { await wait(150); return db().roadmaps[rid] || null; },
  async saveRoadmap(rid, data) { await wait(350); db().roadmaps[rid] = { ...data, savedAt: now() }; save(); return db().roadmaps[rid]; },

  // 관리자
  adminAuthed() { try { return sessionStorage.getItem('rdt.admin') === '1'; } catch (e) { return false; } },
  async adminLogin(pw) {
    await wait(500);
    if (pw !== 'atn2026') throw new Error('비밀번호가 맞지 않는다');
    try { sessionStorage.setItem('rdt.admin', '1'); } catch (e) { /* 무시 */ }
  },
  adminLogout() { try { sessionStorage.removeItem('rdt.admin'); } catch (e) { /* 무시 */ } },
  async adminData() {
    await wait(400);
    const d = db();
    return { responses: d.responses, consults: d.consults, invites: d.invites, mails: d.mails, notes: d.notes };
  },
  async addNote(rid, text) {
    await wait(250);
    (db().notes[rid] ||= []).unshift({ at: now(), text, by: '전문가' });
    save();
    return db().notes[rid];
  },
  async resetDemo() {
    try { localStorage.removeItem(KEY); localStorage.removeItem('rdt.draft.v2'); } catch (e) { /* 무시 */ }
    mem = null;
    db();
  },
};

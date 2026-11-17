// 이 기기에서만 쓰는 작은 상태: 진행 중인 응답, 마지막 진단 ID
const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } };
const del = (k) => { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } };

export const draft = {
  load: () => get('rdt.draft.v2', null),
  save: (d) => set('rdt.draft.v2', d),
  clear: () => del('rdt.draft.v2'),
};
export const lastId = {
  get: () => get('rdt.last', null),
  set: (id) => set('rdt.last', id),
};
export const unlocked = {
  has: (id) => get('rdt.unlocked', []).includes(id),
  add: (id) => set('rdt.unlocked', [...new Set([...get('rdt.unlocked', []), id])]),
};

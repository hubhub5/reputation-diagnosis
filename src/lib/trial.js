// 체험판 빌드(VITE_TRIAL=1): 응답은 이 탭 안에만 두고, 탭을 닫으면 사라진다. 로그인·메일 입력 없이 리포트까지 연다.
export const TRIAL = import.meta.env.VITE_TRIAL === '1';
const mem = new Map();
const memory = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
function pick() {
  try { return TRIAL ? sessionStorage : localStorage; } catch (e) { return memory; }
}
export const box = pick();

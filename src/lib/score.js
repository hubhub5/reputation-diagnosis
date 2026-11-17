import { DIMS, ATN, CONTRIB, ATN_ITEMS, ROLES, REQ_STATES, SCENES, DISTORTIONS } from '../data/test.js';

const pct = (v) => Math.round(((v - 1) / 4) * 100);
const avg = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null);
export const roleById = (id) => ROLES.find((r) => r.id === id) || ROLES[0];
export const dimById = (id) => DIMS.find((d) => d.id === id);

export function level(v) {
  if (v == null) return '자료 부족';
  if (v >= 70) return '높음';
  if (v >= 45) return '보통';
  return '낮음';
}

// answers: { [itemId]: 1..5 | 0(판단 어려움) }
export function scoreDims(answers) {
  return DIMS.map((d) => {
    const items = CONTRIB.filter((c) => c.dim === d.id);
    const vals = items.map((i) => answers[i.id]).filter((v) => v > 0);
    const score = avg(vals.map(pct));
    const raw = items.map((i) => answers[i.id] || 0);
    const split = raw[0] > 0 && raw[1] > 0 && Math.abs(raw[0] - raw[1]) >= 3;
    return { ...d, score, split, selfVsAct: raw };
  });
}

export function scoreAtn(answers, items = ATN_ITEMS) {
  const out = {};
  for (const a of ATN) {
    const its = items.filter((i) => i.dim === a.id);
    const vals = its.map((i) => answers[i.id]).filter((v) => v > 0);
    const unknown = its.length - vals.length;
    out[a.id] = { ...a, score: unknown > its.length / 2 ? null : avg(vals.map(pct)), unknown };
  }
  return out;
}

export const PATTERNS = {
  aware_untrusted: { name: '알려졌지만 맡겨지지 않음', d: '알려져 있지만 중요한 역할을 맡길 근거가 부족하다.', rx: '보여 주는 활동보다 책임을 맡아 결과를 낸 장면을 쌓는다.' },
  hidden_trusted: { name: '가까이서만 인정받음', d: '가까운 관계에서는 인정받지만 밖으로 넓어지지 않는다.', rx: '이미 맡겨지는 일을 조직 밖에서도 확인되는 형태로 기록한다.' },
  trusted_unexplained: { name: '잘하지만 설명되지 않음', d: '잘하는 사람이지만 무엇을 잘하는 사람인지 설명하기 어렵다.', rx: '흩어진 성과를 한 문장으로 묶고, 그 문장을 주변이 쓰게 만든다.' },
  story_unverified: { name: '문장이 증거보다 앞섬', d: '설명은 선명하지만 그 문장을 뒷받침할 행동 증거가 부족하다.', rx: '문장을 줄이고, 문장이 약속하는 일을 실제로 맡아 증거를 만든다.' },
  balanced_high: { name: '세 영역이 고르게 형성됨', d: '인지, 신뢰, 서사가 고르게 높다. 다음 역할과의 방향만 맞추면 된다.', rx: '목표 역할에 맞게 문장의 범위를 넓힌다.' },
  early: { name: '형성 초기', d: '평판이 아직 어느 한쪽으로도 자리 잡지 않았다.', rx: '하나의 문제 영역을 정하고 그 영역에서 이름이 불리는 경험부터 만든다.' },
  mixed: { name: '부분 형성', d: '영역별 차이가 크지 않지만 어느 영역도 충분히 높지 않다.', rx: '목표 역할에 가장 필요한 영역 하나를 골라 먼저 올린다.' },
  insufficient: { name: '판단 유보', d: '‘판단하기 어렵다’ 응답이 많아 패턴을 확정하지 않는다. 360 응답으로 보완한다.', rx: '동료 3명 이상에게 타인 평가를 받는다.' },
};

export function pattern(atn, provenCount) {
  const A = atn.A.score, T = atn.T.score, N = atn.N.score;
  if ([A, T, N].filter((v) => v == null).length >= 2) return 'insufficient';
  const a = A ?? 50, t = T ?? 50, n = N ?? 50;
  if (n >= 60 && (t + 20 <= n || provenCount <= 1)) return 'story_unverified';
  if (a >= 55 && t + 18 <= a) return 'aware_untrusted';
  if (t >= 55 && a + 18 <= t) return 'hidden_trusted';
  if (t >= 55 && n + 18 <= t) return 'trusted_unexplained';
  if (a >= 68 && t >= 68 && n >= 68) return 'balanced_high';
  if (a < 42 && t < 42 && n < 42) return 'early';
  return 'mixed';
}

export function layers(dims, role) {
  const sorted = [...dims].filter((d) => d.score != null).sort((x, y) => y.score - x.score);
  const main = sorted.filter((d) => d.score >= 65).slice(0, 2);
  if (!main.length && sorted[0]) main.push(sorted[0]);
  const dev = sorted.filter((d) => role.needs.includes(d.id) && d.score < 60 && !main.includes(d));
  const sub = sorted.filter((d) => !main.includes(d) && !dev.includes(d) && d.score >= 55).slice(0, 2);
  const pot = sorted.filter((d) => !main.includes(d) && !dev.includes(d) && !sub.includes(d));
  return { main, sub, pot, dev };
}

export function roleFit(answers, role) {
  const sjt = role.sjt.reduce((s, q, i) => {
    const pick = answers[`s${i}`];
    return s + (pick != null ? q.o[pick][1] : 0);
  }, 0);
  const picks = role.sjt.map((q, i) => {
    const k = answers[`s${i}`];
    const best = q.o.find((o) => o[1] === 3);
    return { q: q.q, pick: k != null ? q.o[k] : null, best };
  });
  const reqs = role.reqs.map((r, i) => ({ t: Array.isArray(r) ? r[0] : r, ex: Array.isArray(r) ? r[1] : '', state: answers[`r${i}`] || 'unknown' }));
  const by = Object.fromEntries(REQ_STATES.map((s) => [s.id, reqs.filter((r) => r.state === s.id)]));
  const proven = by.proven.length;
  let fit, fitD;
  if (proven >= 4 && sjt >= 7) { fit = '근접'; fitD = '목표 역할에 필요한 신뢰가 대부분 확인된다. 남은 과제는 알리는 일이다.'; }
  else if (proven + by.hidden.length >= 3) { fit = '부분 적합'; fitD = '필요한 경험은 상당 부분 있지만 아직 주변이 그것을 목표 역할의 근거로 쓰지 않는다.'; }
  else { fit = '준비 단계'; fitD = '목표 역할에 필요한 행동 증거가 아직 적다. 지금 역할 안에서 먼저 쌓을 경험이 있다.'; }
  return { sjt, sjtMax: role.sjt.length * 3, picks, reqs, by, fit, fitD };
}

// 생각의 습관: 장면별로 고른 생각을 함정 유형으로 센다
export function thinking(answers) {
  const picks = SCENES.map((sc) => {
    const k = answers[sc.id];
    if (k == null) return null;
    const [text, tag] = sc.o[k];
    return { scene: sc, text, tag, info: DISTORTIONS[tag] || null };
  }).filter(Boolean);
  const counts = {};
  for (const p of picks) if (p.tag !== 'ok') counts[p.tag] = (counts[p.tag] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ id: k, n, ...DISTORTIONS[k] }));
  const ok = picks.filter((p) => p.tag === 'ok').length;
  return { picks, counts, top, ok, total: picks.length };
}

export function compute(resp) {
  const a = resp.answers || {};
  const role = roleById(resp.profile?.target);
  const dims = scoreDims(a);
  const atn = scoreAtn(a);
  const rf = roleFit(a, role);
  const pat = pattern(atn, rf.by.proven.length);
  const lay = layers(dims, role);
  const unknownTotal = [...CONTRIB, ...ATN_ITEMS].filter((it) => a[it.id] === 0).length + rf.by.unknown.length;
  const splits = dims.filter((d) => d.split);
  const th = thinking(a);
  return { role, dims, atn, rf, pat, patInfo: PATTERNS[pat], lay, unknownTotal, splits, th };
}

// 360: 타인 응답 평균 → ATN
export function peerAtn(peerResponses) {
  const done = peerResponses.filter((p) => p.answers);
  if (!done.length) return null;
  const merged = {};
  for (const it of ATN_ITEMS) {
    const vals = done.map((p) => p.answers[it.id]).filter((v) => v > 0);
    merged[it.id] = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
  }
  return { atn: scoreAtn(merged), n: done.length, items: merged };
}

// 3·6·12개월 로드맵 과제 자동 생성
export function roadmapTasks(r) {
  const t = [];
  const add = (term, area, task, why) => t.push({ id: `${term}-${t.length}`, term, area, task, why, prog: 0, done: false, due: '' });
  add(3, '서사', '내가 반복해서 불린 문제 장면 5개 적기', '문장은 장면에서 나온다');
  add(3, '서사', '‘그 문제라면 이 사람’ 한 문장 초안 3개 만들고 동료 3명에게 확인', '내가 쓰는 문장과 남이 쓰는 문장 맞추기');
  if (r.atn.A.score == null || r.atn.A.score < 60) add(3, '인지', '회사 이름 없이 검색되는 기록 1건 만들기 (글, 인터뷰, 발표)', '인지 점수 보완');
  for (const q of r.rf.by.hidden) add(6, '인지', `“${q.t}” 사례를 결과와 함께 정리해 공유`, '역량은 있으나 미인지');
  for (const q of r.rf.by.none.slice(0, 2)) add(6, '신뢰', `“${q.t}” 경험을 지금 역할 안에서 작게 만들기`, '증거 부족');
  if (r.rf.by.unknown.length) add(3, '확인', '타인 평가 360 응답 3명 이상 받기', `판단 자료 부족 ${r.rf.by.unknown.length}건`);
  for (const d of r.lay.dev) add(6, '기여', `${d.name}: 이 영역의 책임을 한 번 맡아 결과 남기기`, '목표 역할 개발 필요 차원');
  for (const d of (r.th?.top || []).slice(0, 2)) add(3, '생각', `행동 실험: ${d.exp}`, `생각의 함정 · ${d.name}`);
  add(12, '신뢰', `${r.role.short} 역할의 핵심 신뢰 질문에 답하는 사례 2개 확보`, r.role.trust);
  add(12, '서사', '한 문장을 조직 밖 사람이 먼저 쓰는지 확인 (소개, 추천, 기사)', '이름이 나를 대신해 일하는지');
  return t;
}

// 로드맵의 행동 실험 기록 초기값
export function experiments(r) {
  return (r.th?.top || []).slice(0, 3).map((d, i) => ({ id: `x${i}`, trap: d.name, plan: d.exp, expect: '', conf: 70, actual: '', learned: '' }));
}

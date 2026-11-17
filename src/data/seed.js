// 데모용 가짜 데이터. 관리자 화면이 비어 보이지 않게 첫 실행 때 한 번 넣는다.
import { PROFILE, ROLES, CONTRIB, ATN_ITEMS, SCENES } from './test.js';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const LAST = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const FIRST = ['지훈', '수진', '현우', '은정', '성민', '미경', '재원', '혜진', '동현', '정아', '상우', '유리', '태호', '선영', '민철', '경희'];
const ROM = { 지훈: 'jihoon', 수진: 'sujin', 현우: 'hyunwoo', 은정: 'eunjung', 성민: 'sungmin', 미경: 'mikyung', 재원: 'jaewon', 혜진: 'hyejin', 동현: 'donghyun', 정아: 'junga', 상우: 'sangwoo', 유리: 'yuri', 태호: 'taeho', 선영: 'sunyoung', 민철: 'mincheol', 경희: 'kyunghee' };
const NOW_SENT = ['보고서를 잘 쓰는 사람', '일을 끝까지 미는 사람', '홍보 쪽에서 오래 일한 사람', '꼼꼼하지만 깐깐한 사람', '숫자에 강한 사람', '조용한데 일은 잘하는 사람', '위기 때 부르는 사람', '모르겠다'];
const WANT_SENT = ['조직의 위기를 먼저 읽고 정리하는 사람', '사업 전체를 맡길 수 있는 사람', '그 분야라면 먼저 찾는 전문가', '사람을 키워 결과를 내는 리더', '회사 밖에서도 이름으로 불리는 사람'];
const STATUS = ['신청', '확정', '완료', '상품 전환', '보류'];
const PRODUCTS = ['나의 평판 진단', '나의 이름 설계', '커리어 평판 전략', '아직 모름'];

export function makeSeed() {
  const r = rng(20261117);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const day = 864e5;
  const t0 = Date.now();
  const responses = [];
  const consults = [];
  const invites = [];
  const mails = [];
  let seq = 1100;

  for (let i = 0; i < 64; i++) {
    seq++;
    const created = new Date(t0 - (i * 0.7 + r() * 0.6) * day - r() * 5e6);
    const target = r() < 0.3 ? 'exec' : r() < 0.4 ? 'expert' : pick(ROLES).id;
    const bias = { a: r() * 2.4 - 1.1, t: r() * 2.4 - 1.1, n: r() * 2.4 - 1.2 };
    const answers = {};
    for (const c of CONTRIB) answers[c.id] = Math.max(1, Math.min(5, Math.round(3 + r() * 2.4 - 0.6)));
    for (const it of ATN_ITEMS) {
      const b = bias[it.dim.toLowerCase()];
      answers[it.id] = r() < 0.07 ? 0 : Math.max(1, Math.min(5, Math.round(3 + b + r() * 1.6 - 0.8)));
    }
    for (let k = 0; k < 3; k++) answers[`s${k}`] = Math.floor(r() * 4);
    for (const sc of SCENES) answers[sc.id] = Math.floor(r() * 4);
    for (let k = 0; k < 5; k++) answers[`r${k}`] = pick(['proven', 'proven', 'hidden', 'hidden', 'none', 'unknown']);
    const ln = pick(LAST), fn = pick(FIRST);
    const lead = r() < 0.58;
    const resp = {
      id: `RD-${String(seq).padStart(4, '0')}`,
      createdAt: created.toISOString(),
      durationSec: Math.round(380 + r() * 360),
      status: '완료',
      profile: {
        years: pick(PROFILE[0].opts.slice(1)),
        current: pick(PROFILE[1].opts),
        industry: pick(PROFILE[2].opts),
        concern: pick(PROFILE[3].opts),
        span: pick(PROFILE[4].opts),
        target,
      },
      answers,
      sentences: { now: pick(NOW_SENT), want: pick(WANT_SENT) },
      ...(lead && r() < 0.4 ? { prediction: { A: 40 + Math.round(r() * 40), T: 40 + Math.round(r() * 40), N: 30 + Math.round(r() * 40) } } : {}),
      ...(lead ? { name: ln + fn, email: `${ROM[fn]}.${seq}@example.com`, agree: true, reportSentAt: created.toISOString() } : {}),
    };
    responses.push(resp);
    if (lead) mails.push({ id: `M-${seq}`, to: resp.email, kind: 'report', subject: `[평판진단] ${resp.name}님의 진단 리포트 ${resp.id}`, ref: resp.id, sentAt: resp.createdAt });

    if (lead && r() < 0.42) {
      const d = new Date(created.getTime() + (2 + Math.floor(r() * 9)) * day);
      consults.push({
        id: `C-${seq}`, rid: resp.id, name: resp.name, email: resp.email, phone: '010-0000-0000',
        date: d.toISOString().slice(0, 10), time: pick(['10:00', '11:00', '14:00', '15:30', '17:00', '19:30']),
        product: pick(PRODUCTS), memo: pick(['부사장 후보 검토를 앞두고 있다', '퇴직 후 자문 일을 하고 싶다', '이직 제안이 왔는데 내 위치를 모르겠다', '팀장 승진에서 두 번 밀렸다', '']),
        status: i < 6 ? '신청' : pick(STATUS), createdAt: created.toISOString(),
        thought: r() < 0.6 ? pick([
          { sit: '임원 회의에서 내 제안이 다른 임원 이름으로 채택됐다', th: '말해 봤자 공을 다투는 사람으로 보일 것이다', conf: 80 },
          { sit: '헤드헌터가 연락했는데 이력서를 한 장으로 줄이지 못했다', th: '회사 이름을 빼면 내세울 게 없다', conf: 70 },
          { sit: '후배가 먼저 팀장이 됐다', th: '나는 이제 끝난 사람이다', conf: 60 },
        ]) : null,
      });
    }
    if (lead && r() < 0.5) {
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const done = r() < 0.65;
        const pa = {};
        if (done) for (const it of ATN_ITEMS) pa[it.id] = Math.max(1, Math.min(5, (answers[it.id] || 3) + Math.round(r() * 2 - 1.2)));
        invites.push({ token: `seed${seq}${k}`, rid: resp.id, name: pick(LAST) + pick(FIRST), relation: pick(['상사', '동료', '후배', '고객', '외부 파트너']), sentAt: created.toISOString(), doneAt: done ? created.toISOString() : null, answers: done ? pa : undefined, sentence: done ? pick(NOW_SENT) : undefined });
      }
    }
  }
  return { seq: 1200, responses, consults, invites, mails, notes: {}, sentences: {}, roadmaps: {}, session: null };
}

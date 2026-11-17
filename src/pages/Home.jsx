import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute, roleById } from '../lib/score.js';
import { DISTORTIONS } from '../data/test.js';
import { draft } from '../lib/store.js';
import { Px, Sec, fmtDate, fmtTime, fmtDur } from '../components/ui.jsx';

const AXES = [
  { no: 'AXIS 01', name: '가치 창출 방식', q: '나는 어떤 방식으로 가치를 만들어 왔는가', meta: '6차원 · 12문항' },
  { no: 'AXIS 02', name: 'ATN 평판 상태', q: '그 가치는 주변에 어떻게 알려지고 신뢰받는가', meta: '인지·신뢰·서사 · 12문항' },
  { no: 'AXIS 03', name: '목표 역할 적합성', q: '지금의 평판은 내가 원하는 다음 역할에 맞는가', meta: '역할 6종 · 8문항' },
  { no: '360', name: '타인 평가', q: '내가 아는 나와 남이 쓰는 문장은 얼마나 다른가', meta: '동료 3–5명 · 4분', to: '/peer' },
];

const WHO = [
  ['팀장', '분기 회의에서 내가 줄인 비용 18%가 “본부 성과” 한 줄로 끝났다.', '숫자가 나왔으니 볼 사람은 다 봤겠지.', '독심술'],
  ['실무', '3년째 같은 TF에 불려 가는데 정작 리더 후보 명단에는 없다.', '나는 원래 앞에 나서는 사람이 아니니까.', '낙인찍기'],
  ['임원', '부사장 심사에서 “평판이 문제”라는 말을 들었다.', '성과가 이 정도면 알아줘야 맞는 거 아닌가.', '당위적 사고'],
  ['퇴직 후', '명함을 내려놓자 “그래서 무슨 일 하세요?”에 답이 길어졌다.', '회사 밖에서는 나를 찾을 사람이 없다.', '파국화'],
  ['독립', '첫 고객 사례를 올리려다 민망해서 지웠다.', '민망하다는 건 하면 안 된다는 뜻이다.', '감정적 추론'],
];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const d = draft.load();
  useEffect(() => { api.stats().then(setStats); api.recent(7).then(setRecent); }, []);

  return (
    <main className="wrap">
      <div className="home-q">
        <div>
          <p className="kicker mono"><span>REPUTATION DIAGNOSIS</span><span>무료 · 가입 없음 · 약 10분</span></p>
          <h1>당신이 방을 나간 뒤,<br />남은 사람들은 당신을<br /><em>어떤 한 문장</em>으로 요약합니까?</h1>
          <p className="lead">실력은 회의실에 도착하지 않는다. 도착하는 것은 그 사람에 관한 몇 개의 문장이다. 이 진단은 그 문장이 지금 어떤 상태인지, 다음 역할까지 닿을 수 있는지 확인한다.</p>
          <div className="btns">
            <Link className="btn" to="/test">{d ? '이어서 진단하기' : '진단 시작'} <span className="mono">46문항</span></Link>
            <Link className="btn ghost" to="/about">ATN 모형 보기</Link>
          </div>
        </div>
        <Px name="door" alt="문서는 회의실 문 앞에 멈추고 이름표만 문틈으로 들어가는 픽셀 그림" />
      </div>

      <div className="statline mono">
        <span>누적 응답 <b>{stats ? stats.responses.toLocaleString() : '—'}</b></span>
        <span>평균 소요 <b>{stats ? fmtDur(stats.avgSec) : '—'}</b></span>
        <span>타인 평가 <b>{stats ? stats.peers.toLocaleString() : '—'}</b></span>
        <span>문항 개정 <b>{stats ? stats.rev : '—'}</b></span>
        <span>최종 개정 <b>2026.11.12</b></span>
      </div>

      <Sec no="01" title="세 개의 축, 하나로 합산하지 않는다" small="축마다 다른 질문에 답한다">
        <div className="blocks axes">
          {AXES.map((a) => (
            <Link className="block" key={a.no} to={a.to || '/test'}>
              <span className="mono"><span>{a.no}</span><span>{a.meta}</span></span>
              <h3>{a.name}</h3>
              <p className="q">{a.q}</p>
            </Link>
          ))}
        </div>
      </Sec>

      <div className="split">
        <Sec no="02" title="이런 장면을 겪었다면" small="40–55세 · 경력 15–25년">
          <div className="says">
            {WHO.map(([k, v, t, d]) => (
              <div className="say" key={k}><span>{k}</span><div><q>{v}</q><p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>그때 드는 생각 “{t}” <span className="tag" style={{ fontSize: 11, marginLeft: 4 }}>{d}</span></p></div></div>
            ))}
          </div>
          <p className="mt16" style={{ color: 'var(--ink-2)' }}>이들에게 부족한 것이 반드시 능력은 아니다. 능력이 필요한 순간, 그 능력이 정확하게 읽히는 구조가 없을 수 있다.</p>
        </Sec>
        <Sec no="03" title="진행 순서" small="결과까지 약 10분">
          <ol className="flow">
            <li><span>프로필</span><p>경력, 지금 역할, 목표 역할 6종 중 하나</p></li>
            <li><span>AXIS 01</span><p>가치 기여 6차원. 자기 인식과 실제 경험을 따로 묻는다</p></li>
            <li><span>AXIS 02</span><p>인지·신뢰·서사. 최근 12개월 동안 실제로 몇 번 있었는지 센다</p></li>
            <li><span>생각 습관</span><p>실무 장면 7개에서 가장 먼저 떠오르는 생각을 고른다</p></li>
            <li><span>AXIS 03</span><p>목표 역할의 실제 상황 3개와 요구사항 5개</p></li>
            <li className="break"><span>마지막 질문</span><p>사람들이 지금 쓰는 문장과 듣고 싶은 문장</p></li>
            <li><span>결과</span><p>요약은 바로, 전체 리포트는 이메일로 → 30분 상담</p></li>
          </ol>
        </Sec>
      </div>

      <Sec no="04" title="평판을 막는 생각의 함정" small="인지행동치료(CBT)의 인지 왜곡을 평판 상황에 맞게 옮겼다">
        <div className="blocks" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {Object.entries(DISTORTIONS).slice(0, 8).map(([k, d], i) => (
            <Link className="block" to="/about#traps" key={k} style={{ aspectRatio: 'auto', minHeight: 150 }}>
              <span className="mono"><span>T{String(i + 1).padStart(2, '0')}</span><span>{d.en}</span></span>
              <h3>{d.name}</h3>
              <p>{d.d}</p>
            </Link>
          ))}
        </div>
      </Sec>

      <Sec no="05" title="최근 진단" small="이름과 응답 내용은 표시하지 않는다">
        <ul className="log">
          {recent.map((r) => {
            const c = compute(r);
            return (
              <li key={r.id}>
                <span className="mono">{r.id}</span>
                <span className="mono">{fmtDate(r.createdAt).slice(5)} {fmtTime(r.createdAt)}</span>
                <span>{r.profile.years} · {roleById(r.profile.target).short} 목표 · <b>{c.patInfo.name}</b></span>
                <span className="mono">{fmtDur(r.durationSec || 500)}</span>
              </li>
            );
          })}
        </ul>
      </Sec>

      <Sec no="06" title="진단 다음" small="상담은 한 달에 몇 명만 받는다">
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>프로그램</th><th>내용</th><th className="right">가격</th></tr></thead>
          <tbody>
            <tr><td><b>30분 해석 상담</b></td><td>리포트를 함께 읽고 다음 한 걸음을 정한다</td><td className="right mono">무료</td></tr>
            <tr><td><b>나의 평판 진단</b></td><td>전문성·인지·신뢰·서사 심층 진단과 인터뷰</td><td className="right mono">20–30만 원</td></tr>
            <tr><td><b>나의 이름 설계</b></td><td>전문성 재정의, 핵심 메시지, LinkedIn 방향, 4주 실행계획</td><td className="right mono">80–120만 원</td></tr>
            <tr><td><b>커리어 평판 전략</b></td><td>퇴직·독립·전문가 전환을 위한 1:1 전략 설계</td><td className="right mono">150–200만 원</td></tr>
          </tbody>
        </table></div>
        <div className="btns mt16"><Link className="btn ghost sm" to="/services">프로그램 자세히</Link><Link className="btn ghost sm" to="/consult">30분 상담 신청</Link></div>
      </Sec>

      <Sec no="07" title="이 진단의 바탕" small="2027 출간 예정">
        <div className="books">
          <div className="book own">
            <span className="spine">우리는 결국 이름으로 일한다</span>
            <div><b>『우리는 결국 이름으로 일한다』</b><small>실력을 신뢰와 기회로 바꾸는 평판 설계 · 3부 10장</small></div>
            <Link className="go" to="/about#book">목차</Link>
          </div>
        </div>
      </Sec>
      <div style={{ height: 60 }} />
    </main>
  );
}

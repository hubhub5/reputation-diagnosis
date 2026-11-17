import React from 'react';
import { Link } from 'react-router-dom';
import { DIMS, ATN, ROLES, DISTORTIONS, SCENES } from '../data/test.js';
import { PATTERNS } from '../lib/score.js';
import { Px, Sec } from '../components/ui.jsx';

const PRINCIPLES = [
  '평판은 유명세나 호감도가 아니라, 미래의 역할과 기회를 맡길 수 있다는 기대다.',
  '개인의 가치 창출 방식과 외부에서 형성된 평판을 구분한다.',
  '가치 기여 차원은 6가지로 진단하되, 한 유형으로 사람을 규정하지 않는다.',
  'ATN은 인지·신뢰·서사의 형성 상태를 각각 진단한다.',
  '현재 평판의 수준과 목표 역할에 대한 적합성을 따로 평가한다.',
  '직급이 아니라 실제 책임과 권한의 범위로 목표 역할을 정의한다.',
  '창업자·오너 CEO와 전문경영인 CEO는 별도의 신뢰 요구사항으로 진단한다.',
  '역량 부족, 인식 부족, 증거 부족, 자료 부족을 구분한다.',
  'AI는 분석과 해석을 돕고, 중요한 판단에는 전문가 검토를 둔다.',
  '진단의 목적은 서열화가 아니라 다음 선택과 평판 개발 방향을 제시하는 것이다.',
];
const BOOK = [
  ['1부', '왜 실력만으로는 선택받지 못하는가', ['실력은 회의실에 도착하지 않는다', '회의실에는 실력 대신 무엇이 도착하는가', '신뢰는 어떻게 시작되고 왜 되돌릴 수 없는가']],
  ['2부', '기억되는 이름은 어떻게 만들어지는가', ['한 문장으로 기억되는 사람이 선택된다', '평판은 내가 아니라 남이 증명한다', '완벽한 사람보다 일관된 사람이 신뢰받는다', '유명한 이름보다 무엇으로 알려진 이름이 강하다']],
  ['3부', '이름은 어떻게 나를 대신해 일하는가', ['회사에서 쌓은 경력은 왜 내 것이 아닐 수 있는가', '좋은 평판은 어떻게 다음 기회를 만드는가', '이름은 어떻게 사람과 돈을 움직이는가']],
];

export default function About() {
  let ch = 0;
  return (
    <div className="wrap doc-grid">
      <aside className="doc-left tree">
        <h3>모형</h3>
        <a href="#atn">ATN 평판설계모형</a><a href="#axes">세 개의 축</a><a href="#dims">가치 기여 6차원</a><a href="#roles">목표 역할 6종</a><a href="#pat">불균형 해석</a><a href="#traps">생각의 함정</a><a href="#pr">진단 원칙</a><a href="#book">책</a>
      </aside>
      <article>
        <div className="doc-meta mono"><b>ATN</b><span>등재 2026.11.12</span><span>개정 3</span><span className="status">파일럿</span></div>
        <h1 className="doc-title">ATN 평판설계모형</h1>
        <div className="doc-crumb">Reputation Diagnosis Framework</div>
        <p className="doc-line">지금 나의 이름에는 어떤 신뢰가 쌓여 있으며, 원하는 다음 역할을 위해 어떤 신뢰를 더 만들어야 하는가.</p>

        <Sec no="01" title="인지 · 신뢰 · 서사" small="순서가 있는 단계가 아니다" id="atn">
          <div className="signals">
            {ATN.map((a) => <div key={a.id}><h3>{a.id} · {a.en}</h3><p style={{ fontWeight: 700 }}>{a.name} — {a.q}</p><p className="mt8" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{a.d}</p></div>)}
          </div>
          <p className="mt16" style={{ color: 'var(--ink-2)' }}>인지가 높아도 신뢰가 낮을 수 있고, 신뢰는 높지만 밖에 알려지지 않을 수 있다. 각각 따로 재고, 셋 사이의 불균형을 찾는다.</p>
        </Sec>

        <Sec no="02" title="세 개의 축" small="하나의 총점으로 합산하지 않는다" id="axes">
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>축</th><th>핵심 질문</th></tr></thead>
            <tbody>
              <tr><td className="mono">AXIS 01</td><td>나는 어떤 방식으로 가치를 창출하는 사람인가</td></tr>
              <tr><td className="mono">AXIS 02</td><td>나의 가치는 주변 사람들에게 어떻게 인식되고 신뢰받고 있는가</td></tr>
              <tr><td className="mono">AXIS 03</td><td>현재의 평판은 내가 원하는 다음 역할과 얼마나 맞는가</td></tr>
            </tbody>
          </table></div>
        </Sec>

        <Sec no="03" title="가치 기여 6차원" small="주요 · 보조 · 잠재 · 개발 필요" id="dims">
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>차원</th><th>질문</th><th>관찰되는 특성</th></tr></thead>
            <tbody>{DIMS.map((d) => <tr key={d.id}><td className="nowrap"><b>{d.name}</b></td><td>{d.q}</td><td style={{ color: 'var(--ink-2)' }}>{d.trait}</td></tr>)}</tbody>
          </table></div>
        </Sec>

        <Sec no="04" title="목표 역할 6종" small="직급이 아니라 책임의 범위" id="roles">
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>역할</th><th>핵심 신뢰 질문</th></tr></thead>
            <tbody>{ROLES.map((r) => <tr key={r.id}><td className="nowrap"><b>{r.name}</b></td><td>{r.trust}</td></tr>)}</tbody>
          </table></div>
          <div className="talk mt24">
            <div className="hd">창업자·오너 CEO</div><div className="hd">전문경영인 CEO</div>
            <div style={{ textDecoration: 'none', color: 'var(--ink)' }}>창업 비전과 소유권이 정당성의 바탕</div><div>위임받은 경영 책임이 정당성의 바탕</div>
            <div style={{ textDecoration: 'none', color: 'var(--ink)' }}>비전이 지속가능한 운영으로 이어지는가</div><div>조직 전체를 맡길 경영 판단을 입증했는가</div>
          </div>
        </Sec>

        <Sec no="05" title="불균형 해석" id="pat">
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>패턴</th><th>해석</th><th>먼저 할 일</th></tr></thead>
            <tbody>{Object.values(PATTERNS).map((p) => <tr key={p.name}><td className="nowrap"><b>{p.name}</b></td><td>{p.d}</td><td style={{ color: 'var(--ink-2)', fontSize: 13 }}>{p.rx}</td></tr>)}</tbody>
          </table></div>
        </Sec>

        <Sec no="06" title="평판을 막는 생각의 함정" small={`CBT 인지 왜곡 ${Object.keys(DISTORTIONS).length}종 · 장면 ${SCENES.length}개`} id="traps">
          <p style={{ color: 'var(--ink-2)', marginBottom: 12 }}>능력이 있어도 이름이 선택의 자리까지 가지 못하는 이유 중 상당수는 생각의 습관에 있다. 인지행동치료(CBT)의 인지 왜곡 개념을 평판 상황에 맞게 옮겼다. 진단은 장면을 보여 주고 가장 먼저 떠오르는 생각을 고르게 한다. 임상적 진단이 아니라 자기 점검 도구다.</p>
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>함정</th><th>평판 상황에서의 모습</th><th>다시 묻기</th><th>책 속 문장</th></tr></thead>
            <tbody>{Object.entries(DISTORTIONS).map(([k, d]) => <tr key={k}><td className="nowrap"><b>{d.name}</b><br /><small className="mono" style={{ color: 'var(--mute)' }}>{d.en}</small></td><td style={{ fontSize: 13 }}>{d.d}</td><td style={{ fontSize: 13 }}>{d.q}</td><td style={{ fontSize: 12, color: 'var(--mute)' }}>“{d.book}”</td></tr>)}</tbody>
          </table></div>
        </Sec>

        <Sec no="07" title="진단 원칙 10" id="pr">
          <ul className="causes">{PRINCIPLES.map((p, i) => <li key={i}><span className="mono">{String(i + 1).padStart(2, '0')}</span><span>{p}</span></li>)}</ul>
        </Sec>

        <Sec no="08" title="『우리는 결국 이름으로 일한다』" small="실력을 신뢰와 기회로 바꾸는 평판 설계" id="book">
          <div className="verdict" style={{ marginTop: 0 }}>
            <Px name="door" />
            <div><p className="quote-big">“당신이 방을 나간 뒤, 남은 사람들은 당신을 어떤 한 문장으로 요약합니까?”</p><p className="mt8">고객에게 수없이 던진 질문을 부사장 발탁 탈락 뒤 자신에게 돌려준 기록. 이 진단은 그 세 질문—어떤 문제에서 이름이 떠오르는가, 무엇을 맡길 수 있다고 믿는가, 어떤 문장으로 설명하는가—을 문항으로 옮겼다.</p></div>
          </div>
          {BOOK.map(([p, t, chs]) => (
            <div key={p} className="mt24">
              <p className="mono" style={{ color: 'var(--mute)' }}>{p}</p><h3 style={{ fontSize: 16, marginBottom: 6 }}>{t}</h3>
              <ul className="refs">{chs.map((c) => { ch++; return <li key={c}><span className="mono">{ch}장</span><span>{c}</span></li>; })}</ul>
            </div>
          ))}
        </Sec>
        <div className="btns mt40"><Link className="btn" to="/test">진단 시작</Link></div>
      </article>
      <aside className="doc-right">
        <nav className="panel toc"><h3><span>목차</span></h3>{[['atn', 'ATN'], ['axes', '세 개의 축'], ['dims', '6차원'], ['roles', '목표 역할'], ['pat', '불균형'], ['traps', '생각의 함정'], ['pr', '원칙'], ['book', '책']].map(([k, t], i) => <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth' }); }}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{t}</a>)}</nav>
        <div className="panel"><h3><span>문서 이력</span></h3><ul className="history"><li><span className="mono">2026.11.12</span>개정 3 · 목표 역할 축 추가</li><li><span className="mono">2026.10.20</span>개정 2 · ATN 4문항씩</li><li><span className="mono">2026.09.30</span>초안</li></ul></div>
      </aside>
    </div>
  );
}

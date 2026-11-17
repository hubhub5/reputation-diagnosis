import React from 'react';
import { Link } from 'react-router-dom';
import { Px, Sec } from '../components/ui.jsx';

export const PRODUCTS = [
  {
    id: 'diag', no: 'P1', name: '나의 평판 진단', price: '20–30만 원', unit: '1회 · 2주',
    line: '지금 내 이름에 어떤 신뢰가 쌓여 있는지 확인한다',
    items: ['온라인 진단 + 360 타인 평가 5명', '60분 심층 인터뷰', '전문성·인지·신뢰·서사 진단서', '전문가 해석이 붙은 최종 리포트'],
    for: '승진이나 이직을 앞두고 내 위치를 정확히 알고 싶을 때',
  },
  {
    id: 'name', no: 'P2', name: '나의 이름 설계', price: '80–120만 원', unit: '4주 · 4회',
    line: '경력을 한 문장으로 묶고, 그 문장이 쓰이게 만든다',
    items: ['평판 진단 포함', '전문성 재정의와 핵심 메시지', 'LinkedIn·프로필 방향', '4주 실행계획과 주간 점검'],
    for: '조직의 직함과 로고 뒤에 전문성이 가려져 있다고 느낄 때',
  },
  {
    id: 'career', no: 'P3', name: '커리어 평판 전략', price: '150–200만 원', unit: '3개월 · 1:1',
    line: '퇴직·독립·전문가 전환을 위한 평판 전략을 같이 설계한다',
    items: ['이름 설계 포함', '목표 역할별 평판 격차 분석', '첫 기회까지의 관계·노출 설계', '3개월 1:1 코칭'],
    for: '회사를 떠난 뒤에도 세상이 나를 다시 찾을 이유를 만들고 싶을 때',
  },
];

export default function Services() {
  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>PROGRAMS</span><span>한 달에 몇 명만 진행</span></p>
        <h1>진단 다음에 하는 일</h1>
        <p>평판은 포장이 아니다. 실력보다 큰 이름을 만들지 않고, 실력이 선택의 자리까지 닿게 하는 구조를 만든다.</p>
      </div>

      <div className="products">
        {PRODUCTS.map((p, i) => (
          <div key={p.id} className={i === 1 ? 'pick' : ''}>
            <span className="mono"><span>{p.no}</span><span>{p.unit}</span></span>
            <h3>{p.name}</h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>{p.line}</p>
            <p className="price">{p.price}<small> 초기 가격</small></p>
            <ul>{p.items.map((t) => <li key={t}>{t}</li>)}</ul>
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>{p.for}</p>
            <Link className={'btn sm' + (i === 1 ? '' : ' ghost')} to={`/consult?product=${p.id}`}>상담 후 결정</Link>
          </div>
        ))}
      </div>

      <div className="split">
        <Sec no="01" title="진행 순서">
          <ol className="flow">
            <li><span>무료 진단</span><p>10분. 요약은 바로, 리포트는 메일로</p></li>
            <li className="break"><span>30분 상담</span><p>리포트를 같이 읽는다. 프로그램이 필요 없다고 판단하면 그렇게 말한다</p></li>
            <li><span>선택</span><p>필요한 범위만 고른다. P2·P3는 앞 단계를 포함한다</p></li>
            <li><span>진행</span><p>회차마다 기록을 남기고 플래너로 점검한다</p></li>
          </ol>
        </Sec>
        <Sec no="02" title="진행하는 사람">
          <div className="verdict" style={{ marginTop: 0 }}>
            <Px name="nametag" />
            <div>
              <h3>홍보기획 20년, 평판을 설계해 온 사람</h3>
              <p>기업과 임원의 메시지를 다듬고 위기 때 무엇을 먼저 말할지 판단해 왔다. 정작 자신의 평판을 몰라 부사장 발탁에서 탈락한 뒤, 그 구조를 ATN 모형으로 정리했다.</p>
              <p className="mt8"><Link className="wl" to="/about#book">『우리는 결국 이름으로 일한다』</Link></p>
            </div>
          </div>
        </Sec>
      </div>

      <Sec no="03" title="자주 묻는 것">
        <div className="info" style={{ marginTop: 0 }}>
          <div className="row"><span>회사에 알려지나</span><span>아니다. 진단과 상담 내용은 본인 외에 공유하지 않는다. 360 응답도 익명으로 합산한다.</span></div>
          <div className="row"><span>기업 단위</span><span>임원 후보 진단, 경영진 평판 관리, 리더십 개발 프로그램은 따로 협의한다.</span></div>
          <div className="row"><span>환불</span><span>첫 회차 전까지 전액, 이후에는 남은 회차 기준으로 돌려준다.</span></div>
          <div className="row"><span>AI 사용</span><span>응답 분류와 초안 작성에만 쓴다. 해석과 최종 판단은 전문가가 한다.</span></div>
        </div>
      </Sec>
      <div className="btns mt24"><Link className="btn" to="/consult">30분 상담 신청</Link><Link className="btn ghost" to="/test">먼저 진단하기</Link></div>
    </main>
  );
}

import React from 'react';
import { Sec } from '../components/ui.jsx';

export default function Privacy() {
  return (
    <main className="wrap page narrow" style={{ margin: '0 auto' }}>
      <div className="page-head"><p className="kicker mono"><span>PRIVACY · LIMITS</span><span>개정 2026.11.17</span></p><h1>개인정보와 진단의 한계</h1></div>
      <Sec no="01" title="모으는 것">
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>항목</th><th>언제</th><th>왜</th><th>보관</th></tr></thead>
          <tbody>
            <tr><td>문항 응답, 프로필</td><td>진단할 때</td><td>결과 계산, 문항 검증(익명 통계)</td><td className="mono">1년</td></tr>
            <tr><td>이름, 이메일</td><td>리포트를 받을 때</td><td>리포트 발송, 내 진단함 로그인</td><td className="mono">1년</td></tr>
            <tr><td>연락처, 고민 메모</td><td>상담 신청할 때</td><td>상담 진행</td><td className="mono">1년</td></tr>
            <tr><td>360 응답</td><td>타인이 답할 때</td><td>요청자 리포트의 평균값</td><td className="mono">1년</td></tr>
          </tbody>
        </table></div>
      </Sec>
      <Sec no="02" title="진단의 한계">
        <ul className="plain check">
          <li>자기 응답만으로 실제 평판을 확정하지 않는다. 본인이 생각하는 평판과 타인이 인식하는 평판은 다를 수 있다.</li>
          <li>판단할 수 없는 항목은 낮은 점수가 아니라 자료 부족으로 처리한다.</li>
          <li>문항은 파일럿 단계(v0.3)다. 신뢰도와 타당도는 응답 데이터로 계속 검증하고 고친다.</li>
          <li>AI는 응답 분류와 초안 작성에만 쓴다. 응답자의 말투만으로 리더십이나 윤리성을 추론하지 않는다.</li>
          <li>승진, 선발 같은 중요한 결정에 이 결과만 쓰지 않는다.</li>
        </ul>
      </Sec>
      <Sec no="03" title="지금 이 사이트는">
        <p style={{ color: 'var(--ink-2)' }}>시연용 버전이다. 모든 응답과 메일은 이 브라우저 안에만 저장되고 실제로 발송되지 않는다. 관리자 화면의 응답은 가짜 데이터다.</p>
      </Sec>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute } from '../lib/score.js';
import { unlocked } from '../lib/store.js';
import { Px, Loading, Empty, fmtDate, fmtTime } from '../components/ui.jsx';

export default function Mail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [m, setM] = useState(undefined);
  useEffect(() => { api.mail(id).then(setM); }, [id]);
  if (m === undefined) return <main className="wrap page"><Loading /></main>;
  if (!m) return <main className="wrap page"><Empty px="envelope">메일 {id}을 찾지 못했다.</Empty></main>;

  let body;
  if (m.kind === 'report' && m.refObj) {
    const c = compute(m.refObj);
    body = (
      <>
        <Px name="nametag" />
        <p>{m.refObj.name || ''}님, 평판진단 리포트를 보냅니다.</p>
        <div className="note-box"><h3>요약</h3><p><b>{c.patInfo.name}</b> · 인지 {c.atn.A.score ?? '–'} · 신뢰 {c.atn.T.score ?? '–'} · 서사 {c.atn.N.score ?? '–'}</p><p className="mt8">{c.role.name} 목표: {c.rf.fit}</p>{c.th.top[0] && <p className="mt8">자주 고른 생각의 함정: {c.th.top[0].name}</p>}</div>
        <p>리포트는 아래 버튼으로 열 수 있고, PDF로 저장할 수 있습니다. 자기 응답만으로 만든 결과이므로 동료 3명에게 같은 질문을 보내 보길 권합니다.</p>
        <div className="btns"><Link className="btn" to={`/report/${m.ref}`} onClick={() => unlocked.add(m.ref)}>리포트 열기</Link><Link className="btn ghost" to={`/peer/new/${m.ref}`}>타인 평가 요청</Link></div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>리포트를 같이 읽고 싶다면 30분 해석 상담을 신청할 수 있습니다. <Link className="wl" to={`/consult?rid=${m.ref}`}>상담 신청</Link></p>
      </>
    );
  } else if (m.kind === 'consult' && m.refObj) {
    const c = m.refObj;
    body = (
      <>
        <Px name="calendar" />
        <p>{c.name}님, 상담 신청을 받았습니다.</p>
        <div className="info" style={{ marginTop: 0 }}>
          <div className="row"><span>일시</span><span className="mono">{c.date.replaceAll('-', '.')} {c.time} · 30분</span></div>
          <div className="row"><span>방식</span><span>화상. 링크는 하루 전에 보냅니다</span></div>
          <div className="row"><span>관심</span><span>{c.product}</span></div>
          <div className="row"><span>진단</span><span className="mono">{c.rid || '—'}</span></div>
          <div className="row"><span>메모</span><span>{c.memo || '—'}</span></div>
          {c.thought && <div className="row"><span>생각 기록</span><span>{c.thought.sit}<br />“{c.thought.th}” · 믿는 정도 {c.thought.conf}%<br /><small style={{ color: 'var(--mute)' }}>상담에서 이 생각이 사실인지 함께 따져 봅니다.</small></span></div>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>일정을 바꾸려면 이 메일에 회신하면 됩니다.</p>
      </>
    );
  } else if (m.kind === 'invite' && m.refObj) {
    body = (
      <>
        <Px name="scale" />
        <p>{m.refObj.name}님, 안녕하세요.</p>
        <p>함께 일한 분이 자신의 평판을 돌아보는 중이라며 4분짜리 질문에 답해 주길 부탁했습니다. 누가 어떻게 답했는지는 요청자에게 보이지 않습니다.</p>
        <div className="btns"><Link className="btn" to={`/p/${m.ref}`}>응답하기</Link></div>
      </>
    );
  } else if (m.kind === 'magic') {
    body = (
      <>
        <Px name="nametag" />
        <p>내 진단함 로그인 링크입니다. 15분 동안 쓸 수 있습니다.</p>
        <div className="btns"><button type="button" className="btn" onClick={async () => { await api.confirmLogin(m.ref); nav('/me'); }}>내 진단함 열기</button></div>
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>요청하지 않았다면 이 메일을 무시하면 됩니다.</p>
      </>
    );
  } else body = <p>원본을 찾지 못했다.</p>;

  return (
    <main className="wrap page">
      <p className="mono" style={{ color: 'var(--mute)', textAlign: 'center', marginBottom: 14 }}>MAIL PREVIEW · 실제 발송 화면과 같은 내용</p>
      <div className="mailbox">
        <div className="mh mono">
          <div><span>보낸이</span>평판진단 &lt;report@rdt.kr&gt;</div>
          <div><span>받는이</span>{m.to}</div>
          <div><span>일시</span>{fmtDate(m.sentAt)} {fmtTime(m.sentAt)}</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700, letterSpacing: 'var(--track)', marginTop: 6, color: 'var(--ink)' }}>{m.subject}</div>
        </div>
        <div className="mb">{body}</div>
        <div className="mf">평판진단 · 이 메일은 발신 전용이 아닙니다. 회신하면 진행자가 직접 읽습니다. 수신 거부는 내 진단함에서.</div>
      </div>
    </main>
  );
}

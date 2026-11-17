import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute } from '../lib/score.js';
import { unlocked } from '../lib/store.js';
import { Px, Sec, Loading, Empty, fmtDate, fmtTime } from '../components/ui.jsx';

export default function Me() {
  const [sess, setSess] = useState(api.session());
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(null);
  const [data, setData] = useState(null);
  useEffect(() => { if (sess) api.mine(sess.email).then(setData); }, [sess]);

  if (!sess) {
    return (
      <main className="wrap page narrow" style={{ margin: '0 auto', maxWidth: 520 }}>
        <div className="page-head"><p className="kicker mono"><span>MY ARCHIVE</span><span>비밀번호 없음</span></p><h1>내 진단함</h1><p>리포트를 받은 이메일을 적으면 로그인 링크를 보낸다.</p></div>
        {sent ? (
          <div className="empty"><Px name="envelope" /><p style={{ color: 'var(--ink)' }}>{sent.to}로 링크를 보냈다.</p><Link className="btn" to={`/mail/${sent.id}`}>메일 열기 (미리보기)</Link></div>
        ) : (
          <form className="fields" onSubmit={async (e) => { e.preventDefault(); if (/^\S+@\S+\.\S+$/.test(email)) setSent(await api.requestLogin(email)); }}>
            <label className="field"><span>이메일</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></label>
            <button className="btn" type="submit">로그인 링크 받기</button>
          </form>
        )}
      </main>
    );
  }
  if (!data) return <main className="wrap page"><Loading /></main>;

  const rs = data.responses.map((r) => ({ r, c: compute(r) }));
  const [a, b] = rs;
  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>MY ARCHIVE</span><span>{sess.email}</span><button type="button" className="wl" onClick={() => { api.logout(); setSess(null); setData(null); }}>로그아웃</button></p>
        <h1>내 진단함</h1>
        <p>진단 {rs.length}건 · 상담 {data.consults.length}건 · 타인 평가 {data.invites.filter((i) => i.doneAt).length}/{data.invites.length}</p>
      </div>

      <Sec no="01" title="진단 기록" small="6개월마다 다시 하면 변화가 보인다">
        {rs.length === 0 ? <Empty>아직 이 이메일로 받은 리포트가 없다. <Link className="link" to="/test">진단하기</Link></Empty> : (
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>ID</th><th>날짜</th><th>목표</th><th>패턴</th><th className="right">A</th><th className="right">T</th><th className="right">N</th><th /></tr></thead>
            <tbody>{rs.map(({ r, c }) => (
              <tr key={r.id}><td className="mono">{r.id}</td><td className="mono">{fmtDate(r.createdAt)}</td><td>{c.role.short}</td><td>{c.patInfo.name}</td><td className="right mono">{c.atn.A.score ?? '–'}</td><td className="right mono">{c.atn.T.score ?? '–'}</td><td className="right mono">{c.atn.N.score ?? '–'}</td>
                <td className="nowrap"><Link className="wl" to={`/report/${r.id}`} onClick={() => unlocked.add(r.id)}>리포트</Link> · <Link className="wl" to={`/peer/new/${r.id}`}>360</Link></td></tr>
            ))}</tbody>
          </table></div>
        )}
        {a && b && (
          <div className="note-box mt16"><h3>최근 두 번의 변화 · {fmtDate(b.r.createdAt)} → {fmtDate(a.r.createdAt)}</h3>
            <p className="mono" style={{ fontSize: 13 }}>{['A', 'T', 'N'].map((k) => { const d = (a.c.atn[k].score ?? 0) - (b.c.atn[k].score ?? 0); return `${k} ${d >= 0 ? '+' : ''}${d}`; }).join('   ')}</p></div>
        )}
        <div className="btns mt16"><Link className="btn sm" to="/test">다시 진단하기</Link></div>
      </Sec>

      <div className="split">
        <Sec no="02" title="상담">
          {data.consults.length ? <ul className="plain">{data.consults.map((c) => <li key={c.id}><span className="mono">{c.date.replaceAll('-', '.')} {c.time}</span> · {c.product} · <span className="st" data-s={c.status === '확정' ? 'proven' : 'unknown'}>{c.status}</span></li>)}</ul> : <p className="mute" style={{ fontSize: 14 }}>신청한 상담이 없다. <Link className="wl" to="/consult">신청</Link></p>}
        </Sec>
        <Sec no="03" title="받은 메일">
          {data.mails.length ? <ul className="plain">{data.mails.map((m) => <li key={m.id}><span className="mono" style={{ color: 'var(--mute)' }}>{fmtDate(m.sentAt).slice(5)} {fmtTime(m.sentAt)}</span> <Link className="wl" to={`/mail/${m.id}`}>{m.subject}</Link></li>)}</ul> : <p className="mute">없음</p>}
        </Sec>
      </div>
    </main>
  );
}

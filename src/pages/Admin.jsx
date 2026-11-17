import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute, PATTERNS } from '../lib/score.js';
import { ROLES, PROFILE, DISTORTIONS } from '../data/test.js';
import { Px, Cells, Loading, useToast, fmtDate, fmtTime, fmtDur } from '../components/ui.jsx';
import { toCsv, download } from '../lib/csv.js';

const STAGES = ['신청', '확정', '완료', '상품 전환', '보류'];

function Dist({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  const sorted = [...rows].sort((a, b) => b[1] - a[1]);
  return <ul className="hbar">{sorted.map(([k, v]) => <li key={k}><span>{k}</span><span className="b"><i style={{ width: `${(v / max) * 100}%` }} /></span><span className="mono">{v}</span></li>)}</ul>;
}

function Login({ onOk }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <main className="wrap page" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="page-head"><p className="kicker mono"><span>ADMIN</span></p><h1>관리자</h1><p>진행자 전용 화면이다.</p></div>
      <form className="fields" onSubmit={async (e) => { e.preventDefault(); try { await api.adminLogin(pw); onOk(); } catch (x) { setErr(x.message); } }}>
        <label className="field"><span>비밀번호</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></label>
        {err && <p className="mono">— {err}</p>}
        <button className="btn" type="submit">들어가기</button>
        <p className="mono" style={{ color: 'var(--mute)' }}>데모 비밀번호: atn2026</p>
      </form>
    </main>
  );
}

export default function Admin() {
  const [ok, setOk] = useState(api.adminAuthed());
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('overview');
  const [qs, setQs] = useState({ q: '', role: '', pat: '', lead: false });
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [toast, say] = useToast();
  const load = () => api.adminData().then(setD);
  useEffect(() => { if (ok) load(); }, [ok]);

  const rows = useMemo(() => (d ? d.responses.map((r) => ({ r, c: compute(r) })) : []), [d]);
  if (!ok) return <Login onOk={() => setOk(true)} />;
  if (!d) return <main className="wrap page"><Loading /></main>;

  const leads = rows.filter((x) => x.r.email);
  const last30 = rows.filter((x) => Date.now() - new Date(x.r.createdAt) < 30 * 864e5);
  const conv = d.consults.filter((c) => c.status === '상품 전환').length;
  const invDone = d.invites.filter((i) => i.doneAt).length;
  const count = (fn, keys) => keys.map((k) => [k, rows.filter((x) => fn(x) === k).length]);
  const filtered = rows.filter(({ r, c }) =>
    (!qs.q || [r.id, r.name, r.email, r.sentences?.now, r.sentences?.want].join(' ').toLowerCase().includes(qs.q.toLowerCase())) &&
    (!qs.role || r.profile.target === qs.role) && (!qs.pat || c.pat === qs.pat) && (!qs.lead || r.email));
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10);
    return [day, rows.filter((x) => x.r.createdAt.slice(0, 10) === day).length];
  });
  const dmax = Math.max(1, ...days.map((x) => x[1]));
  const cur = sel && rows.find((x) => x.r.id === sel);

  function exportCsv(list) {
    download(`rdt-leads-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(list.map(({ r, c }) => ({
      id: r.id, date: fmtDate(r.createdAt), name: r.name || '', email: r.email || '', years: r.profile.years, current: r.profile.current,
      industry: r.profile.industry, concern: r.profile.concern, target: c.role.name, A: c.atn.A.score ?? '', T: c.atn.T.score ?? '', N: c.atn.N.score ?? '',
      pattern: c.patInfo.name, fit: c.rf.fit, trap: c.th.top.map((d) => `${d.name}(${d.n})`).join(' '), balanced: `${c.th.ok}/${c.th.total}`, now: r.sentences?.now || '', want: r.sentences?.want || '',
    }))));
    say(`${list.length}건을 CSV로 내보냈다`);
  }

  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>ADMIN · 진행자</span><span>{fmtDate(new Date().toISOString())} 기준</span><button type="button" className="wl" onClick={() => { api.adminLogout(); setOk(false); }}>나가기</button></p>
        <h1>운영 현황</h1>
        <p>진단 → 리포트 → 상담 → 프로그램. 한 달 2–3명 전환이 목표다.</p>
      </div>

      <div className="kpis">
        <div><span className="mono">응답 · 30일</span><b>{last30.length}</b><small>누적 {rows.length}</small></div>
        <div><span className="mono">리포트 신청</span><b>{leads.length}</b><small>전환 {Math.round((leads.length / rows.length) * 100)}%</small></div>
        <div><span className="mono">상담 신청</span><b>{d.consults.length}</b><small>대기 {d.consults.filter((c) => c.status === '신청').length}</small></div>
        <div><span className="mono">프로그램 전환</span><b>{conv}</b><small>상담 대비 {d.consults.length ? Math.round((conv / d.consults.length) * 100) : 0}%</small></div>
        <div><span className="mono">360 응답</span><b>{invDone}</b><small>요청 {d.invites.length}</small></div>
        <div><span className="mono">평균 소요</span><b style={{ fontSize: 20, paddingTop: 8 }}>{fmtDur(Math.round(rows.reduce((s, x) => s + (x.r.durationSec || 0), 0) / rows.length))}</b><small>목표 7–10분</small></div>
      </div>

      <div className="tabs mt24">
        {[['overview', '개요'], ['leads', '응답·리드', rows.length], ['pipe', '상담 파이프라인', d.consults.length], ['peer', '360', d.invites.length], ['mail', '메일 로그', d.mails.length]].map(([k, t, n]) => (
          <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}{n != null && <span className="mono">{n}</span>}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="sec-h"><span className="mono">30D</span><h2>일별 응답</h2><small>최대 {dmax}건</small></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 2, alignItems: 'end', height: 90, borderBottom: '1px solid var(--ink)' }}>
            {days.map(([day, n], i) => <div key={day} title={`${day} · ${n}건`} style={{ height: `${(n / dmax) * 100}%`, minHeight: n ? 3 : 0, background: i === 29 ? 'var(--accent)' : 'var(--ink)' }} />)}
          </div>
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mute)', marginTop: 4 }}><span>{days[0][0].slice(5)}</span><span>오늘</span></div>
          <div className="split mt40">
            <div><div className="sec-h"><span className="mono">ROLE</span><h2>목표 역할</h2></div><Dist rows={ROLES.map((ro) => [ro.short, rows.filter((x) => x.r.profile.target === ro.id).length])} /></div>
            <div><div className="sec-h"><span className="mono">ATN</span><h2>평판 패턴</h2></div><Dist rows={Object.keys(PATTERNS).map((k) => [PATTERNS[k].name, rows.filter((x) => x.c.pat === k).length]).filter((x) => x[1])} /></div>
            <div><div className="sec-h"><span className="mono">NEED</span><h2>지금의 고민</h2></div><Dist rows={count((x) => x.r.profile.concern, PROFILE[3].opts)} /></div>
            <div><div className="sec-h"><span className="mono">YEARS</span><h2>경력</h2></div><Dist rows={count((x) => x.r.profile.years, PROFILE[0].opts)} /></div>
            <div><div className="sec-h"><span className="mono">CBT</span><h2>가장 많이 고른 생각의 함정</h2><small>응답자별 1순위</small></div><Dist rows={Object.keys(DISTORTIONS).map((k) => [DISTORTIONS[k].name, rows.filter((x) => x.c.th.top[0]?.id === k).length]).filter((x) => x[1])} /></div>
            <div><div className="sec-h"><span className="mono">SPAN</span><h2>책임 범위</h2></div><Dist rows={count((x) => x.r.profile.span, PROFILE[4].opts)} /></div>
          </div>
          <div className="note-box mt24"><h3>읽을 거리</h3><p>생각의 함정 1순위로는 <b>{(() => { const t = Object.keys(DISTORTIONS).map((k) => [k, rows.filter((x) => x.c.th.top[0]?.id === k).length]).sort((a, b) => b[1] - a[1])[0]; return t ? DISTORTIONS[t[0]].name : '—'; })()}</b>이 가장 많다. 상담 첫 10분은 이 생각이 사실인지 따지는 데 쓴다. 가장 많은 평판 패턴은 <b>{Object.keys(PATTERNS).map((k) => [k, rows.filter((x) => x.c.pat === k).length]).sort((a, b) => b[1] - a[1])[0] && PATTERNS[Object.keys(PATTERNS).map((k) => [k, rows.filter((x) => x.c.pat === k).length]).sort((a, b) => b[1] - a[1])[0][0]].name}</b>. 상담에서 이 패턴의 처방을 먼저 준비한다. 서술형 ‘지금 문장’에 ‘모르겠다’가 {rows.filter((x) => /모르/.test(x.r.sentences?.now || '')).length}건, 이 응답자는 서사(N) 상담 수요가 크다.</p></div>
          <div className="btns mt24"><button type="button" className="btn sm ghost" onClick={async () => { await api.resetDemo(); await load(); say('데모 데이터를 처음 상태로 되돌렸다'); }}>데모 데이터 초기화</button></div>
        </>
      )}

      {tab === 'leads' && (
        <div className={cur ? 'split' : ''} style={cur ? { gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' } : undefined}>
          <div>
            <div className="toolbar">
              <input value={qs.q} onChange={(e) => setQs({ ...qs, q: e.target.value })} placeholder="ID, 이름, 이메일, 문장 검색" />
              <select value={qs.role} onChange={(e) => setQs({ ...qs, role: e.target.value })}><option value="">모든 역할</option>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.short}</option>)}</select>
              <select value={qs.pat} onChange={(e) => setQs({ ...qs, pat: e.target.value })}><option value="">모든 패턴</option>{Object.keys(PATTERNS).map((k) => <option key={k} value={k}>{PATTERNS[k].name}</option>)}</select>
              <label className="check"><input type="checkbox" checked={qs.lead} onChange={(e) => setQs({ ...qs, lead: e.target.checked })} />리드만</label>
              <button type="button" className="btn sm" onClick={() => exportCsv(filtered)}>CSV {filtered.length}</button>
            </div>
            <div className="scroll-x"><table className="tbl atbl">
              <thead><tr><th>ID</th><th>일시</th><th>이름</th><th>목표</th><th>패턴</th><th className="right">A·T·N</th></tr></thead>
              <tbody>{filtered.map(({ r, c }) => (
                <tr key={r.id} className={sel === r.id ? 'sel' : ''} onClick={() => { setSel(r.id); setNote(''); }}>
                  <td className="mono">{r.id}</td><td className="mono">{fmtDate(r.createdAt).slice(5)} {fmtTime(r.createdAt)}</td>
                  <td>{r.name || <span className="mute">익명</span>}{d.consults.some((x) => x.rid === r.id) && <span className="st" data-s="hidden" style={{ marginLeft: 6 }}>상담</span>}</td>
                  <td>{c.role.short}</td><td style={{ fontSize: 13 }}>{c.patInfo.name}</td>
                  <td className="right mono">{c.atn.A.score ?? '–'}·{c.atn.T.score ?? '–'}·{c.atn.N.score ?? '–'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          {cur && (
            <div className="drawer" style={{ alignSelf: 'start', position: 'sticky', top: 70 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="mono">{cur.r.id}</span><button type="button" className="mono" onClick={() => setSel(null)}>닫기 ×</button></div>
              <h3 style={{ fontSize: 20, marginTop: 6 }}>{cur.r.name || '익명'} <small className="mono" style={{ fontWeight: 400, color: 'var(--mute)' }}>{cur.r.email}</small></h3>
              <div className="info">
                <div className="row"><span>프로필</span><span>{cur.r.profile.years} · {cur.r.profile.current} · {cur.r.profile.industry}</span></div>
                <div className="row"><span>고민</span><span>{cur.r.profile.concern}</span></div>
                <div className="row"><span>목표</span><span>{cur.c.role.name} · {cur.c.rf.fit} · 상황판단 {cur.c.rf.sjt}/9</span></div>
                <div className="row"><span>패턴</span><span>{cur.c.patInfo.name}</span></div>
                <div className="row"><span>생각 함정</span><span>{cur.c.th.top.length ? cur.c.th.top.map((d) => `${d.name} ${d.n}`).join(', ') : '없음'} · 균형 {cur.c.th.ok}/{cur.c.th.total}</span></div>
                {cur.r.prediction && <div className="row"><span>360 예측</span><span className="mono">A {cur.r.prediction.A} · T {cur.r.prediction.T} · N {cur.r.prediction.N}</span></div>}
                {['A', 'T', 'N'].map((k) => <div className="row" key={k}><span>{cur.c.atn[k].name} {k}</span><span><Cells v={cur.c.atn[k].score} /></span></div>)}
                <div className="row"><span>지금 문장</span><span>{cur.r.sentences?.now || '—'}</span></div>
                <div className="row"><span>원하는 문장</span><span>{cur.r.sentences?.want || '—'}</span></div>
                <div className="row"><span>자료 부족</span><span>{cur.c.unknownTotal}건{cur.c.splits.length ? ` · 응답 불일치 ${cur.c.splits.map((x) => x.name).join(', ')}` : ''}</span></div>
              </div>
              <div className="btns mt16"><Link className="btn sm" to={`/report/${cur.r.id}`}>리포트</Link>{cur.r.email && <a className="btn sm ghost" href={`mailto:${cur.r.email}?subject=${encodeURIComponent('[평판진단] 리포트 관련')}`}>메일 쓰기</a>}</div>
              <div className="sec-h mt24"><span className="mono">EXPERT</span><h2>전문가 메모</h2><small>리포트에 함께 표시</small></div>
              <textarea className="field" style={{ width: '100%', minHeight: 70, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', font: 'inherit', padding: 8 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="AI 분류와 다른 판단, 인터뷰에서 확인할 것" />
              <button type="button" className="btn sm mt8" disabled={!note.trim()} onClick={async () => { await api.addNote(cur.r.id, note.trim()); setNote(''); await load(); say('메모를 남겼다'); }}>메모 저장</button>
              <ul className="plain mt8">{(d.notes[cur.r.id] || []).map((n) => <li key={n.at} style={{ fontSize: 13 }}><span className="mono" style={{ color: 'var(--mute)' }}>{fmtDate(n.at)} </span>{n.text}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {tab === 'pipe' && (
        <div className="scroll-x"><div className="pipe">
          {STAGES.map((s) => {
            const cs = d.consults.filter((c) => c.status === s);
            return (
              <div key={s}>
                <h4><span>{s}</span><span className="mono">{cs.length}</span></h4>
                {cs.map((c) => (
                  <div className="card" key={c.id}>
                    <span className="mono">{c.id} · {c.date.slice(5).replace('-', '.')} {c.time}</span>
                    <b>{c.name}</b>
                    <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>{c.product}{c.memo ? ` · ${c.memo}` : ''}</span>
                    {c.thought && <span style={{ fontSize: 12, borderLeft: '2px solid var(--accent)', paddingLeft: 6 }}>“{c.thought.th}” {c.thought.conf}%</span>}
                    <span className="mono">{c.rid ? <Link className="wl" to={`/report/${c.rid}`}>{c.rid}</Link> : '진단 없음'}</span>
                    <select value={c.status} onChange={async (e) => { await api.updateConsult(c.id, { status: e.target.value }); await load(); say(`${c.id} → ${e.target.value}`); }}>{STAGES.concat('취소').map((x) => <option key={x}>{x}</option>)}</select>
                  </div>
                ))}
                {!cs.length && <p className="mono" style={{ color: 'var(--mute)', padding: 10 }}>비어 있음</p>}
              </div>
            );
          })}
        </div></div>
      )}

      {tab === 'peer' && (
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>요청 진단</th><th>응답자</th><th>관계</th><th>요청일</th><th>상태</th><th>남긴 문장</th></tr></thead>
          <tbody>{d.invites.slice().reverse().map((i) => <tr key={i.token}><td className="mono">{i.rid}</td><td>{i.name}</td><td>{i.relation}</td><td className="mono">{fmtDate(i.sentAt)}</td><td>{i.doneAt ? <span className="st" data-s="proven">완료</span> : <span className="st" data-s="unknown">대기</span>}</td><td style={{ fontSize: 13 }}>{i.sentence || ''}</td></tr>)}</tbody>
        </table></div>
      )}

      {tab === 'mail' && (
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>ID</th><th>일시</th><th>종류</th><th>받는이</th><th>제목</th></tr></thead>
          <tbody>{d.mails.slice(0, 80).map((m) => <tr key={m.id}><td className="mono">{m.id}</td><td className="mono">{fmtDate(m.sentAt).slice(5)} {fmtTime(m.sentAt)}</td><td><span className="tag">{{ report: '리포트', consult: '상담', invite: '360', magic: '로그인' }[m.kind]}</span></td><td className="mono">{m.to}</td><td><Link className="wl" to={`/mail/${m.id}`}>{m.subject}</Link></td></tr>)}</tbody>
        </table></div>
      )}
      {toast}
      <div className="empty" style={{ paddingBottom: 0 }}><Px name="calendar" w={64} /></div>
    </main>
  );
}

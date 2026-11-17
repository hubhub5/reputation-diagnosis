import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute, level } from '../lib/score.js';
import { unlocked } from '../lib/store.js';
import { TRIAL } from '../lib/trial.js';
import { Px, Cells, Sec, Loading, Empty, fmtDate, fmtDur } from '../components/ui.jsx';

export function AtnTriple({ atn, peer }) {
  return (
    <div className="atn3">
      {['A', 'T', 'N'].map((k) => {
        const a = atn[k];
        return (
          <div key={k}>
            <span className="mono"><span>{k} · {a.en}</span><span>{level(a.score)}</span></span>
            <h3>{a.name} <small style={{ fontWeight: 400, color: 'var(--mute)' }}>{a.q}</small></h3>
            {a.score == null ? <div className="num na">자료 부족</div> : <div className="num">{a.score}<small>/ 100</small></div>}
            <Cells v={a.score} acc={k === 'N'} />
            {peer && <><span className="mono" style={{ marginTop: 4 }}><span>타인 평가 {peer.n}명</span><span>{peer.atn[k].score ?? '—'}</span></span><Cells v={peer.atn[k].score} peer /></>}
            <p>{a.d}</p>
          </div>
        );
      })}
    </div>
  );
}

const INCLUDES = ['Executive Summary', 'Contribution Profile · 6차원 4층위', 'ATN Reputation Status · 불균형 해석', 'Thinking Check · 생각의 함정과 행동 실험', 'Role Reputation Fit · 8항목 격차와 판단 기준', 'Evidence Review · 자료 부족 영역', 'Development Roadmap · 3·6·12개월'];

export default function Result() {
  const { id } = useParams();
  const [r, setR] = useState(undefined);
  const [form, setForm] = useState({ name: '', email: '', agree: false });
  const [sending, setSending] = useState(false);
  const [mail, setMail] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.getResponse(id).then(setR); }, [id]);
  if (r === undefined) return <main className="wrap page"><Loading /></main>;
  if (!r) return <main className="wrap page"><Empty>진단 기록 {id}을 찾지 못했다. <Link className="link" to="/test">새로 진단하기</Link></Empty></main>;

  const c = compute(r);
  const open = TRIAL || !!r.reportSentAt || unlocked.has(id) || !!mail;

  async function send(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErr('이메일 형식을 확인한다');
    if (!form.agree) return setErr('리포트 발송을 위한 개인정보 수집에 동의가 필요하다');
    setErr(''); setSending(true);
    const m = await api.sendReport(id, form);
    unlocked.add(id);
    setMail(m); setSending(false);
    setR(await api.getResponse(id));
  }

  return (
    <main className="wrap page narrow" style={{ margin: '0 auto' }}>
      <div className="doc-meta mono"><b>{r.id}</b><span>{fmtDate(r.createdAt)}</span><span>소요 {fmtDur(r.durationSec || 500)}</span><span>목표 {c.role.short}</span><span className="status">요약</span></div>
      <h1 className="doc-title">진단 요약</h1>
      <p className="doc-line">{c.patInfo.d}</p>

      <Sec no="A·T·N" title="평판 형성 상태" small="세 영역은 단계가 아니다. 따로 본다">
        <AtnTriple atn={c.atn} />
        <div className="verdict">
          <Px name="scale" />
          <div>
            <p className="mono" style={{ color: 'var(--mute)' }}>PATTERN</p>
            <h3>{c.patInfo.name}</h3>
            <p>{c.patInfo.d}</p>
            <p className="mt8"><b>먼저 할 일</b> {c.patInfo.rx}</p>
          </div>
        </div>
      </Sec>

      <div className="info">
        <div className="row"><span>주요 기여</span><span className="tags">{c.lay.main.map((d) => <span className="tag on" key={d.id}>{d.name}</span>)}{c.lay.sub.map((d) => <span className="tag" key={d.id}>{d.name}</span>)}</span></div>
        <div className="row"><span>개발 필요</span><span>{c.lay.dev.length ? c.lay.dev.map((d) => d.name).join(', ') : `${c.role.short} 역할 요구 차원에서 큰 공백 없음`}</span></div>
        <div className="row"><span>목표 역할</span><span>{c.role.name} · <b>{c.rf.fit}</b><br /><small style={{ color: 'var(--ink-2)' }}>{c.rf.fitD}</small></span></div>
        <div className="row"><span>생각 습관</span><span>{c.th.top.length ? <>{c.th.top.slice(0, 2).map((d) => <span className="tag on" key={d.id} style={{ marginRight: 4 }}>{d.name} {d.n}</span>)}<br /><small style={{ color: 'var(--ink-2)' }}>장면 {c.th.total}개 중 {c.th.ok}개에서 균형 잡힌 생각을 골랐다. {c.th.top[0].d}</small></> : `장면 ${c.th.total}개 모두 균형 잡힌 생각을 골랐다.`}</span></div>
        <div className="row"><span>지금 문장</span><span>{r.sentences?.now || <span className="mute">비워 둠</span>}</span></div>
        <div className="row"><span>듣고 싶은 문장</span><span>{r.sentences?.want || <span className="mute">비워 둠</span>}</span></div>
        {c.unknownTotal > 0 && <div className="row"><span>판단 유보</span><span>{c.unknownTotal}개 문항을 ‘판단하기 어렵다’로 답했다. 낮은 점수로 계산하지 않고 360 타인 평가로 보완한다.</span></div>}
      </div>

      {!open ? (
        <>
          <form className="gate" onSubmit={send}>
            <div>
              <p className="mono" style={{ color: 'var(--mute)' }}>FULL REPORT · PDF 12쪽 분량</p>
              <h2 className="mt8">전체 리포트는 이메일로 보낸다</h2>
              <ul>{INCLUDES.map((t, i) => <li key={t}><span className="mono">{String(i + 1).padStart(2, '0')}</span><span>{t}</span></li>)}</ul>
            </div>
            <div className="fields">
              <label className="field"><span>이름</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" autoComplete="name" /></label>
              <label className="field"><span>이메일</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" autoComplete="email" /></label>
              <label className="check"><input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} /><span>리포트 발송과 상담 안내를 위해 이름과 이메일을 1년간 보관하는 데 동의한다. <Link className="wl" to="/privacy">자세히</Link></span></label>
              {err && <p className="mono" style={{ color: 'var(--ink)' }}>— {err}</p>}
              <button className="btn" type="submit" disabled={sending}>{sending ? '보내는 중' : '리포트 받기'}</button>
              <p className="mono" style={{ color: 'var(--mute)' }}>광고 메일은 보내지 않는다.</p>
            </div>
          </form>
          <div className="locked" aria-hidden="true">
            <div className="blur">
              <div className="sec-h"><span className="mono">02</span><h2>Contribution Profile</h2></div>
              {c.dims.map((d) => <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '6px 0' }}><span>{d.name}</span><Cells v={d.score} /></div>)}
            </div>
          </div>
        </>
      ) : (
        <div className="gate">
          <div className="sent">
            <Px name="envelope" />
            <div>
              <p className="mono" style={{ color: 'var(--mute)' }}>{TRIAL ? 'TRIAL · 메일 없이 열람' : `SENT · ${r.email}`}</p>
              <h2 className="mt8">{TRIAL ? '전체 리포트가 준비됐다' : '리포트를 보냈다'}</h2>
              <p className="mt8" style={{ color: 'var(--ink-2)', fontSize: 14 }}>{TRIAL ? '체험판에서는 이메일을 받지 않고 바로 연다. 탭을 닫으면 리포트도 사라지니 필요하면 PDF로 저장한다.' : '메일이 오지 않으면 스팸함을 확인한다. 같은 내용을 여기서 바로 열 수 있다.'}</p>
            </div>
          </div>
          <div className="fields">
            <Link className="btn" to={`/report/${id}`}>전체 리포트 열기</Link>
            {mail && <Link className="btn ghost" to={`/mail/${mail.id}`}>보낸 메일 보기</Link>}
            <Link className="btn ghost" to="/consult">30분 해석 상담 신청</Link>
          </div>
        </div>
      )}

      <Sec no="NEXT" title="자기 응답만으로는 평판을 확정하지 않는다">
        <div className="blocks" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <Link className="block" to={`/peer/new/${id}`} style={{ aspectRatio: 'auto', minHeight: 170 }}><span className="mono"><span>360</span><span>4분</span></span><h3>동료 3명에게 같은 질문 보내기</h3><p>내가 본 나와 남이 쓰는 문장의 차이</p></Link>
          <Link className="block" to="/sentence" style={{ aspectRatio: 'auto', minHeight: 170 }}><span className="mono"><span>N</span><span>5분</span></span><h3>한 문장 만들기</h3><p>‘그 문제라면 이 사람’을 내 말로</p></Link>
          <Link className="block" to="/roadmap" style={{ aspectRatio: 'auto', minHeight: 170 }}><span className="mono"><span>PLAN</span><span>3·6·12</span></span><h3>평판 개발 로드맵</h3><p>결과에서 과제를 자동으로 채운다</p></Link>
          <Link className="block" to="/consult" style={{ aspectRatio: 'auto', minHeight: 170 }}><span className="mono"><span>1:1</span><span>30분</span></span><h3>해석 상담</h3><p>리포트를 함께 읽고 다음 한 걸음</p></Link>
        </div>
      </Sec>
    </main>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { lastId } from '../lib/store.js';
import { Px, Sec } from '../components/ui.jsx';
import { PRODUCTS } from './Services.jsx';

const TIMES = ['10:00', '11:00', '14:00', '15:30', '17:00', '19:30'];
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function ics(c) {
  const [h, m] = c.time.split(':');
  const start = `${c.date.replaceAll('-', '')}T${h}${m}00`;
  const endM = +m + 30;
  const end = `${c.date.replaceAll('-', '')}T${String(+h + Math.floor(endM / 60)).padStart(2, '0')}${String(endM % 60).padStart(2, '0')}00`;
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//rdt//consult//KO', 'BEGIN:VEVENT', `UID:${c.id}@rdt`, `DTSTART;TZID=Asia/Seoul:${start}`, `DTEND;TZID=Asia/Seoul:${end}`, `SUMMARY:평판진단 30분 해석 상담 (${c.id})`, 'DESCRIPTION:화상 링크는 하루 전에 메일로 보낸다.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  a.download = `consult-${c.id}.ics`;
  a.click();
}

export default function Consult() {
  const [q] = useSearchParams();
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [busy, setBusy] = useState([]);
  const [pick, setPick] = useState({ date: '', time: '' });
  const [f, setF] = useState({ name: '', email: '', phone: '', product: q.get('product') || 'diag', rid: q.get('rid') || lastId.get() || '', memo: '', agree: false });
  const [th, setTh] = useState({ sit: '', th: '', conf: 70 });
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  useEffect(() => { api.busySlots().then(setBusy); }, []);

  const days = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(y, m, i + 1))];
  }, [month]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const limit = new Date(today); limit.setDate(limit.getDate() + 42);
  const open = (d) => d && d > today && d <= limit && d.getDay() !== 0;
  const freeTimes = (ds) => TIMES.filter((t) => !busy.includes(`${ds} ${t}`));

  async function submit(e) {
    e.preventDefault();
    if (!pick.date || !pick.time) return setErr('날짜와 시간을 고른다');
    if (!f.name.trim()) return setErr('이름을 적는다');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('이메일 형식을 확인한다');
    if (!f.agree) return setErr('개인정보 수집 동의가 필요하다');
    setErr(''); setSending(true);
    const res = await api.createConsult({ ...f, product: PRODUCTS.find((p) => p.id === f.product)?.name || '아직 모름', ...pick, thought: th.sit || th.th ? th : null });
    setDone(res); setSending(false);
  }

  if (done) {
    const c = done.consult;
    return (
      <main className="wrap page narrow" style={{ margin: '0 auto' }}>
        <div className="wait" style={{ paddingTop: 40 }}>
          <Px name="calendar" />
          <p className="mono" style={{ color: 'var(--mute)' }}>{c.id} · 신청 접수</p>
          <h1 style={{ fontSize: 26 }}>{c.date.replaceAll('-', '.')} {c.time}, 30분</h1>
          <p style={{ color: 'var(--ink-2)' }}>확인 메일을 {c.email}로 보냈다. 하루 전에 화상 링크를 보낸다.<br />{c.rid ? `${c.rid} 리포트를 미리 읽고 들어간다.` : '상담 전에 진단을 해 두면 30분을 더 깊게 쓸 수 있다.'}</p>
          <div className="btns" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={() => ics(c)}>캘린더에 추가 (.ics)</button>
            <Link className="btn ghost" to={`/mail/${done.mail.id}`}>확인 메일 보기</Link>
            {!c.rid && <Link className="btn ghost" to="/test">진단하기</Link>}
          </div>
        </div>
      </main>
    );
  }

  const ds = pick.date;
  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>CONSULT · 30분 · 무료</span><span>화상</span></p>
        <h1>30분 해석 상담 신청</h1>
        <p>리포트를 함께 읽고 다음 한 걸음을 정한다. 프로그램을 권하지 않아도 되는 경우가 있으면 그렇게 말한다.</p>
      </div>
      <form className="split" onSubmit={submit}>
        <div>
          <Sec no="01" title="날짜와 시간" small="6주 안 · 일요일 제외">
            <div className="cal">
              <div className="ch">
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)}>‹</button>
                <b className="mono" style={{ fontSize: 13 }}>{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, '0')}</b>
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
              <div className="days">
                {days.map((d, i) => d ? (
                  <button type="button" key={i} disabled={!open(d) || !freeTimes(iso(d)).length} className={ds === iso(d) ? 'on' : ''} onClick={() => setPick({ date: iso(d), time: '' })}>
                    {d.getDate()}{open(d) && freeTimes(iso(d)).length <= 2 && freeTimes(iso(d)).length > 0 && <span className="dot" title="자리 적음" />}
                  </button>
                ) : <button type="button" key={i} disabled />)}
              </div>
            </div>
            {ds && (
              <div className="times">
                {TIMES.map((t) => <button type="button" key={t} disabled={busy.includes(`${ds} ${t}`)} className={pick.time === t ? 'on' : ''} onClick={() => setPick({ ...pick, time: t })}>{t}</button>)}
              </div>
            )}
            <p className="legend"><span><i style={{ background: 'var(--accent)' }} />자리 적음</span><span>취소선은 마감</span></p>
          </Sec>
        </div>
        <div>
          <Sec no="02" title="신청 정보">
            <div className="fields">
              <label className="field"><span>이름</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></label>
              <label className="field"><span>이메일</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
              <label className="field"><span>연락처 (선택)</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></label>
              <label className="field"><span>관심 프로그램</span>
                <select value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })}>{PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.price}</option>)}<option value="none">아직 모름</option></select>
              </label>
              <label className="field"><span>진단 ID (있으면 리포트를 미리 읽는다)</span><input value={f.rid} onChange={(e) => setF({ ...f, rid: e.target.value })} placeholder="RD-0000" className="mono" /></label>
              <label className="field"><span>지금 고민 한두 줄</span><textarea value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} placeholder="예: 6개월 뒤 부사장 후보 검토가 있다. 실무 평판은 좋은데 경영 판단을 맡길 사람으로는 안 보이는 것 같다." /></label>
              <div className="note-box">
                <h3>상담 전 생각 기록 (선택) · 30분을 더 깊게 쓰기 위해</h3>
                <div className="fields">
                  <label className="field"><span>최근 이름이 걸렸던 장면 하나</span><input value={th.sit} onChange={(e) => setTh({ ...th, sit: e.target.value })} placeholder="예: 임원 회의에서 내 제안이 다른 사람 이름으로 채택됐다" /></label>
                  <label className="field"><span>그때 가장 먼저 든 생각</span><input value={th.th} onChange={(e) => setTh({ ...th, th: e.target.value })} placeholder="예: 말해 봤자 공을 다투는 사람으로 보일 것이다" /></label>
                  <label className="field"><span>그 생각을 지금 얼마나 믿는가 · {th.conf}%</span><input type="range" min="0" max="100" step="10" value={th.conf} onChange={(e) => setTh({ ...th, conf: +e.target.value })} /></label>
                </div>
              </div>
              <label className="check"><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} /><span>상담 진행을 위해 위 정보를 1년간 보관하는 데 동의한다. <Link className="wl" to="/privacy">자세히</Link></span></label>
              <div className="note-box"><h3>선택한 시간</h3><p className="mono" style={{ fontSize: 14 }}>{ds ? `${ds.replaceAll('-', '.')} ${pick.time || '—'} · 30분` : '—'}</p></div>
              {err && <p className="mono">— {err}</p>}
              <button className="btn" type="submit" disabled={sending}>{sending ? '신청하는 중' : '상담 신청'}</button>
            </div>
          </Sec>
        </div>
      </form>
    </main>
  );
}

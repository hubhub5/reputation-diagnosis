import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { lastId } from '../lib/store.js';
import { compute, roadmapTasks, experiments } from '../lib/score.js';
import { Empty, Loading, fmtTime } from '../components/ui.jsx';

const AREAS = ['인지', '신뢰', '서사', '기여', '생각', '확인'];
const addMonths = (m) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); };

export default function Roadmap() {
  const rid = lastId.get();
  const [r, setR] = useState(undefined);
  const [plan, setPlan] = useState(null);
  const [saved, setSaved] = useState(null);
  const [draftTask, setDraftTask] = useState({ text: '', term: 3, area: '서사' });
  const first = useRef(true);

  useEffect(() => {
    if (!rid) { setR(null); return; }
    Promise.all([api.getResponse(rid), api.roadmap(rid)]).then(([resp, rm]) => {
      setR(resp);
      if (!resp) return;
      if (rm) { setPlan({ exps: experiments(compute(resp)), ...rm }); setSaved(rm.savedAt); return; }
      const c = compute(resp);
      setPlan({
        objective: resp.sentences?.want || `${c.role.name} 역할에 필요한 신뢰 만들기`,
        due: addMonths(12),
        tasks: roadmapTasks(c).map((t) => ({ ...t, due: addMonths(t.term) })),
        exps: experiments(c),
        notes: '',
      });
    });
  }, [rid]);

  useEffect(() => {
    if (!plan) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(async () => { const s = await api.saveRoadmap(rid, plan); setSaved(s.savedAt); }, 600);
    return () => clearTimeout(t);
  }, [plan, rid]);

  if (r === undefined) return <main className="wrap page"><Loading /></main>;
  if (!r) return <main className="wrap page"><Empty px="stairs">진단 결과가 있어야 과제를 채울 수 있다. <Link className="link" to="/test">진단하기</Link></Empty></main>;
  if (!plan) return <main className="wrap page"><Loading /></main>;

  const upd = (id, patch) => setPlan({ ...plan, tasks: plan.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const total = plan.tasks.length;
  const doneN = plan.tasks.filter((t) => t.done).length;
  const termPct = (m) => { const ts = plan.tasks.filter((t) => t.term === m); return ts.length ? ts.reduce((s, t) => s + (t.done ? 5 : t.prog), 0) / (ts.length * 5) : 0; };

  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>DEVELOPMENT ROADMAP</span><span>{rid}</span><span>{saved ? `저장됨 ${fmtTime(saved)}` : '자동 저장'}</span></p>
        <h1>평판 개발 플래너</h1>
        <p>진단 결과에서 과제를 채웠다. 고치고, 지우고, 더한다. 칸을 누르면 진행도가 바뀐다.</p>
      </div>

      <div className="planner">
        <div className="ph">
          <h2><b>Reputation</b> Planner</h2>
          <span className="mono" style={{ color: 'var(--mute)' }}>완료 {doneN}/{total}</span>
        </div>
        <div className="obj">
          <div><span>목표 문장</span><input value={plan.objective} onChange={(e) => setPlan({ ...plan, objective: e.target.value })} /></div>
          <div><span>기한</span><input type="date" value={plan.due} onChange={(e) => setPlan({ ...plan, due: e.target.value })} style={{ fontFamily: 'var(--mono)', letterSpacing: 0, fontSize: 12 }} /></div>
        </div>

        <div className="term">
          <h3>Timeline</h3>
          <div className="scroll-x"><table className="ptbl">
            <thead><tr><th style={{ textAlign: 'left', width: 120 }}>구간</th>{Array.from({ length: 12 }, (_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
            <tbody>
              {[[3, 0, 3], [6, 3, 6], [12, 6, 12]].map(([m, a, b]) => {
                const p = termPct(m);
                return (
                  <tr key={m}><td>{m}개월 과제</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const inR = i >= a && i < b;
                      const filled = inR && (i - a) < Math.round(p * (b - a));
                      return <td key={i} style={{ padding: 0, height: 26, background: inR ? (filled ? 'color-mix(in srgb, var(--accent) 70%, transparent)' : 'var(--tint)') : undefined, textAlign: 'center', fontSize: 11 }}>{filled ? '✓' : ''}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>

        {[3, 6, 12].map((m) => {
          const ts = plan.tasks.filter((t) => t.term === m);
          return (
            <div className="term" key={m}>
              <h3>{m}개월 안에</h3>
              <div className="scroll-x"><table className="ptbl">
                <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>과제</th><th>영역</th><th>진행</th><th>기한</th><th>✓</th><th /></tr></thead>
                <tbody>
                  {ts.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--mute)', textAlign: 'center' }}>과제 없음</td></tr>}
                  {ts.map((t, i) => (
                    <tr key={t.id}>
                      <td className="n">{i + 1}</td>
                      <td className={'task' + (t.done ? ' done' : '')}><span>{t.task}</span>{t.why && <small>{t.why}</small>}</td>
                      <td className="area"><span className="tag">{t.area}</span></td>
                      <td className="pg"><div className="row5">{[1, 2, 3, 4, 5].map((k) => <button type="button" key={k} aria-label={`진행 ${k * 20}%`} className={(t.done ? 5 : t.prog) >= k ? 'on' : ''} onClick={() => upd(t.id, { prog: t.prog === k ? k - 1 : k, done: k === 5 })} />)}</div></td>
                      <td className="due"><input type="date" value={t.due} onChange={(e) => upd(t.id, { due: e.target.value })} /></td>
                      <td className="ck"><label className="check" style={{ justifyContent: 'center' }}><input type="checkbox" checked={t.done} onChange={(e) => upd(t.id, { done: e.target.checked, prog: e.target.checked ? 5 : t.prog })} /></label></td>
                      <td className="del"><button type="button" onClick={() => setPlan({ ...plan, tasks: plan.tasks.filter((x) => x.id !== t.id) })} aria-label="삭제">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          );
        })}

        <form className="add" onSubmit={(e) => { e.preventDefault(); if (!draftTask.text.trim()) return; setPlan({ ...plan, tasks: [...plan.tasks, { id: `u${Date.now()}`, term: +draftTask.term, area: draftTask.area, task: draftTask.text.trim(), why: '', prog: 0, done: false, due: addMonths(+draftTask.term) }] }); setDraftTask({ ...draftTask, text: '' }); }}>
          <input value={draftTask.text} onChange={(e) => setDraftTask({ ...draftTask, text: e.target.value })} placeholder="과제 추가" />
          <select value={draftTask.term} onChange={(e) => setDraftTask({ ...draftTask, term: e.target.value })}><option value={3}>3개월</option><option value={6}>6개월</option><option value={12}>12개월</option></select>
          <select value={draftTask.area} onChange={(e) => setDraftTask({ ...draftTask, area: e.target.value })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          <button className="btn sm" type="submit">추가</button>
        </form>

        <div className="term">
          <h3>행동 실험 기록 <small className="mono" style={{ fontWeight: 400, color: 'var(--mute)' }}>예상과 실제를 비교해 생각의 함정을 확인한다</small></h3>
          <div className="scroll-x"><table className="ptbl">
            <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>실험</th><th>해 보기 전 예상</th><th>확신</th><th>실제로 일어난 일</th><th>배운 점</th></tr></thead>
            <tbody>
              {(plan.exps || []).length === 0 && <tr><td colSpan={6} style={{ color: 'var(--mute)', textAlign: 'center' }}>장면에서 함정이 나오지 않아 실험이 없다</td></tr>}
              {(plan.exps || []).map((x, i) => {
                const upx = (patch) => setPlan({ ...plan, exps: plan.exps.map((y) => (y.id === x.id ? { ...y, ...patch } : y)) });
                const cell = { width: '100%', border: 0, background: 'transparent', color: 'var(--ink)', font: 'inherit', letterSpacing: 'var(--track)', resize: 'vertical', minHeight: 44, outline: 'none' };
                return (
                  <tr key={x.id}>
                    <td className="n">{i + 1}</td>
                    <td className="task" style={{ minWidth: 200 }}><span>{x.plan}</span><small>{x.trap}</small></td>
                    <td style={{ minWidth: 150 }}><textarea style={cell} value={x.expect} onChange={(e) => upx({ expect: e.target.value })} placeholder="예: 다들 자랑한다고 생각할 것" /></td>
                    <td className="mono" style={{ width: 70 }}><input type="number" min="0" max="100" step="10" value={x.conf} onChange={(e) => upx({ conf: +e.target.value })} style={{ ...cell, minHeight: 0, width: 44 }} />%</td>
                    <td style={{ minWidth: 150 }}><textarea style={cell} value={x.actual} onChange={(e) => upx({ actual: e.target.value })} placeholder="예: 두 명이 자료를 달라고 했다" /></td>
                    <td style={{ minWidth: 130 }}><textarea style={cell} value={x.learned} onChange={(e) => upx({ learned: e.target.value })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>

        <div className="notes">
          <h3>Notes</h3>
          <textarea value={plan.notes} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} placeholder="이번 달에 이름이 불린 장면, 들은 문장, 놓친 기회를 적는다." />
        </div>
      </div>

      <div className="btns mt24">
        <button className="btn ghost" type="button" onClick={() => window.print()}>인쇄</button>
        <Link className="btn ghost" to={`/report/${rid}`}>리포트로</Link>
        <Link className="btn" to={`/consult?rid=${rid}`}>이 계획으로 상담받기</Link>
      </div>
    </main>
  );
}

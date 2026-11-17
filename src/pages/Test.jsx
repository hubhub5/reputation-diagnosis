import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PROFILE, CONTRIB, ATN_ITEMS, ROLES, SCALES, TURNS, REQ_STATES, DIMS, ATN, SCENES } from '../data/test.js';
import { roleById } from '../lib/score.js';
import { api } from '../lib/api.js';
import { draft, lastId } from '../lib/store.js';
import { Px } from '../components/ui.jsx';

const KIND = { self: '자기 인식형', act: '행동 경험형', ext: '외부 인식형', judge: '상황 판단형', scene: '장면 · 떠오르는 생각' };

function buildSteps() {
  return [
    ...PROFILE.map((item) => ({ type: 'profile', item, sec: '프로필' })),
    { type: 'target', sec: '프로필' },
    { type: 'turn', key: 'contrib' },
    ...CONTRIB.map((item) => ({ type: 'likert', item, sec: 'AXIS 01', dimName: DIMS.find((d) => d.id === item.dim).name })),
    { type: 'turn', key: 'atn' },
    ...ATN_ITEMS.map((item) => ({ type: 'likert', item, sec: 'AXIS 02', dimName: ATN.find((d) => d.id === item.dim).name + ' ' + item.dim })),
    { type: 'turn', key: 'think' },
    ...SCENES.map((sc, i) => ({ type: 'scene', sc, i, sec: 'THINKING' })),
    { type: 'turn', key: 'role' },
    ...[0, 1, 2].map((i) => ({ type: 'sjt', i, sec: 'AXIS 03' })),
    { type: 'reqs', sec: 'AXIS 03' },
    { type: 'turn', key: 'sentence' },
    { type: 'text', sec: '마지막' },
  ];
}

export default function Test() {
  const nav = useNavigate();
  const steps = useMemo(buildSteps, []);
  const init = draft.load();
  const [st, setSt] = useState(init || { step: 0, profile: {}, answers: {}, sentences: { now: '', want: '' }, startedAt: Date.now() });
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [resumed, setResumed] = useState(!!(init && init.step > 0));

  useEffect(() => { if (!busy) draft.save(st); }, [st, busy]);

  const cur = steps[st.step];
  const role = roleById(st.profile.target);
  const qSteps = steps.filter((s) => s.type !== 'turn');
  const qIndex = qSteps.indexOf(cur);

  const go = useCallback((d) => setSt((s) => ({ ...s, step: Math.max(0, Math.min(steps.length - 1, s.step + d)) })), [steps.length]);
  const setProfile = (k, v) => { setSt((s) => ({ ...s, profile: { ...s.profile, [k]: v } })); setTimeout(() => go(1), 180); };
  const setAns = (k, v, adv = true) => { setSt((s) => ({ ...s, answers: { ...s.answers, [k]: v } })); if (adv) setTimeout(() => go(1), 180); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (cur?.type === 'likert' && /^[1-5]$/.test(e.key)) setAns(cur.item.id, +e.key);
      if (cur?.type === 'likert' && e.key === '0') setAns(cur.item.id, 0);
      if (cur?.type === 'scene' && /^[1-4]$/.test(e.key)) setAns(cur.sc.id, +e.key - 1);
      if (cur?.type === 'sjt' && /^[1-4]$/.test(e.key)) setAns(`s${cur.i}`, +e.key - 1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Enter' && cur?.type === 'turn') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const canNext = (() => {
    if (!cur) return false;
    if (cur.type === 'profile') return !!st.profile[cur.item.id];
    if (cur.type === 'target') return !!st.profile.target;
    if (cur.type === 'likert') return st.answers[cur.item.id] != null;
    if (cur.type === 'sjt') return st.answers[`s${cur.i}`] != null;
    if (cur.type === 'scene') return st.answers[cur.sc.id] != null;
    if (cur.type === 'reqs') return role.reqs.every((_, i) => st.answers[`r${i}`]);
    return true;
  })();

  async function submit() {
    setBusy(true);
    const ph = [0, 1, 2, 3, 4];
    for (const p of ph) { setPhase(p); await new Promise((r) => setTimeout(r, 520)); }
    const r = await api.createResponse({
      profile: st.profile, answers: st.answers, sentences: st.sentences,
      durationSec: Math.min(1800, Math.max(120, Math.round((Date.now() - st.startedAt) / 1000))),
    });
    lastId.set(r.id);
    draft.clear();
    nav(`/result/${r.id}`);
  }

  if (busy) {
    const items = ['가치 기여 6차원 정리', 'ATN 영역별 점수와 불균형', '장면별 생각 습관 분류', `${role.short} 역할 요구사항 대조`, '요약 작성'];
    return (
      <main className="test">
        <div className="wait">
          <Px name="hourglass" />
          <p className="mono">ANALYSING · 자료 부족 항목은 점수에서 뺀다</p>
          <ol>{items.map((t, i) => <li key={t} className={i < phase ? 'done' : ''}><span className="mono">{i < phase ? '■' : '□'}</span> {t}</li>)}</ol>
        </div>
      </main>
    );
  }

  return (
    <main className="test">
      <div className="prog">
        <div className="bar" style={{ gridTemplateColumns: `repeat(${qSteps.length}, 1fr)` }}>
          {qSteps.map((s, i) => <i key={i} className={i < qIndex || (qIndex < 0 && steps.indexOf(s) < st.step) ? 'on' : i === qIndex ? 'cur' : ''} />)}
        </div>
        <div className="meta mono">
          <span>{cur.type === 'turn' ? TURNS[cur.key].axis : cur.sec}</span>
          <span>{qIndex >= 0 ? `${String(qIndex + 1).padStart(2, '0')} / ${qSteps.length}` : '—'}</span>
        </div>
      </div>

      {resumed && (
        <div className="note-box" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <span>지난번 응답을 이어서 보여 준다.</span>
          <button className="link" type="button" onClick={() => { draft.clear(); setSt({ step: 0, profile: {}, answers: {}, sentences: { now: '', want: '' }, startedAt: Date.now() }); setResumed(false); }}>처음부터</button>
        </div>
      )}

      <div className="qcard" key={st.step}>
        {cur.type === 'profile' && (
          <>
            <div className="kind mono"><span>PROFILE</span><span>{st.step + 1}/{PROFILE.length + 1}</span></div>
            <h2>{cur.item.q}</h2>
            {cur.item.hint && <p className="hint">{cur.item.hint}</p>}
            <div className={'opts' + (cur.item.opts.length > 6 ? ' grid2' : '')}>
              {cur.item.opts.map((o, i) => (
                <button type="button" key={o} className={st.profile[cur.item.id] === o ? 'on' : ''} onClick={() => setProfile(cur.item.id, o)}>
                  <span className="mono">{String.fromCharCode(65 + i)}</span><span>{o}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {cur.type === 'target' && (
          <>
            <div className="kind mono"><span>PROFILE</span><span>{PROFILE.length + 1}/{PROFILE.length + 1} · 목표 역할</span></div>
            <h2>3–5년 안에 맡고 싶은 다음 역할은</h2>
            <p className="hint">직급이 아니라 실제 책임과 권한의 범위를 기준으로 고른다. 이 선택에 따라 AXIS 03 문항이 바뀐다.</p>
            <div className="opts">
              {ROLES.map((r, i) => (
                <button type="button" key={r.id} className={st.profile.target === r.id ? 'on' : ''} onClick={() => setProfile('target', r.id)}>
                  <span className="mono">{String.fromCharCode(65 + i)}</span>
                  <span><b>{r.name}</b><br /><small style={{ opacity: 0.75 }}>{r.trust}</small></span>
                </button>
              ))}
            </div>
          </>
        )}

        {cur.type === 'turn' && (() => {
          const t = TURNS[cur.key];
          return (
            <div className="turn">
              <Px name={t.px} />
              <p className="mono" style={{ color: 'var(--mute)' }}>{t.axis}</p>
              <blockquote>{t.quote}</blockquote>
              <cite className="mono">『우리는 결국 이름으로 일한다』 · {t.src}</cite>
              <p>{t.body}</p>
            </div>
          );
        })()}

        {cur.type === 'likert' && (
          <>
            <div className="kind mono"><span>{cur.dimName}</span><span>{KIND[cur.item.kind]}</span></div>
            <h2>{cur.item.t}</h2>
            {cur.item.hint && <p className="hint">{cur.item.hint}</p>}
            <div className={'likert' + (cur.item.scale === 'freq' ? ' freq' : '')} role="radiogroup">
              {SCALES[cur.item.scale || 'agree'].map((l, i) => (
                <button type="button" key={l} role="radio" aria-checked={st.answers[cur.item.id] === i + 1} className={st.answers[cur.item.id] === i + 1 ? 'on' : ''} onClick={() => setAns(cur.item.id, i + 1)}>
                  <span className="mono">{i + 1}</span><span>{l}</span>
                </button>
              ))}
            </div>
            <button type="button" className={'unsure' + (st.answers[cur.item.id] === 0 ? ' on' : '')} onClick={() => setAns(cur.item.id, 0)}>{cur.item.scale === 'freq' ? '세어 본 적이 없어 모르겠다' : '판단하기 어렵다'} <span className="mono">0</span></button>
          </>
        )}

        {cur.type === 'sjt' && (() => {
          const q = role.sjt[cur.i];
          return (
            <>
              <div className="kind mono"><span>{role.name}</span><span>상황 판단형 · {cur.i + 1}/3</span></div>
              <h2>{q.q}</h2>
              <p className="hint">지금 그 자리에 있다면 가장 먼저 할 일 하나를 고른다. 리포트에서 각 선택이 어떤 판단 기준에서 나왔는지 보여 준다.</p>
              <div className="opts">
                {q.o.map(([t], i) => (
                  <button type="button" key={t} className={st.answers[`s${cur.i}`] === i ? 'on' : ''} onClick={() => setAns(`s${cur.i}`, i)}>
                    <span className="mono">{String.fromCharCode(65 + i)}</span><span>{t}</span>
                  </button>
                ))}
              </div>
            </>
          );
        })()}

        {cur.type === 'scene' && (
          <>
            <div className="kind mono"><span>THINKING · {cur.i + 1}/{SCENES.length}</span><span>{KIND.scene}</span></div>
            <div className="scene" style={{ marginBottom: 18 }}><span className="mono">{cur.sc.place}</span><p style={{ fontSize: 17, lineHeight: 1.6 }}>{cur.sc.s}</p></div>
            <h2 style={{ fontSize: 19 }}>그 순간 머릿속에 가장 먼저 떠오를 생각은</h2>
            <p className="hint">옳은 답이 아니라 솔직한 첫 생각을 고른다. 고른 생각은 점수가 아니라 생각 습관으로만 쓴다.</p>
            <div className="opts">
              {cur.sc.o.map(([t], i) => (
                <button type="button" key={t} className={st.answers[cur.sc.id] === i ? 'on' : ''} onClick={() => setAns(cur.sc.id, i)}>
                  <span className="mono">{String.fromCharCode(65 + i)}</span><span>“{t}”</span>
                </button>
              ))}
            </div>
          </>
        )}

        {cur.type === 'reqs' && (
          <>
            <div className="kind mono"><span>{role.name}</span><span>요구사항 · 5문항</span></div>
            <h2>{role.short} 역할에 필요한 신뢰를 지금 얼마나 증명했는가</h2>
            <p className="hint">역량이 없는 것과, 있지만 알려지지 않은 것은 처방이 다르다. 그래서 둘을 나눠 묻는다.</p>
            <div className="reqs">
              {role.reqs.map(([t, ex], i) => (
                <div className="req" key={t}>
                  <p><span className="mono" style={{ color: 'var(--mute)', marginRight: 8 }}>R{i + 1}</span>{t}{ex && <small style={{ display: 'block', color: 'var(--mute)', fontSize: 12, marginTop: 2 }}>{ex}</small>}</p>
                  <div className="seg">
                    {REQ_STATES.map((s) => (
                      <button type="button" key={s.id} className={st.answers[`r${i}`] === s.id ? 'on' : ''} onClick={() => setAns(`r${i}`, s.id, false)}>{s.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {cur.type === 'text' && (
          <>
            <div className="kind mono"><span>NARRATIVE</span><span>서술형 · 선택</span></div>
            <h2>당신이 방을 나간 뒤, 남은 사람들은 당신을 어떤 한 문장으로 요약합니까?</h2>
            <div className="fields mt24">
              <label className="field"><span>지금 사람들이 쓰는 문장 (짐작해도 된다)</span>
                <textarea maxLength={80} placeholder="예: 일은 확실한데 같이 일하기는 좀 어려운 사람" value={st.sentences.now} onChange={(e) => setSt((s) => ({ ...s, sentences: { ...s.sentences, now: e.target.value } }))} />
              </label>
              <label className="field"><span>3년 뒤 듣고 싶은 문장</span>
                <textarea maxLength={80} placeholder="예: 조직이 흔들릴 때 판단을 맡기는 사람" value={st.sentences.want} onChange={(e) => setSt((s) => ({ ...s, sentences: { ...s.sentences, want: e.target.value } }))} />
              </label>
              <p className="mono" style={{ color: 'var(--mute)' }}>두 문장 사이의 거리가 리포트의 서사(N) 해석과 한 문장 빌더에 쓰인다.</p>
            </div>
          </>
        )}
      </div>

      <div className="navrow">
        <button type="button" className="btn ghost sm" onClick={() => go(-1)} disabled={st.step === 0}>이전</button>
        {st.step === steps.length - 1 ? (
          <button type="button" className="btn acc" onClick={submit}>결과 보기</button>
        ) : cur.type === 'turn' ? (
          <button type="button" className="btn" onClick={() => go(1)}>계속 <span className="mono">Enter</span></button>
        ) : (
          <button type="button" className="btn" onClick={() => go(1)} disabled={!canNext}>다음</button>
        )}
      </div>
      <p className="mono mt24" style={{ color: 'var(--mute)', textAlign: 'center' }}>응답은 이 기기에 자동 저장된다 · 키보드 1–5 선택, 0 = 판단하기 어렵다 · <Link to="/privacy" className="wl">개인정보</Link></p>
    </main>
  );
}

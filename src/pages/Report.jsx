import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { compute, peerAtn, roadmapTasks, PATTERNS } from '../lib/score.js';
import { unlocked } from '../lib/store.js';
import { ATN_ITEMS, REQ_STATES, DISTORTIONS } from '../data/test.js';
import { Px, Cells, Sec, Loading, Empty, fmtDate } from '../components/ui.jsx';
import { AtnTriple } from './Result.jsx';

const TOC = [['s1', 'Executive Summary'], ['s2', 'Contribution Profile'], ['s3', 'ATN Reputation Status'], ['th', 'Thinking Check'], ['s4', 'Role Reputation Fit'], ['s5', 'Evidence Review'], ['gap', '자기평가 vs 타인평가'], ['s6', 'Development Roadmap']];

export default function Report() {
  const { id } = useParams();
  const [r, setR] = useState(undefined);
  const [inv, setInv] = useState([]);
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    api.getResponse(id).then(setR);
    api.invites(id).then(setInv);
    api.adminData().then((d) => setNotes(d.notes[id] || []));
  }, [id]);

  if (r === undefined) return <main className="wrap page"><Loading /></main>;
  if (!r) return <main className="wrap page"><Empty>리포트 {id}을 찾지 못했다.</Empty></main>;
  if (!r.reportSentAt && !unlocked.has(id) && !api.adminAuthed()) return <Navigate to={`/result/${id}`} replace />;

  const c = compute(r);
  const peer = peerAtn(inv);
  const tasks = roadmapTasks(c);
  const by = c.rf.by;
  const layerOf = (d) => (c.lay.main.includes(d) ? '주요' : c.lay.sub.includes(d) ? '보조' : c.lay.dev.includes(d) ? '개발 필요' : '잠재');
  const list = (arr, empty) => (arr.length ? <ul>{arr.map((x) => <li key={x.t || x}>{x.t || x}</li>)}</ul> : <p className="none">{empty}</p>);

  return (
    <div className="wrap doc-grid">
      <aside className="doc-left tree">
        <h3>리포트</h3>
        {TOC.map(([k, t], i) => <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth' }); }}>{t}<span>{String(i + 1).padStart(2, '0')}</span></a>)}
        <h3>도구</h3>
        <Link to={`/peer/new/${id}`}>360 타인 평가</Link>
        <Link to="/sentence">한 문장 빌더</Link>
        <Link to="/roadmap">로드맵 플래너</Link>
      </aside>

      <article>
        <div className="doc-meta mono"><b>{r.id}</b><span>{r.name || '익명'}</span><span>{fmtDate(r.createdAt)}</span><span>문항 v0.3</span><span className="status">AI 분석 초안</span>{notes.length > 0 && <span className="status" data-s="검토됨">전문가 메모 {notes.length}</span>}</div>
        <h1 className="doc-title">평판진단 리포트</h1>
        <div className="doc-crumb">Reputation Diagnosis Report · {c.role.name} 목표</div>

        <Sec no="01" title="Executive Summary" small="종합 진단" id="s1">
          <div className="report-cover">
            <div>
              <p className="mono" style={{ color: 'var(--mute)' }}>지금 나의 이름에 쌓인 신뢰</p>
              <p className="quote-big acc mt8">{c.patInfo.name}. {c.patInfo.d}</p>
            </div>
            <Px name="nametag" />
          </div>
          <div className="info">
            <div className="row"><span>가치 창출</span><span>{c.lay.main.map((d) => d.name).join(', ')}{c.lay.sub.length ? `를 중심으로, ${c.lay.sub.map((d) => d.name).join(', ')}가 받친다.` : '가 가장 두드러진다.'}</span></div>
            <div className="row"><span>평판 상태</span><span>인지 {c.atn.A.score ?? '자료 부족'} · 신뢰 {c.atn.T.score ?? '자료 부족'} · 서사 {c.atn.N.score ?? '자료 부족'}. {c.patInfo.d}</span></div>
            <div className="row"><span>목표 역할</span><span>{c.role.name} — <b>{c.rf.fit}</b>. {c.rf.fitD}</span></div>
            <div className="row"><span>생각 습관</span><span>{c.th.top.length ? `${c.th.top.map((d) => `${d.name}(${d.n})`).join(', ')}. ${c.th.top[0].book ? `책의 표현으로는 “${c.th.top[0].book}”에 가깝다.` : ''}` : '장면에서 균형 잡힌 생각을 골랐다.'}</span></div>
            <div className="row"><span>더 만들 신뢰</span><span>{c.patInfo.rx}</span></div>
          </div>
          <p className="disclaimer">이 리포트는 총점을 내지 않는다. 세 축은 서로 다른 질문에 답하므로 나란히 놓고 읽는다.</p>
        </Sec>

        <Sec no="02" title="Contribution Profile" small="6차원 · 4층위" id="s2">
          <div className="scroll-x"><table className="tbl dimtbl">
            <thead><tr><th>차원</th><th>층위</th><th>분포</th><th className="right">자기 인식 / 경험</th></tr></thead>
            <tbody>
              {c.dims.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.name}</b><br /><small style={{ color: 'var(--mute)' }}>{d.trait}</small></td>
                  <td><span className="lay" data-l={layerOf(d)}>{layerOf(d)}</span></td>
                  <td><Cells v={d.score} acc={layerOf(d) === '개발 필요'} /><span className="mono" style={{ color: 'var(--mute)' }}>{d.score ?? '—'}</span></td>
                  <td className="right mono">{d.selfVsAct[0] || '–'} / {d.selfVsAct[1] || '–'}{d.split && ' ≠'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="mt16" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            여섯 차원은 같은 종류가 아니다. 전문성·실행·책임은 가치의 원천, 관계는 상호작용 방식, 관점은 차별적 기여, 가치 전달은 앞의 기여를 밖으로 전하는 능력이다. 한 유형으로 규정하지 않는다.
            {c.splits.length > 0 && ` ${c.splits.map((d) => d.name).join(', ')}는 자기 인식과 실제 경험 응답이 3점 이상 벌어졌다. 이 차원은 인터뷰로 확인한다.`}
          </p>
        </Sec>

        <Sec no="03" title="ATN Reputation Status" small="인지 · 신뢰 · 서사" id="s3">
          <AtnTriple atn={c.atn} peer={peer} />
          <div className="scroll-x mt24"><table className="tbl">
            <thead><tr><th>불균형</th><th>해석</th><th>해당</th></tr></thead>
            <tbody>
              {['aware_untrusted', 'hidden_trusted', 'trusted_unexplained', 'story_unverified'].map((k) => (
                <tr key={k} style={k === c.pat ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)' } : undefined}>
                  <td className="nowrap"><b>{PATTERNS[k].name}</b></td><td>{PATTERNS[k].d}</td><td className="mono">{k === c.pat ? '■' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="two mt24">
            <div className="note-box"><h3>지금 사람들이 쓰는 문장 (본인 추정)</h3><p className="quote-big">{r.sentences?.now || '—'}</p></div>
            <div className="note-box"><h3>3년 뒤 듣고 싶은 문장</h3><p className="quote-big acc">{r.sentences?.want || '—'}</p></div>
          </div>
          {peer && <div className="note-box mt8"><h3>타인이 쓴 문장 ({peer.n}명)</h3><ul className="plain check">{inv.filter((p) => p.sentence).map((p) => <li key={p.token}>{p.sentence} <small className="mono" style={{ color: 'var(--mute)' }}>{p.relation}</small></li>)}</ul></div>}
        </Sec>

        <Sec no="04" title="Thinking Check" small={`생각의 함정 · 균형 ${c.th.ok}/${c.th.total}`} id="th">
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 14 }}>평판을 막는 것은 능력보다 생각의 습관인 경우가 많다. 아래는 장면마다 가장 먼저 떠오른다고 고른 생각이다. 인지행동치료(CBT)의 인지 왜곡 개념을 빌린 자기 점검이며, 임상적 진단이 아니다.</p>
          {c.th.top.length > 0 && (
            <div className="scroll-x"><table className="tbl dimtbl">
              <thead><tr><th>함정</th><th>횟수</th><th>다시 묻기</th></tr></thead>
              <tbody>{c.th.top.map((d) => <tr key={d.id}><td className="nowrap"><b>{d.name}</b><br /><small className="mono" style={{ color: 'var(--mute)' }}>{d.en}</small></td><td><Cells v={(d.n / c.th.total) * 100} n={c.th.total} acc /></td><td style={{ fontSize: 13 }}>{d.q}</td></tr>)}</tbody>
            </table></div>
          )}
          <div className="mt16">
            {c.th.picks.map((p) => (
              <div className="scene" key={p.scene.id}>
                <span className="mono">{p.scene.place} · {p.tag === 'ok' ? '균형 잡힌 생각' : p.info.name}</span>
                <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>{p.scene.s}</p>
                <p className="mt8" style={{ fontWeight: 700 }}>“{p.text}”</p>
                {p.tag !== 'ok' && (
                  <div className="info" style={{ marginTop: 8 }}>
                    <div className="row"><span>다시 묻기</span><span>{p.info.q}</span></div>
                    <div className="row"><span>대신 할 생각</span><span>{p.scene.o.find((o) => o[1] === 'ok')[0]}</span></div>
                    <div className="row"><span>행동 실험</span><span>{p.info.exp}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Sec>

        <Sec no="05" title="Role Reputation Fit" small={`${c.role.name} · ${c.rf.fit}`} id="s4">
          <div className="scene"><span className="mono">핵심 신뢰 질문</span><p className="quote-big">{c.role.trust}</p></div>
          <div className="eight mt16">
            <div><h4><span className="mono">1</span>현재 역할과 책임 범위</h4><p>{r.profile.current} · {r.profile.years} · {r.profile.industry}</p></div>
            <div><h4><span className="mono">2</span>희망하는 다음 역할</h4><p>{c.role.name}</p></div>
            <div><h4><span className="mono">3</span>목표 역할에 필요한 핵심 신뢰</h4><p>{c.role.needs.map((n) => c.dims.find((d) => d.id === n).name).join(', ')}</p></div>
            <div><h4><span className="mono">4</span>이미 입증된 역량과 행동 증거</h4>{list(by.proven, '아직 없음')}</div>
            <div><h4><span className="mono">5</span>역량은 있지만 알려지지 않은 영역</h4>{list(by.hidden, '해당 없음')}</div>
            <div><h4><span className="mono">6</span>아직 입증하지 못한 요구사항</h4>{list(by.none, '해당 없음')}</div>
            <div><h4><span className="mono">7</span>판단 자료가 부족한 영역</h4>{list(by.unknown, '해당 없음')}</div>
            <div><h4><span className="mono">8</span>앞으로 쌓을 경험과 평판 행동</h4>{list(tasks.filter((t) => t.term >= 6).slice(0, 3).map((t) => t.task), '—')}</div>
          </div>
          <p className="mt16" style={{ fontSize: 14, color: 'var(--ink-2)' }}>상황 판단 {c.rf.sjt}/{c.rf.sjtMax}. {c.rf.sjt >= 7 ? '이 역할이 요구하는 판단 순서와 대체로 같다.' : c.rf.sjt >= 4 ? '일부 상황에서 지금 역할의 판단 순서가 먼저 나온다.' : '지금 역할의 판단 기준이 강하게 남아 있다. 목표 역할의 책임 범위로 질문을 바꿔 볼 필요가 있다.'}</p>
          <div className="scroll-x mt16"><table className="tbl">
            <thead><tr><th>상황</th><th>내가 쓴 판단 기준</th><th>이 역할에서 기대하는 기준</th></tr></thead>
            <tbody>{c.rf.picks.map((p) => (
              <tr key={p.q}><td style={{ fontSize: 13 }}>{p.q}</td>
                <td className="nowrap">{p.pick ? <span className="st" data-s={p.pick[1] === 3 ? 'proven' : p.pick[1] >= 2 ? 'none' : 'unknown'}>{p.pick[2]}</span> : '—'}</td>
                <td className="nowrap"><span className="st" data-s="proven">{p.best[2]}</span></td></tr>
            ))}</tbody>
          </table></div>
        </Sec>

        <Sec no="06" title="Evidence Review" small="역량 부족 · 인식 부족 · 증거 부족 · 자료 부족" id="s5">
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>요구사항</th><th>상태</th><th>처방</th></tr></thead>
            <tbody>
              {c.rf.reqs.map((q) => {
                const s = REQ_STATES.find((x) => x.id === q.state);
                const rx = { proven: '유지. 이 사례를 문장의 근거로 쓴다', hidden: '알린다. 사례를 결과와 함께 기록한다', none: '만든다. 지금 역할 안에서 작게 시작한다', unknown: '확인한다. 360과 인터뷰로 판단한다' }[q.state];
                return <tr key={q.t}><td>{q.t}{q.ex && <small style={{ display: 'block', color: 'var(--mute)', fontSize: 12 }}>{q.ex}</small>}</td><td><span className="st" data-s={q.state}>{s.short}</span></td><td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{rx}</td></tr>;
              })}
            </tbody>
          </table></div>
          <p className="mt16" style={{ fontSize: 14, color: 'var(--ink-2)' }}>역량이 부족한 것과, 역량이 있지만 인정받지 못하는 것은 다른 문제다. 이 구분이 처방을 가른다. ‘판단하기 어렵다’로 답한 {c.unknownTotal}개 항목은 낮은 점수가 아니라 판단 유보로 남긴다.</p>
        </Sec>

        <Sec no="07" title="자기평가 vs 타인평가" small={peer ? `${peer.n}명 응답` : '360 미실시'} id="gap">
          {peer ? (
            <>
              <div className="scroll-x"><table className="tbl">
                <thead><tr><th>문항</th><th className="right">나</th><th className="right">타인</th><th className="right">차이</th></tr></thead>
                <tbody>
                  {ATN_ITEMS.map((it) => ({ it, s: r.answers[it.id] || 0, p: peer.items[it.id] || 0 }))
                    .filter((x) => x.s && x.p)
                    .sort((a, b) => Math.abs(b.p - b.s) - Math.abs(a.p - a.s))
                    .map(({ it, s, p }) => (
                      <tr key={it.id}><td><span className="mono" style={{ color: 'var(--mute)' }}>{it.dim} </span>{it.t}</td><td className="right mono">{s}</td><td className="right mono">{p.toFixed(1)}</td><td className="right mono" style={Math.abs(p - s) >= 1 ? { fontWeight: 700 } : undefined}>{p - s > 0 ? '+' : ''}{(p - s).toFixed(1)}</td></tr>
                    ))}
                </tbody>
              </table></div>
              {r.prediction && (
                <div className="note-box mt16"><h3>독심술 점검 · 내가 예측한 타인 점수 vs 실제</h3>
                  <p className="mono" style={{ fontSize: 13 }}>{['A', 'T', 'N'].map((k) => `${k} 예측 ${r.prediction[k]} → 실제 ${peer.atn[k].score ?? '–'}`).join('   ')}</p>
                  <p className="mt8" style={{ fontSize: 13 }}>{(() => { const diffs = ['A', 'T', 'N'].map((k) => (peer.atn[k].score ?? 0) - r.prediction[k]); const m = Math.max(...diffs.map(Math.abs)); return m >= 15 ? (diffs.some((d) => d >= 15) ? '남의 평가를 실제보다 낮게 짐작한 영역이 있다. “다들 나를 그렇게 볼 것”이라는 짐작이 행동을 막고 있었을 수 있다.' : '남이 알아줄 것이라 짐작한 만큼 실제로 알려져 있지는 않다. “다 알 것”이라는 짐작을 확인으로 바꿀 때다.') : '예측과 실제가 크게 다르지 않다. 주변의 시선을 비교적 정확히 읽고 있다.'; })()}</p>
                </div>
              )}
              <p className="mt16" style={{ fontSize: 14, color: 'var(--ink-2)' }}>+는 남이 더 높게 본 영역이다. 대개 알리지 않아도 이미 쓰이고 있는 신뢰다. −는 본인만 높게 본 영역으로, 증거를 먼저 만들 곳이다.</p>
            </>
          ) : (
            <div className="sent" style={{ gridTemplateColumns: '96px 1fr' }}>
              <Px name="scale" w={96} />
              <div><p>본인이 생각하는 평판과 다른 사람이 실제로 인식하는 평판은 다를 수 있다. 동료 3명 이상이 답하면 이 칸이 채워진다.</p><Link className="btn sm mt8" to={`/peer/new/${id}`}>타인 평가 요청하기</Link></div>
            </div>
          )}
        </Sec>

        <Sec no="08" title="Reputation Development Roadmap" small="3 · 6 · 12개월" id="s6">
          {[3, 6, 12].map((m) => (
            <div key={m} className="mt16">
              <p className="mono" style={{ color: 'var(--mute)', marginBottom: 6 }}>{m}개월</p>
              <ul className="causes">{tasks.filter((t) => t.term === m).map((t, i) => <li key={t.id}><span className="mono">{i + 1}</span><span>{t.task} <small style={{ color: 'var(--mute)' }}>· {t.why}</small></span></li>)}</ul>
            </div>
          ))}
          <div className="btns mt16 noprint"><Link className="btn sm" to="/roadmap">플래너로 옮기기</Link></div>
        </Sec>

        <div className="expert mt40">
          <b>AI 분석과 전문가 판단을 구분한다.</b> 이 리포트는 응답을 기준표에 따라 분류한 초안이다. 표현 방식만으로 리더십이나 윤리성을 추론하지 않으며, 승진이나 선발 같은 중요한 결정에 이 결과만 쓰지 않는다.
          {notes.length > 0 && <div className="mt8">{notes.map((n) => <p key={n.at} className="mt8"><span className="mono">{fmtDate(n.at)} 전문가 메모</span><br />{n.text}</p>)}</div>}
        </div>
        <div className="btns mt24 noprint">
          <button className="btn" type="button" onClick={() => window.print()}>PDF로 저장</button>
          <Link className="btn acc" to={`/consult?rid=${id}`}>이 리포트로 30분 상담 신청</Link>
        </div>
      </article>

      <aside className="doc-right">
        <nav className="panel toc"><h3><span>목차</span></h3>{TOC.map(([k, t], i) => <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth' }); }}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{t}</a>)}</nav>
        <div className="panel"><h3><span>360 타인 평가</span><span className="mono">{inv.filter((i) => i.doneAt).length}/{inv.length}</span></h3>
          {inv.length ? <ul>{inv.map((i) => <li key={i.token}><span className="mono">{i.doneAt ? '완료' : '대기'}</span>{i.name} · {i.relation}</li>)}</ul> : <p style={{ fontSize: 13, color: 'var(--mute)' }}>아직 요청하지 않았다.</p>}
          <Link className="wl" to={`/peer/new/${id}`} style={{ fontSize: 13 }}>요청 관리</Link>
        </div>
        <div className="panel"><h3><span>다음</span></h3>
          <ul><li><span className="mono">무료</span><Link className="wl" to={`/consult?rid=${id}`}>30분 해석 상담</Link></li><li><span className="mono">유료</span><Link className="wl" to="/services">심층 진단 프로그램</Link></li></ul>
        </div>
      </aside>
    </div>
  );
}

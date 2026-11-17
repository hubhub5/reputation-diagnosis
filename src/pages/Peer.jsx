import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { TRIAL } from '../lib/trial.js';
import { lastId } from '../lib/store.js';
import { roleById } from '../lib/score.js';
import { ATN_ITEMS, LIKERT } from '../data/test.js';
import { Px, Sec, Loading, Empty, useToast, copy, fmtDate } from '../components/ui.jsx';

const REL = ['상사', '동료', '후배', '고객', '외부 파트너', '전 직장 동료'];
const link = (tok) => `${location.origin}${location.pathname}#/p/${tok}`;

export function PeerHub() {
  const id = lastId.get();
  return (
    <main className="wrap page narrow" style={{ margin: '0 auto' }}>
      <div className="page-head">
        <p className="kicker mono"><span>360 · PEER REVIEW</span><span>타인 1명당 약 4분</span></p>
        <h1>평판은 내가 아니라 남이 증명한다</h1>
        <p>자기소개보다 강한 것은 타인의 경험이다. 같은 12문항을 동료에게 보내고, 내가 본 나와 남이 본 나를 나란히 놓는다.</p>
      </div>
      <div className="verdict" style={{ marginTop: 0 }}>
        <Px name="scale" />
        <div>
          <h3>이렇게 진행한다</h3>
          <ol className="flow mt16">
            <li><span>요청</span><p>진단을 마친 뒤 3–5명의 이름과 관계를 적는다</p></li>
            <li><span>링크</span><p>사람마다 다른 링크가 만들어진다. 메신저나 메일로 보낸다</p></li>
            <li><span>응답</span><p>상대는 가입 없이 4분 동안 답한다. 누가 어떻게 답했는지는 보이지 않는다</p></li>
            <li className="break"><span>비교</span><p>3명 이상 모이면 리포트에 차이 표가 열린다</p></li>
          </ol>
        </div>
      </div>
      <div className="btns mt24">
        {id ? <Link className="btn" to={`/peer/new/${id}`}>{id} 진단으로 요청하기</Link> : <Link className="btn" to="/test">먼저 진단하기</Link>}
        {!TRIAL && <Link className="btn ghost" to="/me">내 진단함에서 고르기</Link>}
      </div>
      <p className="disclaimer">응답자를 식별할 수 있는 정보는 요청자에게 보여 주지 않는다. 평균은 3명 이상일 때만 보인다(데모에서는 1명부터 표시).</p>
    </main>
  );
}

export function PeerInvite() {
  const { id } = useParams();
  const [r, setR] = useState(undefined);
  const [list, setList] = useState([]);
  const [rows, setRows] = useState([{ name: '', relation: '동료', email: '' }, { name: '', relation: '상사', email: '' }, { name: '', relation: '후배', email: '' }]);
  const [busy, setBusy] = useState(false);
  const [pred, setPred] = useState({ A: 50, T: 50, N: 50 });
  const [toast, say] = useToast();
  const load = () => api.invites(id).then(setList);
  useEffect(() => { api.getResponse(id).then((x) => { setR(x); if (x?.prediction) setPred(x.prediction); }); load(); }, [id]);

  if (r === undefined) return <main className="wrap page"><Loading /></main>;
  if (!r) return <main className="wrap page"><Empty>진단 {id}을 찾지 못했다.</Empty></main>;

  const set = (i, k, v) => setRows(rows.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const valid = rows.filter((x) => x.name.trim());
  async function create() {
    setBusy(true);
    await api.createInvites(id, valid);
    setRows([{ name: '', relation: '동료', email: '' }]);
    await load(); setBusy(false); say(`링크 ${valid.length}개를 만들었다`);
  }
  const done = list.filter((x) => x.doneAt).length;

  return (
    <main className="wrap page narrow" style={{ margin: '0 auto' }}>
      <div className="doc-meta mono"><b>{id}</b><span>{r.name || '익명'}</span><span>목표 {roleById(r.profile.target).short}</span><span className="status">360</span></div>
      <h1 className="doc-title">타인 평가 요청</h1>
      <p className="doc-line">내가 비워 둔 자리에도 문장은 들어온다. 그 문장을 직접 들어 본다.</p>

      <Sec no="00" title="보내기 전에, 먼저 예측한다" small="독심술 점검">
        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12 }}>“다 알고 있을 것이다”, “다들 나를 이렇게 볼 것이다”는 확인하지 않은 짐작이다. 동료들이 줄 점수를 먼저 적어 두면, 결과가 왔을 때 내 짐작이 어느 쪽으로 기울어 있었는지 보인다.</p>
        <div className="info" style={{ marginTop: 0 }}>
          {[['A', '인지 · 그 분야 문제가 생기면 나를 먼저 찾는다'], ['T', '신뢰 · 지금 범위를 넘는 일을 맡겨도 된다'], ['N', '서사 · 나를 한 문장으로 설명할 수 있다']].map(([k, t]) => (
            <div className="row" key={k}><span>{k} 예측</span><span style={{ display: 'grid', gridTemplateColumns: '1fr 120px 44px', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 13 }}>{t}</span><input type="range" min="0" max="100" step="5" value={pred[k]} onChange={(e) => setPred({ ...pred, [k]: +e.target.value })} disabled={!!r.prediction} /><b className="mono" style={{ fontSize: 13 }}>{pred[k]}</b></span></div>
          ))}
        </div>
        {r.prediction ? <p className="mono mt8" style={{ color: 'var(--mute)' }}>예측 저장됨 · 결과가 모이면 리포트에서 비교한다</p>
          : <button type="button" className="btn sm mt8" onClick={async () => { const p = await api.savePrediction(id, pred); setR({ ...r, prediction: p }); say('예측을 저장했다. 이제 바꿀 수 없다'); }}>예측 저장</button>}
      </Sec>

      <Sec no="01" title="요청할 사람" small="3–5명 권장 · 관계를 섞는다">
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>이름 (내가 알아볼 수 있게)</th><th>관계</th><th>이메일 (선택, 적으면 대신 보낸다)</th><th /></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i}>
                <td><input className="inp" value={x.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="예: 박 팀장" /></td>
                <td><select className="inp" value={x.relation} onChange={(e) => set(i, 'relation', e.target.value)}>{REL.map((o) => <option key={o}>{o}</option>)}</select></td>
                <td><input className="inp" type="email" value={x.email} onChange={(e) => set(i, 'email', e.target.value)} placeholder="name@company.com" /></td>
                <td><button type="button" className="mono" style={{ color: 'var(--mute)' }} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="삭제">×</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="btns mt16">
          <button className="btn ghost sm" type="button" onClick={() => setRows([...rows, { name: '', relation: '동료', email: '' }])} disabled={rows.length + list.length >= 8}>한 명 더</button>
          <button className="btn sm" type="button" onClick={create} disabled={!valid.length || busy}>{busy ? '만드는 중' : `링크 ${valid.length}개 만들기`}</button>
        </div>
      </Sec>

      <Sec no="02" title="보낸 요청" small={`${done}/${list.length} 응답`}>
        {list.length === 0 ? <Empty px="envelope">아직 만든 링크가 없다.</Empty> : (
          <div className="scroll-x"><table className="tbl">
            <thead><tr><th>이름</th><th>관계</th><th>상태</th><th>링크</th></tr></thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.token}>
                  <td>{x.name}</td><td>{x.relation}</td>
                  <td>{x.doneAt ? <span className="st" data-s="proven">응답 {fmtDate(x.doneAt).slice(5)}</span> : <span className="st" data-s="unknown">대기</span>}</td>
                  <td className="nowrap">
                    <button type="button" className="btn sm ghost" onClick={() => { copy(link(x.token)); say('링크를 복사했다'); }}>복사</button>{' '}
                    <Link className="wl mono" to={`/p/${x.token}`} target="_blank">열기</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <div className="btns mt16">
          <Link className="btn sm" to={`/report/${id}#gap`}>리포트에서 차이 보기</Link>
          {list.some((x) => !x.doneAt) && <button type="button" className="btn sm ghost" onClick={async () => { await api.demoFillInvites(id); await load(); say('데모 응답을 채웠다'); }}>데모: 대기 중 응답 채우기</button>}
        </div>
      </Sec>

      <Sec no="03" title="보낼 때 쓰는 문장" small="그대로 복사해도 된다">
        <div className="scene">
          <span className="mono">메시지 예시</span>
          <p>요즘 제 일을 돌아보는 중인데, 저와 일해 본 분의 시선이 필요해서 부탁드립니다. 4분 정도 걸리고 누가 어떻게 답했는지는 저에게 보이지 않습니다. 편하게 답해 주시면 큰 도움이 됩니다.</p>
          <button type="button" className="btn sm ghost mt8" onClick={() => { copy('요즘 제 일을 돌아보는 중인데, 저와 일해 본 분의 시선이 필요해서 부탁드립니다. 4분 정도 걸리고 누가 어떻게 답했는지는 저에게 보이지 않습니다. 편하게 답해 주시면 큰 도움이 됩니다.'); say('문장을 복사했다'); }}>문장 복사</button>
        </div>
      </Sec>
      {toast}
    </main>
  );
}

export function PeerRespond() {
  const { token } = useParams();
  const [inv, setInv] = useState(undefined);
  const [ans, setAns] = useState({});
  const [sentence, setSentence] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { api.getInvite(token).then(setInv); }, [token]);

  if (inv === undefined) return <main className="test"><Loading /></main>;
  if (!inv) return <main className="test"><Empty>링크가 만료됐거나 잘못됐다.</Empty></main>;
  if (done || inv.doneAt) return (
    <main className="test">
      <div className="wait"><Px name="envelope" /><h2 style={{ fontSize: 22 }}>응답을 보냈다</h2><p style={{ color: 'var(--ink-2)' }}>{inv.owner}님에게는 3명 이상의 평균만 보인다.<br />나에 관한 문장도 궁금하다면 직접 진단해 볼 수 있다.</p><Link className="btn" to="/">평판진단 해 보기</Link></div>
    </main>
  );

  const n = Object.keys(ans).length;
  return (
    <main className="test">
      <p className="kicker mono"><span>360 · {inv.relation}로서 응답</span><span>12문항 + 한 문장 · 약 4분</span></p>
      <h1 style={{ fontSize: 26 }}>{inv.owner}님이 당신의 시선을 부탁했다</h1>
      <p className="mt8" style={{ color: 'var(--ink-2)' }}>함께 일하며 직접 본 장면을 기준으로 답한다. 잘 모르는 항목은 ‘모름’을 고른다. 응답은 익명으로 합산된다.</p>
      <div className="prog mt24"><div className="bar" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>{Array.from({ length: 13 }, (_, i) => <i key={i} className={i < n + (sentence ? 1 : 0) ? 'on' : ''} />)}</div></div>
      {ATN_ITEMS.map((it, k) => (
        <div key={it.id} className="req">
          <p><span className="mono" style={{ color: 'var(--mute)', marginRight: 8 }}>{String(k + 1).padStart(2, '0')}</span>{it.p}</p>
          <div className="seg six">
            {[...LIKERT, '모름'].map((l, i) => {
              const v = i === 5 ? 0 : i + 1;
              return <button type="button" key={l} className={ans[it.id] === v ? 'on' : ''} onClick={() => setAns({ ...ans, [it.id]: v })}>{l}</button>;
            })}
          </div>
        </div>
      ))}
      <label className="field mt24"><span>이 사람을 다른 사람에게 한 문장으로 소개한다면</span><textarea maxLength={80} value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="예: 일이 꼬였을 때 먼저 전화하게 되는 사람" /></label>
      <div className="navrow">
        <span className="mono" style={{ color: 'var(--mute)' }}>{n}/12</span>
        <button className="btn" type="button" disabled={n < 12 || busy} onClick={async () => { setBusy(true); await api.submitInvite(token, ans, sentence); setDone(true); }}>{busy ? '보내는 중' : '응답 보내기'}</button>
      </div>
    </main>
  );
}

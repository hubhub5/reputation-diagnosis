import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { lastId } from '../lib/store.js';
import { compute } from '../lib/score.js';
import { Px, Sec, useToast, copy, fmtDate } from '../components/ui.jsx';

const WHO = ['경영진이', 'CEO가', '고객사가', '현업 팀이', '이사회가', '투자자가', '협력사가'];
const PROBLEM = {
  E: ['규제·계약 해석이 엇갈릴 때', '데이터가 서로 다른 말을 할 때', '전문 판단 없이 결정이 미뤄질 때'],
  X: ['일정이 두 달 이상 밀린 프로젝트를 넘겨받을 때', '목표만 있고 실행 계획이 없을 때', '마감 일주일 전 핵심 인력이 빠졌을 때'],
  R: ['두 본부가 서로 탓하며 일이 멈췄을 때', '합병 뒤 두 조직 문화가 부딪칠 때', '협력사와 관계가 틀어졌을 때'],
  C: ['사고가 터져 누가 앞에 설지 정해야 할 때', '실적과 원칙이 부딪칠 때', '약속한 품질을 지키기 어려울 때'],
  I: ['3년째 성장이 멈춘 사업을 다시 봐야 할 때', '익숙한 방식이 통하지 않을 때', '새 기술로 일하는 방식을 바꿔야 할 때'],
  V: ['위기 상황을 밖에 설명해야 할 때', '복잡한 전략을 현장에 전해야 할 때', '이사회를 설득해야 할 때'],
};
const ACTION = {
  E: ['판단 기준부터 세워 답을 내는', '근거를 한 장으로 정리해 결정을 돕는'],
  X: ['남은 일을 다시 쪼개 끝까지 끌고 가는', '우선순위를 다시 세워 사람을 움직이는'],
  R: ['양쪽을 따로 만나 물러설 선을 찾는', '사람을 묶어 다시 일하게 하는'],
  C: ['먼저 앞에 서서 책임지고 수습하는', '손해를 감수하고 기준을 지키는'],
  I: ['숫자로 다시 따져 다른 길을 찾는', '방향을 제안하고 실제로 바꿔 내는'],
  V: ['첫 문장을 써서 상황을 정리하는', '복잡한 일을 쉬운 말로 바꾸는'],
};
const TITLES = /(팀장|부장|상무|전무|이사|대표|과장|차장|본부장|회사|그룹)/;
const ADJ = /(좋은|성실한|열정|최고|훌륭|착한|열심)/;
const TRAPS = [
  [/원래|타고난|체질|성격상/, '낙인찍기'],
  [/항상|늘|절대|다들|아무도|모두|매번/, '과잉일반화'],
  [/운이|운 좋게|덕분에|그냥|별거|겨우/, '긍정 격하'],
  [/해야|알아줘야|마땅히/, '당위적 사고'],
];

export default function Sentence() {
  const rid = lastId.get();
  const key = rid || 'guest';
  const [r, setR] = useState(null);
  const [s, setS] = useState({ who: '', problem: '', action: '' });
  const [free, setFree] = useState('');
  const [mode, setMode] = useState('slot');
  const [versions, setVersions] = useState([]);
  const [ev, setEv] = useState({ pro: '', con: '', alt: '' });
  const [evSaved, setEvSaved] = useState(false);
  const [toast, say] = useToast();
  useEffect(() => {
    if (rid) api.getResponse(rid).then(setR);
    api.sentences(key).then(setVersions);
    api.sentences(key + ':ev').then((x) => { if (x && x[0]) setEv(x[0]); });
  }, [rid, key]);

  const c = r ? compute(r) : null;
  const dims = c ? [...c.lay.main, ...c.lay.sub].map((d) => d.id) : ['E', 'X', 'C'];
  const probs = [...new Set(dims.flatMap((d) => PROBLEM[d]))];
  const acts = [...new Set(dims.flatMap((d) => ACTION[d]))];
  const text = mode === 'slot' ? `${s.who || '○○이'} ${s.problem || '어떤 문제가 생겼을 때'} ${s.action || '무엇을 하는'} 사람` : free;

  const checks = [
    ['특정한 문제가 들어 있다', mode === 'slot' ? !!s.problem : /때|면|에서/.test(free)],
    ['행동으로 끝난다 (형용사가 아니라)', mode === 'slot' ? !!s.action : /는 사람$|하는/.test(free.trim())],
    ['직함과 회사 이름 없이도 성립한다', !TITLES.test(text)],
    ['칭찬하는 말이 아니라 쓰임새를 말한다', !ADJ.test(text)],
    ['40자 이하로 남이 옮겨 말할 수 있다', text.replace(/\s/g, '').length <= 40],
  ];
  const hits = TRAPS.filter(([re]) => re.test(text)).map(([, n]) => n);
  checks.push([hits.length ? `단정·자기 깎기 표현: ${hits.join(', ')}` : '단정하거나 나를 깎는 표현이 없다', !hits.length]);
  const ok = checks.filter((x) => x[1]).length;

  async function saveV() {
    const v = [{ text, at: new Date().toISOString(), score: ok }, ...versions].slice(0, 3);
    setVersions(await api.saveSentences(key, v));
    say('저장했다');
  }

  return (
    <main className="wrap page">
      <div className="page-head">
        <p className="kicker mono"><span>NARRATIVE · 한 문장 빌더</span>{rid && <span>{rid} 결과 연결</span>}</p>
        <h1>한 문장으로 기억되는 사람이 선택된다</h1>
        <p>복잡한 경력을 하나의 의미로 줄인다. 내가 쓰고 싶은 문장이 아니라 남이 옮겨 말할 수 있는 문장을 만든다.</p>
      </div>
      <div className="split">
        <div>
          <div className="tabs">
            <button type="button" className={mode === 'slot' ? 'on' : ''} onClick={() => setMode('slot')}>틀에 넣기</button>
            <button type="button" className={mode === 'free' ? 'on' : ''} onClick={() => setMode('free')}>직접 쓰기</button>
          </div>
          <div className="builder">
            <p className="mono" style={{ color: 'var(--mute)', marginBottom: 10 }}>“그 문제라면 이 사람을 만나야 합니다.”</p>
            {mode === 'slot' ? (
              <p className="out">
                <span className={s.who ? '' : 'empty'}>{s.who || '누가'}</span>{' '}
                <span className={s.problem ? '' : 'empty'}>{s.problem || '어떤 문제에 부딪혔을 때'}</span>{' '}
                <span className={s.action ? '' : 'empty'}>{s.action || '무엇을 하는'}</span> 사람
              </p>
            ) : (
              <textarea className="out" style={{ width: '100%', border: 0, background: 'transparent', color: 'var(--ink)', font: 'inherit', fontWeight: 800, fontSize: 24, letterSpacing: 'var(--track)', resize: 'vertical', outline: 'none' }} value={free} onChange={(e) => setFree(e.target.value)} placeholder="예: 위기가 터졌을 때 첫 문장을 쓰는 사람" />
            )}
          </div>
          {mode === 'slot' && (
            <div className="fields mt16">
              <div className="field"><span>누가 (나를 찾는 쪽)</span><input value={s.who} onChange={(e) => setS({ ...s, who: e.target.value })} /><div className="chips">{WHO.map((w) => <button type="button" key={w} onClick={() => setS({ ...s, who: w })}>{w}</button>)}</div></div>
              <div className="field"><span>어떤 문제에서 {c && <em style={{ fontStyle: 'normal' }}>· 주요 기여 {c.lay.main.map((d) => d.name).join(', ')} 기준 제안</em>}</span><input value={s.problem} onChange={(e) => setS({ ...s, problem: e.target.value })} /><div className="chips">{probs.map((w) => <button type="button" key={w} onClick={() => setS({ ...s, problem: w })}>{w}</button>)}</div></div>
              <div className="field"><span>무엇을 하는</span><input value={s.action} onChange={(e) => setS({ ...s, action: e.target.value })} /><div className="chips">{acts.map((w) => <button type="button" key={w} onClick={() => setS({ ...s, action: w })}>{w}</button>)}</div></div>
            </div>
          )}
          <div className="btns mt16">
            <button type="button" className="btn" onClick={saveV}>버전 저장 <span className="mono">{versions.length}/3</span></button>
            <button type="button" className="btn ghost" onClick={() => { copy(`요즘 저를 한 문장으로 정리해 보는 중입니다. "${text}" 이 문장이 저와 맞는지, 다르다면 어떻게 바꾸면 좋을지 한 줄만 답해 주세요.`); say('확인 요청 메시지를 복사했다'); }}>동료에게 확인받기</button>
          </div>
        </div>

        <div>
          <Sec no="CHECK" title="옮겨 말할 수 있는 문장인가" small={`${ok}/${checks.length}`}>
            <ul className="checks">{checks.map(([t, v]) => <li key={t} className={v ? 'ok' : 'no'}><span className="mono">{v ? '■' : '□'}</span><span>{t}</span></li>)}</ul>
          </Sec>
          {r && (
            <Sec no="FROM" title="진단에서 가져온 문장">
              <div className="info" style={{ marginTop: 0 }}>
                <div className="row"><span>지금 문장</span><span>{r.sentences?.now || '—'}</span></div>
                <div className="row"><span>듣고 싶은 문장</span><span>{r.sentences?.want || '—'}</span></div>
                <div className="row"><span>서사 N</span><span>{c.atn.N.score ?? '자료 부족'} · {c.patInfo.name}</span></div>
              </div>
            </Sec>
          )}
          <Sec no="EVIDENCE" title="지금 문장, 사실인지 따져 보기" small="생각 기록">
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 10 }}>사람들이 나를 “{r?.sentences?.now || '어떤 문장'}”으로 말한다고 적었다면, 그 문장은 사실인가 짐작인가. 증거를 양쪽으로 적고 더 정확한 문장으로 고친다.</p>
            <div className="fields">
              <label className="field"><span>그 문장을 뒷받침하는 실제 장면</span><textarea value={ev.pro} onChange={(e) => { setEv({ ...ev, pro: e.target.value }); setEvSaved(false); }} placeholder="예: 작년 3분기 회의에서 후배 보고를 중간에 끊었다" /></label>
              <label className="field"><span>그 문장과 맞지 않는 실제 장면</span><textarea value={ev.con} onChange={(e) => { setEv({ ...ev, con: e.target.value }); setEvSaved(false); }} placeholder="예: 같은 후배가 다음 프로젝트에 나를 다시 불렀다" /></label>
              <label className="field"><span>두 장면을 다 담은 더 정확한 문장</span><textarea value={ev.alt} onChange={(e) => { setEv({ ...ev, alt: e.target.value }); setEvSaved(false); }} placeholder="예: 기준이 엄격해 처음엔 부딪히지만, 결과가 필요할 때 다시 찾는 사람" /></label>
              <button type="button" className="btn sm ghost" onClick={async () => { await api.saveSentences(key + ':ev', [ev]); setEvSaved(true); say('생각 기록을 저장했다'); }}>{evSaved ? '저장됨' : '생각 기록 저장'}</button>
            </div>
          </Sec>
          <Sec no="SAVED" title="저장한 버전">
            {versions.length ? (
              <ul className="versions">{versions.map((v, i) => <li key={v.at}><span className="mono">V{versions.length - i}</span><span>{v.text}</span><span className="mono" style={{ color: 'var(--mute)' }}>{v.score}/6 · {fmtDate(v.at).slice(5)}</span></li>)}</ul>
            ) : <div className="empty" style={{ padding: '20px 0' }}><Px name="bubble" w={88} /><span>아직 저장한 문장이 없다.</span></div>}
          </Sec>
          {!rid && <p className="disclaimer">진단을 마치면 주요 기여 차원에 맞춰 단어를 제안한다. <Link className="wl" to="/test">진단하기</Link></p>}
        </div>
      </div>
      {toast}
    </main>
  );
}

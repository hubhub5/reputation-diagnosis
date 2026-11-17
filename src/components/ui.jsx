import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { TRIAL } from '../lib/trial.js';

const BASE = import.meta.env.BASE_URL;

export function Px({ name, w, bare, alt = '' }) {
  return (
    <span className={'px' + (bare ? ' bare' : '')} style={w ? { width: w } : undefined} aria-hidden={alt ? undefined : true}>
      <img className="l" src={`${BASE}px/${name}.gif`} alt={alt} width="192" height="192" />
      <img className="d" src={`${BASE}px/${name}-d.gif`} alt="" width="192" height="192" />
    </span>
  );
}

export function Cells({ v, acc, peer, n = 20 }) {
  if (v == null) return <div className="cells na" title="자료 부족">{Array.from({ length: n }, (_, i) => <i key={i} />)}</div>;
  const on = Math.round((v / 100) * n);
  return (
    <div className="cells" title={`${v}`}>
      {Array.from({ length: n }, (_, i) => <i key={i} className={i < on ? (acc ? 'acc' : peer ? 'peer' : 'on') : ''} />)}
    </div>
  );
}

export function Sec({ no, title, small, id, children }) {
  return (
    <section className="sec" id={id}>
      <div className="sec-h"><span className="mono">{no}</span><h2>{title}</h2>{small && <small>{small}</small>}</div>
      {children}
    </section>
  );
}

export function Top() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const toggle = () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', r.dataset.theme); } catch (e) { /* 무시 */ }
  };
  return (
    <header className="top">
      {TRIAL && <div className="trial-bar mono">체험판 · 로그인 없이 쓰고, 입력한 내용은 이 탭을 닫으면 모두 사라진다</div>}
      <div className="top-in">
        <Link className="brand" to="/"><b>평판진단</b><small className="mono">ATN · rev 3</small></Link>
        <nav className={'nav' + (open ? ' open' : '')}>
          <NavLink to="/test" className={({ isActive }) => (isActive ? 'on' : '')}>진단</NavLink>
          <NavLink to="/peer" className={({ isActive }) => (isActive ? 'on' : '')}>타인 평가</NavLink>
          <NavLink to="/sentence" className={({ isActive }) => (isActive ? 'on' : '')}>한 문장</NavLink>
          <NavLink to="/roadmap" className={({ isActive }) => (isActive ? 'on' : '')}>로드맵</NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'on' : '')}>상담·프로그램</NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'on' : '')}>ATN 모형</NavLink>
        </nav>
        <div className="top-tools">
          {!TRIAL && <Link className="btn sm ghost" to="/me">내 진단함</Link>}
          <button className="menu-btn" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>메뉴</button>
          <button className="theme-btn" type="button" onClick={toggle} aria-label="밝기 전환">◐</button>
        </div>
      </div>
    </header>
  );
}

export function Foot() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <nav>
          <Link to="/about">ATN 평판설계모형</Link>
          <Link to="/services">상담·프로그램</Link>
          <Link to="/privacy">개인정보·진단의 한계</Link>
          {!TRIAL && <Link to="/admin">관리자</Link>}
        </nav>
        <p>평판진단테스트는 사람을 등급으로 나누는 검사가 아니다. 자기 응답만으로 실제 평판을 확정하지 않으며, 중요한 판단에는 전문가 검토를 둔다.</p>
        <p className="mono">© 2026 평판진단 · 문항 v0.3 (파일럿) · 『우리는 결국 이름으로 일한다』</p>
      </div>
    </footer>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg ? <div className="toast mono" role="status">{msg}</div> : null, setMsg];
}

export function Empty({ px = 'nametag', children }) {
  return <div className="empty"><Px name={px} />{children}</div>;
}

export function Loading({ label = '불러오는 중' }) {
  return <div className="empty"><Px name="hourglass" w={72} /><span className="mono">{label}</span></div>;
}

export const fmtDate = (iso) => (iso ? iso.slice(0, 10).replaceAll('-', '.') : '');
export const fmtTime = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');
export const fmtDur = (s) => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;
export function copy(text) {
  try { navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

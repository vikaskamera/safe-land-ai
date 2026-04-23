import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── THEME & AUTH CONTEXT ───────────────────────────────────────────────────
const ThemeContext = createContext(null);
const AuthContext = createContext(null);

function useTheme() { return useContext(ThemeContext); }
function useAuth() { return useContext(AuthContext); }

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";

const RISK_CONFIG = {
  NOMINAL:  { color: "#00ff9d", bg: "rgba(0,255,157,0.12)", label: "NOMINAL",  score: 1 },
  ADVISORY: { color: "#ffe500", bg: "rgba(255,229,0,0.12)",  label: "ADVISORY", score: 2 },
  CAUTION:  { color: "#ff9500", bg: "rgba(255,149,0,0.12)",  label: "CAUTION",  score: 3 },
  WARNING:  { color: "#ff4500", bg: "rgba(255,69,0,0.12)",   label: "WARNING",  score: 4 },
  CRITICAL: { color: "#ff0033", bg: "rgba(255,0,51,0.18)",   label: "CRITICAL", score: 5 },
};

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:       #060a12;
  --bg2:      #0c1120;
  --bg3:      #111827;
  --border:   rgba(0,200,255,0.15);
  --accent:   #00c8ff;
  --accent2:  #00ff9d;
  --text:     #e8edf5;
  --text2:    #7a8fa6;
  --danger:   #ff3355;
  --warn:     #ff9500;
  --font-hd:  'Orbitron', monospace;
  --font-mono:'Space Mono', monospace;
  --font-body:'Inter', sans-serif;
  --glow:     0 0 20px rgba(0,200,255,0.4);
  --glow2:    0 0 30px rgba(0,255,157,0.3);
  --r:        8px;
}
.light {
  --bg:       #f0f4f8;
  --bg2:      #ffffff;
  --bg3:      #e8edf5;
  --border:   rgba(0,100,180,0.18);
  --text:     #0d1a2b;
  --text2:    #4a6080;
  --glow:     0 2px 12px rgba(0,100,180,0.15);
}

html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--font-body); line-height: 1.6; overflow-x: hidden; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* ── LAYOUT ── */
.app { display: flex; flex-direction: column; min-height: 100vh; }
.topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  min-height: 60px; display: flex; align-items: center;
  padding: 0 2rem;
  background: rgba(6,10,18,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  gap: 1rem;
}
.light .topbar { background: rgba(240,244,248,0.92); }
.topbar-logo { font-family: var(--font-hd); font-size: 1.1rem; font-weight: 700; color: var(--accent); letter-spacing: 2px; cursor:pointer; flex-shrink: 0; }
.topbar-logo span { color: var(--accent2); }

.topbar-nav {
  position: fixed;
  top: 0;
  right: -320px;
  width: 300px;
  height: 100vh;
  background: rgba(12, 17, 32, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 6rem 1.5rem 2rem;
  gap: 0.5rem;
  transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 110;
  margin: 0;
}
.light .topbar-nav { background: rgba(255, 255, 255, 0.95); }
.topbar-nav.open {
  right: 0;
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
}

.topbar-menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  z-index: 120;
  position: relative;
}

.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text2);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  text-align: left;
  width: 100%;
}
.nav-btn:hover {
  border-color: var(--border);
  transform: translateX(4px);
  color: var(--accent);
  background: transparent;
}
.nav-btn.active {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: none;
  transform: translateX(4px);
}
.light .nav-btn.active { color: var(--bg); }

.nav-overlay {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 105;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.nav-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.topbar-right { margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent2); box-shadow: var(--glow2); animation: pulse 2s infinite; }
.status-dot.offline { background: var(--danger); box-shadow: 0 0 12px rgba(255,51,85,0.5); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ── BUTTONS ── */
.btn { padding: 10px 22px; border-radius: var(--r); border: none; cursor: pointer; font-family: var(--font-body); font-size: 0.88rem; font-weight: 600; transition: all 0.2s; letter-spacing: 0.5px; }
.btn-primary { background: var(--accent); color: #000; }
.btn-primary:hover { background: #00e0ff; box-shadow: var(--glow); transform: translateY(-1px); }
.btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger { background: var(--danger); color: #fff; }
.btn-sm { padding: 6px 14px; font-size: 0.8rem; }
.btn-icon { background: none; border: 1px solid var(--border); color: var(--text2); padding: 7px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-icon:hover { border-color: var(--accent); color: var(--accent); }

/* ── CARDS ── */
.card {
  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.5rem; position: relative; overflow: hidden;
}
.card::before {
  content:''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.4;
}
.card-title { font-family: var(--font-hd); font-size: 0.75rem; font-weight: 600; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; }

/* ── INPUTS ── */
.input-group { margin-bottom: 1.2rem; }
.input-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; }
.input {
  width: 100%; padding: 10px 14px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: var(--r); color: var(--text); font-family: var(--font-mono); font-size: 0.88rem;
  transition: all 0.2s; outline: none;
}
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,200,255,0.1); }
.input-range { -webkit-appearance: none; height: 4px; background: var(--bg3); border-radius: 2px; border: none; padding: 0; }
.input-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; box-shadow: var(--glow); }

/* ── SECTIONS ── */
.page { padding-top: 60px; min-height: 100vh; }
.section { padding: 5rem 2rem; max-width: 1200px; margin: 0 auto; }
.section-sm { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
@media(max-width:900px){ .grid-2,.grid-3,.grid-4 { grid-template-columns: 1fr; } }

/* ── HERO ── */
.hero {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 6rem 2rem 4rem; text-align: center; position: relative; overflow: hidden;
}
.hero-bg {
  position: absolute; inset: 0; z-index: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,200,255,0.07) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 20% 80%, rgba(0,255,157,0.05) 0%, transparent 60%);
}
.hero-grid {
  position: absolute; inset: 0; z-index: 0; opacity: 0.04;
  background-image: linear-gradient(var(--accent) 1px, transparent 1px),
                    linear-gradient(90deg, var(--accent) 1px, transparent 1px);
  background-size: 40px 40px;
}
.hero-content { position: relative; z-index: 1; max-width: 800px; }
.hero-badge { display: inline-block; padding: 5px 16px; border: 1px solid var(--accent); border-radius: 20px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); letter-spacing: 2px; margin-bottom: 1.5rem; }
.hero-title { font-family: var(--font-hd); font-size: clamp(2.5rem,6vw,5rem); font-weight: 900; line-height: 1.05; letter-spacing: -1px; margin-bottom: 1rem; }
.hero-title .accent { color: var(--accent); }
.hero-title .accent2 { color: var(--accent2); }
.hero-sub { font-size: 1.1rem; color: var(--text2); max-width: 600px; margin: 0 auto 2.5rem; line-height: 1.7; }
.hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* ── GAUGE ── */
.gauge-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
.gauge-label { font-family: var(--font-hd); font-size: 0.65rem; letter-spacing: 2px; color: var(--text2); margin-top: 0.5rem; text-transform: uppercase; }
.gauge-value { font-family: var(--font-hd); font-size: 2.2rem; font-weight: 700; }

/* ── RISK BADGE ── */
.risk-badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 6px 16px; border-radius: 20px; font-family: var(--font-hd);
  font-size: 0.72rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
  border: 1px solid currentColor;
}

/* ── TABLE ── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
th { font-family: var(--font-hd); font-size: 0.65rem; letter-spacing: 2px; color: var(--text2); text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); }
td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); font-family: var(--font-mono); color: var(--text); }
tr:hover td { background: rgba(0,200,255,0.03); }

/* ── SIDEBAR LAYOUT ── */
.dashboard-layout { display: flex; min-height: calc(100vh - 60px); margin-top: 60px; }
.sidebar {
  width: 220px; flex-shrink: 0;
  background: var(--bg2); border-right: 1px solid var(--border);
  padding: 1.5rem 0; position: fixed; top: 60px; left: 0; bottom: 0; overflow-y: auto; z-index: 50;
  transition: width 0.25s ease;
}
.sidebar.collapsed { width: 78px; }
.sidebar-section { padding: 0 1rem; margin-bottom: 1.5rem; }
.sidebar-label { font-family: var(--font-hd); font-size: 0.58rem; letter-spacing: 2px; color: var(--text2); text-transform: uppercase; padding: 0 0.5rem; margin-bottom: 0.5rem; }
.sidebar.collapsed .sidebar-label,
.sidebar.collapsed .sidebar-text,
.sidebar.collapsed .sidebar-status-text,
.sidebar.collapsed .sidebar-risk-body,
.sidebar.collapsed .sidebar-risk-badge { display: none; }
.sidebar-status-card {
  padding: 0.85rem;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(0,200,255,0.08), rgba(255,255,255,0.02));
  border: 1px solid rgba(0,200,255,0.14);
}
.sidebar-status-live {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.sidebar-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: rgba(0,255,157,0.1);
  border: 1px solid rgba(0,255,157,0.18);
  color: var(--accent2);
  font-size: 0.72rem;
  font-family: var(--font-mono);
}
.sidebar-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent2);
  box-shadow: var(--glow2);
}
.sidebar-risk-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 36px;
}
.sidebar.collapsed .sidebar-risk-card {
  padding: 0.75rem 0.35rem !important;
}
.sidebar.collapsed .sidebar-risk-indicator { display: flex; }
.sidebar:not(.collapsed) .sidebar-risk-indicator { display: none; }
.sidebar-toggle {
  width: calc(100% - 2rem);
  margin: 0 1rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}
.sidebar-btn {
  display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 9px 12px;
  background: none; border: none; color: var(--text2); font-size: 0.85rem;
  border-radius: 6px; cursor: pointer; transition: all 0.2s; text-align: left;
}
.sidebar.collapsed .sidebar-btn { justify-content: center; padding: 10px 8px; }
.sidebar-btn:hover { background: rgba(0,200,255,0.07); color: var(--text); }
.sidebar-btn.active { background: rgba(0,200,255,0.12); color: var(--accent); }
.sidebar-btn .icon { font-size: 1rem; opacity: 0.7; }
.dash-main { margin-left: 220px; flex: 1; padding: 2rem; transition: margin-left 0.25s ease; }
.dash-main.sidebar-collapsed { margin-left: 78px; }

/* ── FEATURE BAR ── */
.feat-bar-wrap { margin-bottom: 0.75rem; }
.feat-bar-header { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
.feat-bar-name { font-family: var(--font-mono); color: var(--text); }
.feat-bar-val { font-family: var(--font-mono); color: var(--accent); }
.feat-bar-track { height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
.feat-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.8s ease; }

/* ── ANIMATIONS ── */
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes scanline { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
@keyframes glow-pulse { 0%,100%{box-shadow:0 0 10px rgba(0,200,255,0.3)} 50%{box-shadow:0 0 25px rgba(0,200,255,0.6)} }
.animate-in { animation: fadeInUp 0.5s ease both; }
.animate-in-delay-1 { animation-delay: 0.1s; }
.animate-in-delay-2 { animation-delay: 0.2s; }
.animate-in-delay-3 { animation-delay: 0.3s; }

/* ── MISC ── */
.tag { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 0.73rem; font-family: var(--font-mono); font-weight: 600; background: rgba(0,200,255,0.1); color: var(--accent); border: 1px solid rgba(0,200,255,0.2); margin: 2px; }
.divider { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
.text-accent { color: var(--accent); }
.text-accent2 { color: var(--accent2); }
.text-dim { color: var(--text2); font-size: 0.85rem; }
.text-mono { font-family: var(--font-mono); }
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.flex { display: flex; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; position: relative; }
.toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 300; padding: 12px 20px; border-radius: 8px; font-size: 0.87rem; font-weight: 500; animation: fadeInUp 0.3s ease; max-width: 360px; }
.toast-success { background: rgba(0,255,157,0.15); border: 1px solid var(--accent2); color: var(--accent2); }
.toast-error { background: rgba(255,51,85,0.15); border: 1px solid var(--danger); color: var(--danger); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TELEMETRY LIVE ── */
.telem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; }
.telem-cell { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
.telem-cell-label { font-family: var(--font-hd); font-size: 0.6rem; letter-spacing: 2px; color: var(--text2); text-transform: uppercase; margin-bottom: 6px; }
.telem-cell-value { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--accent); }
.telem-cell-unit { font-size: 0.7rem; color: var(--text2); margin-left: 3px; }
.predict-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); gap: 1.5rem; align-items: start; }
.predict-panel { max-height: calc(100vh - 150px); overflow: hidden; }
.predict-scroll { max-height: calc(100vh - 250px); overflow-y: auto; padding-right: 0.35rem; }
.predict-result-card { align-self: start; }
.predict-actions { display: flex; justify-content: stretch; }
.predict-actions .btn { width: 100%; }
.predict-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem; }
.predict-field {
  background: linear-gradient(180deg, rgba(0,200,255,0.06), rgba(255,255,255,0.01));
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.9rem;
}
.predict-field-header { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
.predict-field-label { font-family: var(--font-hd); font-size: 0.62rem; letter-spacing: 1.8px; color: var(--text2); text-transform: uppercase; }
.predict-field-value { font-family: var(--font-mono); font-size: 0.95rem; color: var(--accent); }
.predict-meta { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.predict-meta-chip {
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(0,200,255,0.08);
  border: 1px solid rgba(0,200,255,0.16);
  color: var(--text2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
}
.predict-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
@media(max-width:1100px){ .predict-layout { grid-template-columns: 1fr; } }
@media(max-width:720px){
  .predict-form-grid { grid-template-columns: 1fr; }
  .predict-summary { grid-template-columns: 1fr; }
  .predict-result-card { margin-bottom: 1rem !important; }
}
@media(max-width:1100px){
  .predict-panel, .predict-scroll { max-height: none; overflow: visible; }
  .dashboard-layout { display: block; }
  .sidebar, .sidebar.collapsed {
    width: 100%; position: static; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: flex-start;
    gap: 0.5rem; overflow-x: auto; white-space: nowrap; flex-wrap: nowrap;
    -ms-overflow-style: none; scrollbar-width: none;
  }
  .sidebar::-webkit-scrollbar { display: none; }
  .sidebar-section { margin-bottom: 0; display: flex; align-items: center; gap: 0.5rem; padding: 0; }
  .sidebar-label { display: none; }
  .sidebar-btn { width: auto; white-space: nowrap; padding: 8px 16px; justify-content: center; }
  .sidebar-toggle, .sidebar-status-card { display: none; }
  .dash-main, .dash-main.sidebar-collapsed { margin-left: 0; padding: 1.5rem; }
}
/* Navigation breakpoint logic moved to global scope per user request */
@media(max-width:900px){
  .topbar { padding: 0.75rem 1rem; flex-wrap: wrap; height: auto; gap: 0.75rem; }
  .topbar-right { gap: 0.6rem; margin-left: auto; }
  .page { padding-top: 108px; }
  .dashboard-layout { margin-top: 108px; }
  .dash-main { padding: 1.25rem; }
}
@media(max-width:720px){
  .section, .section-sm { padding: 3.5rem 1rem; }
  .card { padding: 1.1rem; }
  .sidebar-toggle { width: calc(100% - 1.5rem); margin: 0 0.75rem 0.9rem; }
  .sidebar-btn { padding: 10px 12px; }
  .dash-main { padding: 1rem; }
  .telem-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  .toast { left: 1rem; right: 1rem; bottom: 1rem; max-width: none; }
  .modal { margin: 1rem; max-width: none; }
  .topbar-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .page { padding-top: 144px; }
  .dashboard-layout { margin-top: 144px; }
  .nav-user-role { display: none !important; }
}
@media(max-width:560px){
  .hero { padding: 7rem 1rem 3rem; }
  .hero-cta { flex-direction: column; }
  .btn { width: 100%; }
  .topbar-logo { font-size: 0.95rem; }
  .topbar-nav { width: 100vw; border-left: none; right: -100vw; }
  .topbar-nav.open { right: 0; }
  .nav-btn { font-size: 0.85rem; padding: 12px 14px; }
  .topbar-right .btn,
  .topbar-right .btn-icon { width: auto; }
  .predict-field-header { flex-direction: column; align-items: flex-start; }
}

/* ── RECOMMENDATION ── */
.rec-item { display: flex; gap: 0.75rem; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.rec-item:last-child { border-bottom: none; }
.rec-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }

/* ── SIM TIMELINE ── */
.sim-timeline { position: relative; height: 80px; background: var(--bg3); border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
.sim-track { position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0; height: 4px; background: var(--border); }
.sim-progress { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, rgba(0,200,255,0.2), rgba(0,255,157,0.15)); transition: width 0.1s; }
.sim-needle { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--accent); box-shadow: var(--glow); transition: left 0.1s; }

/* ── FOOTER ── */
.footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 2rem; text-align: center; color: var(--text2); font-size: 0.8rem; }
.footer strong { color: var(--accent); font-family: var(--font-hd); font-size: 0.75rem; letter-spacing: 2px; }

/* ── PAGE HEADERS ── */
.page-header { text-align: center; margin-bottom: 3rem; }
.page-header h1 { font-family: var(--font-hd); font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700; letter-spacing: -0.5px; margin-bottom: 0.75rem; }
.page-header p { color: var(--text2); max-width: 600px; margin: 0 auto; line-height: 1.7; }

/* ── ARCH DIAGRAM ── */
.arch-node {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
  padding: 1rem; text-align: center; font-family: var(--font-mono); font-size: 0.78rem;
  position: relative;
}
.arch-node.highlight { border-color: var(--accent); box-shadow: 0 0 15px rgba(0,200,255,0.15); }
.arch-arrow { display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 1.2rem; }

/* ── CONTACT ── */
.contact-form { max-width: 560px; margin: 0 auto; }
.dev-card { display: flex; gap: 1.5rem; align-items: flex-start; padding: 1.5rem; background: var(--bg3); border-radius: 12px; border: 1px solid var(--border); }
.dev-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-family: var(--font-hd); font-weight: 700; font-size: 1.2rem; color: #000; flex-shrink: 0; }

/* ── NOTIFICATION DOT ── */
.notif { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: var(--danger); border-radius: 50%; font-size: 0.65rem; font-weight: 700; color: #fff; margin-left: 4px; }

/* ── SCROLLING TICKER ── */
.ticker { overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg2); padding: 6px 0; }
.ticker-inner { display: inline-flex; gap: 3rem; white-space: nowrap; animation: ticker 30s linear infinite; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text2); }
@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.ticker-item { display: inline-flex; align-items: center; gap: 0.4rem; }
.ticker-item .val { color: var(--accent); font-weight: 700; }
`;

// ─── INJECT STYLES ────────────────────────────────────────────────────────────
function StyleInjector() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    document.title = "SAFE-LAND-AI | Aviation Intelligence Platform";
    return () => document.head.removeChild(s);
  }, []);
  return null;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

// ─── SVG GAUGE ────────────────────────────────────────────────────────────────
function ProbabilityGauge({ value = 0, size = 200 }) {
  const pct = Math.min(1, Math.max(0, value));
  const R = (size / 2) - 18;
  const cx = size / 2, cy = size / 2;
  const startAngle = -220, sweepAngle = 260;
  const toRad = d => (d * Math.PI) / 180;
  const arc = (a) => ({
    x: cx + R * Math.cos(toRad(a)),
    y: cy + R * Math.sin(toRad(a))
  });
  const s = arc(startAngle);
  const e = arc(startAngle + sweepAngle * pct);
  const large = sweepAngle * pct > 180 ? 1 : 0;
  const bg_e = arc(startAngle + sweepAngle);
  const riskKey = pct < 0.15 ? "NOMINAL" : pct < 0.35 ? "ADVISORY" : pct < 0.55 ? "CAUTION" : pct < 0.75 ? "WARNING" : "CRITICAL";
  const riskColor = RISK_CONFIG[riskKey].color;
  const pct100 = Math.round(pct * 100);

  return (
    <div className="gauge-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00c8ff" />
            <stop offset="50%" stopColor="#ff9500" />
            <stop offset="100%" stopColor="#ff0033" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* BG arc */}
        <path d={`M${s.x},${s.y} A${R},${R} 0 1 1 ${bg_e.x},${bg_e.y}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
        {/* Fill arc */}
        {pct > 0.005 && (
          <path d={`M${s.x},${s.y} A${R},${R} 0 ${large} 1 ${e.x},${e.y}`}
            fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round" filter="url(#glow)" />
        )}
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = startAngle + sweepAngle * t;
          const inner = { x: cx + (R - 18) * Math.cos(toRad(a)), y: cy + (R - 18) * Math.sin(toRad(a)) };
          const outer = { x: cx + (R - 8) * Math.cos(toRad(a)), y: cy + (R - 8) * Math.sin(toRad(a)) };
          return <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />;
        })}
        {/* Center value */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={riskColor}
          fontFamily="'Orbitron',monospace" fontSize={size * 0.14} fontWeight="700">{pct100}%</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.4)"
          fontFamily="'Orbitron',monospace" fontSize={size * 0.055}>CRASH PROB</text>
        {/* Needle */}
        <circle cx={e.x} cy={e.y} r="6" fill={riskColor} filter="url(#glow)" />
      </svg>
      <div className="gauge-label" style={{ color: riskColor }}>{riskKey}</div>
    </div>
  );
}

// ─── FEATURE BAR ─────────────────────────────────────────────────────────────
function FeatureBar({ name, value, description }) {
  return (
    <div className="feat-bar-wrap">
      <div className="feat-bar-header">
        <span className="feat-bar-name">{name.replace(/_/g, " ")}</span>
        <span className="feat-bar-val">{(value * 100).toFixed(1)}%</span>
      </div>
      {description && <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginBottom: "4px" }}>{description}</div>}
      <div className="feat-bar-track">
        <div className="feat-bar-fill" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

// ─── TELEMETRY CELL ──────────────────────────────────────────────────────────
function TelemCell({ label, value, unit, color }) {
  return (
    <div className="telem-cell">
      <div className="telem-cell-label">{label}</div>
      <div className="telem-cell-value" style={color ? { color } : {}}>
        {value}<span className="telem-cell-unit">{unit}</span>
      </div>
    </div>
  );
}

// ─── RISK BADGE ──────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.NOMINAL;
  return (
    <span className="risk-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "pilot" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (form.password.length < 6 || form.password.length > 16) {
      setError("Password must be between 6 and 16 characters.");
      return;
    }
    setLoading(true); setError("");
    try {
      const url = mode === "login" ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const body = mode === "login"
        ? { username: form.username, password: form.password }
        : form;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      if (mode === "login") {
        localStorage.setItem("sl_token", data.access_token);
        localStorage.setItem("sl_refresh", data.refresh_token);
        onSuccess(data.access_token);
      } else {
        setMode("login");
        setError("Registered! Please log in.");
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.9rem", color: "var(--accent)", letterSpacing: "2px" }}>
            {mode === "login" ? "SECURE LOGIN" : "REGISTER"}
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} className="btn btn-sm"
              style={{ flex: 1, background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "#000" : "var(--text2)", border: "1px solid var(--border)" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        {error && <div style={{ padding: "10px", background: "rgba(255,51,85,0.1)", border: "1px solid var(--danger)", borderRadius: "6px", color: "var(--danger)", fontSize: "0.83rem", marginBottom: "1rem" }}>{error}</div>}
        <div className="input-group">
          <label className="input-label">Username</label>
          <input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="callsign" />
        </div>
        {mode === "register" && (
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input" type="password" minLength={6} maxLength={16} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        {mode === "register" && (
          <div style={{ marginTop: "-0.4rem", marginBottom: "0.75rem", fontSize: "0.76rem", color: "var(--text2)" }}>
            Password must be 6 to 16 characters.
          </div>
        )}
        {mode === "register" && (
          <div className="input-group">
            <label className="input-label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="pilot">Pilot</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
        )}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}
          onClick={handle} disabled={loading}>
          {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
        </button>
        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
          Demo: admin / admin123
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    designation: user?.designation || "",
    organization: user?.organization || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("sl_token");
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile update failed");
      onSaved(data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in" style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.9rem", color: "var(--accent)", letterSpacing: "2px" }}>
            PROFILE SETTINGS
          </div>
          <button className="btn-icon" onClick={onClose}>x</button>
        </div>
        {error && <div style={{ padding: "10px", background: "rgba(255,51,85,0.1)", border: "1px solid var(--danger)", borderRadius: "6px", color: "var(--danger)", fontSize: "0.83rem", marginBottom: "1rem" }}>{error}</div>}
        {[
          ["full_name", "Full Name", "Captain Amelia Stone"],
          ["designation", "Designation", "Senior Flight Safety Officer"],
          ["organization", "Organization", "SAFE-LAND-AI Operations"],
          ["phone", "Phone", "+1 555 0147"],
          ["location", "Location", "Bengaluru, India"],
        ].map(([key, label, placeholder]) => (
          <div key={key} className="input-group">
            <label className="input-label">{label}</label>
            <input className="input" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
          </div>
        ))}
        <div className="input-group">
          <label className="input-label">Professional Summary</label>
          <textarea className="input" rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Flight operations background, certifications, focus area, or research interests." style={{ resize: "vertical" }} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={saveProfile} disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ page, setPage, wsStatus }) {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setToken] = useState(localStorage.getItem("sl_token"));

  const nav = ["Home", "About", "Resources", "Documentation", "Dashboard", "Simulation", "Reports", "Contact"];
  const displayName = user?.full_name || user?.username;

  const handleLogin = (tok) => { setToken(tok); setShowAuth(false); window.location.reload(); };
  const handleNavigate = (targetPage) => {
    setPage(targetPage);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="topbar">
        <div className="topbar-logo" onClick={() => handleNavigate("Home")}>
          SAFE<span>-LAND-</span>AI
        </div>
        <div className={`topbar-nav ${mobileMenuOpen ? "open" : ""}`}>
          {nav.map(n => (
            <button key={n} className={`nav-btn ${page === n ? "active" : ""}`} onClick={() => handleNavigate(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="topbar-right">
          <div title={wsStatus === "connected" ? "Live telemetry active" : "WebSocket offline"}
            className={`status-dot ${wsStatus !== "connected" ? "offline" : ""}`} />
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text2)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <span className="nav-user-name">{displayName}</span> <span className="tag nav-user-role">{user.role}</span>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProfile(true)}>Profile</button>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAuth(true)}>Login</button>
          )}
          <button
            className="btn-icon topbar-menu-toggle"
            onClick={() => setMobileMenuOpen(open => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        <div className={`nav-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleLogin} />}
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onSaved={setUser} />}
    </>
  );
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
function LiveTicker({ telemetry }) {
  const items = telemetry ? [
    { label: "ALT", val: `${telemetry.altitude?.toFixed(0)} ft` },
    { label: "SPD", val: `${telemetry.velocity?.toFixed(0)} kts` },
    { label: "VS", val: `${telemetry.vertical_speed?.toFixed(0)} fpm` },
    { label: "PITCH", val: `${telemetry.pitch_angle?.toFixed(1)}°` },
    { label: "ROLL", val: `${telemetry.roll_angle?.toFixed(1)}°` },
    { label: "FUEL", val: `${telemetry.fuel_level?.toFixed(1)}%` },
    { label: "WIND", val: `${telemetry.wind_speed?.toFixed(1)} kts` },
    { label: "VIS", val: `${telemetry.visibility?.toFixed(1)} SM` },
    { label: "G-FORCE", val: `${telemetry.g_force?.toFixed(2)}G` },
  ] : [];
  const doubled = [...items, ...items];
  return (
    <div className="ticker">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span style={{ color: "var(--text2)" }}>{item.label}:</span>
            <span className="val">{item.val}</span>
            <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 1rem" }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGES ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function HomePage({ setPage, telemetry, prediction }) {
  const features = [
    { icon: "⚡", title: "Real-Time Prediction", desc: "Sub-second crash probability assessment using ensemble Random Forest with 200+ decision trees." },
    { icon: "📡", title: "Live Telemetry", desc: "WebSocket-powered streaming of 12 aircraft parameters with automatic REST fallback." },
    { icon: "🧠", title: "Explainable AI", desc: "Feature importance engine reveals which parameters drive each risk classification." },
    { icon: "🔒", title: "Secure Architecture", desc: "JWT authentication, role-based access control, bcrypt password hashing, and audit logging." },
    { icon: "📊", title: "Flight Analytics", desc: "Historical prediction records, CSV export, and trend analysis across flight sessions." },
    { icon: "🛡️", title: "Enterprise Grade", desc: "Production-ready FastAPI backend with SQLAlchemy ORM, structured logging, and Docker deployment." },
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge animate-in">◈ AVIATION SAFETY INTELLIGENCE PLATFORM v1.0</div>
          <h1 className="hero-title animate-in animate-in-delay-1">
            Predict.<br />
            <span className="accent">Analyze.</span>{" "}
            <span className="accent2">Land Safe.</span>
          </h1>
          <p className="hero-sub animate-in animate-in-delay-2">
            SAFE-LAND-AI fuses machine learning, real-time telemetry streaming, and aviation domain expertise 
            to deliver actionable crash landing probability assessments for pilots, researchers, and safety teams.
          </p>
          <div className="hero-cta animate-in animate-in-delay-3">
            <button className="btn btn-primary" onClick={() => setPage("Dashboard")}>Launch Dashboard →</button>
            <button className="btn btn-ghost" onClick={() => setPage("Documentation")}>View API Docs</button>
          </div>
        </div>
      </section>

      {/* Live prediction preview */}
      {prediction && (
        <section style={{ padding: "0 2rem 4rem", maxWidth: "900px", margin: "0 auto" }}>
          <div className="card">
            <div className="card-title">◈ Live Prediction Preview</div>
            <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
              <ProbabilityGauge value={prediction.prediction_probability || 0} size={180} />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "1rem" }}>
                  <div className="text-dim mb-1">Current Risk Classification</div>
                  <RiskBadge level={prediction.risk_level || "NOMINAL"} />
                </div>
                <div style={{ fontSize: "0.83rem", color: "var(--text2)", lineHeight: 1.7 }}>
                  {(prediction.recommendations || []).slice(0, 2).map((r, i) => (
                    <div key={i} style={{ marginBottom: "0.5rem" }}>▸ {r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="section">
        <div className="page-header">
          <h1>Platform <span className="text-accent">Capabilities</span></h1>
          <p>Built for aviators and safety engineers who demand precision and reliability under pressure.</p>
        </div>
        <div className="grid-3">
          {features.map((f, i) => (
            <div key={i} className="card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.8rem", color: "var(--accent)", letterSpacing: "1px", marginBottom: "0.5rem" }}>{f.title}</div>
              <p className="text-dim">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture overview */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card">
          <div className="card-title">◈ System Architecture</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", alignItems: "center" }}>
            {[
              { label: "React UI", sub: "Frontend", color: "var(--accent)" },
              null,
              { label: "FastAPI", sub: "Backend", color: "var(--accent2)" },
              null,
              { label: "Random Forest", sub: "ML Engine", color: "var(--warn)" },
            ].map((item, i) => item
              ? <div key={i} className="arch-node" style={{ borderColor: item.color }}>
                  <div style={{ color: item.color, fontFamily: "var(--font-hd)", fontSize: "0.8rem", marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ color: "var(--text2)", fontSize: "0.7rem" }}>{item.sub}</div>
                </div>
              : <div key={i} className="arch-arrow">→</div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
            {[{ label: "WebSocket", sub: "Realtime" }, { label: "SQLite", sub: "Database" }, { label: "JWT Auth", sub: "Security" }].map((n, i) => (
              <div key={i} className="arch-node"><div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text2)" }}>{n.label} · {n.sub}</div></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>ABOUT SAFE-LAND-AI</div>
          <h1>Redefining <span className="text-accent">Aviation Safety</span><br />Through Intelligence</h1>
          <p>An aerospace analytics platform purpose-built to reduce controlled flight into terrain (CFIT) and hard landing incidents through real-time predictive modeling.</p>
        </div>

        <div className="grid-2" style={{ marginBottom: "3rem" }}>
          <div className="card">
            <div className="card-title">◈ Mission Statement</div>
            <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: "1rem" }}>
              SAFE-LAND-AI exists to transform raw aircraft sensor data into actionable safety intelligence.
              Every second of final approach carries risk — our platform quantifies and communicates
              that risk in real time, giving crews and safety officers the data they need to make critical decisions.
            </p>
            <p style={{ color: "var(--text2)", lineHeight: 1.8 }}>
              We believe aviation safety should not depend on manual checklists alone. Machine learning
              provides a non-fatiguing, consistent second opinion that integrates seamlessly into existing cockpit workflows.
            </p>
          </div>
          <div className="card">
            <div className="card-title">◈ Problem Statement</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { stat: "~80%", desc: "of aviation accidents involve human factors as a primary cause" },
                { stat: "CFIT", desc: "Controlled Flight Into Terrain remains a leading fatal accident category" },
                { stat: "<3s", desc: "Average time available for crew response to critical low-altitude events" },
                { stat: "12+", desc: "Independent parameters must be simultaneously assessed during approach" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "var(--font-hd)", color: "var(--accent)", fontSize: "0.9rem", minWidth: "60px" }}>{item.stat}</div>
                  <div style={{ color: "var(--text2)", fontSize: "0.85rem" }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card-title">◈ ML Workflow</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {[
              { step: "01", label: "Data Ingestion", desc: "12 telemetry channels from FDR/sensors" },
              { step: "02", label: "Feature Extraction", desc: "Normalization, validation, encoding" },
              { step: "03", label: "RF Inference", desc: "200-tree ensemble classification" },
              { step: "04", label: "Risk Mapping", desc: "Probability → 5-tier risk scale" },
              { step: "05", label: "Recommendations", desc: "Domain-rule advisory generation" },
              { step: "06", label: "Explainability", desc: "Per-feature importance scores" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontFamily: "var(--font-hd)", fontSize: "1.5rem", color: "var(--accent)", opacity: 0.4 }}>{s.step}</div>
                <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.72rem", color: "var(--text)", marginBottom: "0.35rem", letterSpacing: "1px" }}>{s.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">◈ Innovation Highlights</div>
          <div className="grid-2">
            {[
              { title: "Singleton Model Service", desc: "The prediction engine is loaded once at startup using a Singleton pattern, ensuring sub-millisecond inference after initial warm-up." },
              { title: "Adaptive Risk Thresholds", desc: "Five-tier risk classification (NOMINAL → CRITICAL) maps probability bands to aviation-standard alerting levels." },
              { title: "Domain-Encoded Recommendations", desc: "Aviation checklist procedures are encoded as rule conditions triggered by parameter thresholds." },
              { title: "WebSocket + REST Fallback", desc: "Telemetry streams via WebSocket with automatic degradation to REST polling when WS is unavailable." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "1rem", background: "var(--bg3)", borderRadius: "8px" }}>
                <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.75rem", color: "var(--accent2)", marginBottom: "0.4rem" }}>{item.title}</div>
                <p style={{ color: "var(--text2)", fontSize: "0.83rem", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


// ─── DOCUMENTATION PAGE ───────────────────────────────────────────────────────
// Resources Page
function ResourcesPage() {
  const caseStudies = [
    {
      title: "Emirates Flight 521",
      year: "2016",
      aircraft: "Boeing 777-300",
      category: "Go-around / hard runway contact",
      color: "#ff9500",
      summary: "During an attempted go-around in Dubai, the aircraft settled back onto the runway and was destroyed by post-landing fire. The event is widely studied for automation mode awareness, energy management, and go-around execution under pressure.",
      lessons: ["Monitor thrust and pitch changes closely", "Confirm go-around mode engagement", "Guard against late configuration surprises", "Train for high-workload transition moments"],
    },
    {
      title: "Asiana Flight 214",
      year: "2013",
      aircraft: "Boeing 777-200ER",
      category: "Unstable approach / severe hard landing",
      color: "#00c8ff",
      summary: "The aircraft approached San Francisco below glide path and at insufficient speed, striking the seawall before runway impact. It remains a major case study in visual approach discipline, automation dependency, and stabilized approach criteria.",
      lessons: ["Enforce stabilized approach gates", "Intervene early when speed decays", "Use clear pilot monitoring callouts", "Do not continue an unstable descent"],
    },
    {
      title: "Pegasus Airlines Flight 8622",
      year: "2018",
      aircraft: "Boeing 737-800",
      category: "Runway excursion after landing",
      color: "#00ff9d",
      summary: "After landing at Trabzon, the aircraft overran and came to rest on a steep embankment near the shoreline. Safety discussions around the event focus on landing rollout control, runway conditions, and rapid decision-making after touchdown.",
      lessons: ["Respect contaminated runway margins", "Track deceleration effectiveness immediately", "Prepare for runway-end risk on short fields", "Review excursion recovery decision paths"],
    },
    {
      title: "FedEx Flight 80",
      year: "2009",
      aircraft: "McDonnell Douglas MD-11",
      category: "Bounced landing / loss of control",
      color: "#ff3355",
      summary: "On landing at Narita, a hard touchdown led to a bounce sequence and loss of control. The case is frequently used in recurrent training because it highlights bounce recovery technique, crosswind handling, and the dangers of aggressive correction inputs.",
      lessons: ["Avoid overcorrecting after the first bounce", "Apply bounce recovery procedures consistently", "Respect aircraft-specific landing traits", "Crosswind technique matters most near touchdown"],
    },
  ];

  const warningSigns = [
    "High descent rate below 500 ft with delayed correction",
    "Speed instability during visual or manual approach",
    "Floating followed by rushed flare input",
    "Incomplete cross-check between PF and PM during landing transition",
  ];

  const analystChecklist = [
    "Review vertical speed, pitch, and groundspeed trends in the last 30 seconds before touchdown.",
    "Check whether the approach met stabilized criteria at the operator's decision gates.",
    "Compare touchdown point, bounce sequence, and rollout profile against runway available.",
    "Capture automation mode changes and crew callout timing in the event timeline.",
  ];

  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>RESOURCES</div>
          <h1>Real case studies on <span className="text-accent">hard landings</span><br />and runway incidents</h1>
          <p>Use these examples to study unstable approaches, hard touchdown patterns, bounced landings, and runway excursion risks.</p>
        </div>

        <div className="grid-2" style={{ marginBottom: "3rem" }}>
          {caseStudies.map((study, i) => (
            <div key={i} className="card" style={{ borderColor: `${study.color}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.9rem" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-hd)", fontSize: "1rem", color: study.color, letterSpacing: "1px" }}>{study.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "2px" }}>{study.year} - {study.aircraft}</div>
                </div>
                <span style={{ padding: "4px 8px", borderRadius: "999px", background: `${study.color}14`, border: `1px solid ${study.color}35`, color: study.color, fontSize: "0.68rem", fontFamily: "var(--font-mono)" }}>
                  {study.category}
                </span>
              </div>
              <p style={{ color: "var(--text2)", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1rem" }}>{study.summary}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {study.lessons.map((lesson, j) => (
                  <span key={j} style={{ padding: "3px 8px", background: `${study.color}12`, border: `1px solid ${study.color}30`, borderRadius: "4px", fontSize: "0.7rem", color: study.color, fontFamily: "var(--font-mono)" }}>{lesson}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Common Warning Signs</div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {warningSigns.map((item, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text2)", lineHeight: 1.6 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Case Review Checklist</div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {analystChecklist.map((item, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text2)", lineHeight: 1.6 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const endpoints = [
    { method: "POST", path: "/auth/register", auth: false, desc: "Register a new user account", body: "username, email, password, role" },
    { method: "POST", path: "/auth/login", auth: false, desc: "Authenticate and receive JWT tokens", body: "username, password" },
    { method: "POST", path: "/auth/logout", auth: true, desc: "Invalidate current session", body: "—" },
    { method: "POST", path: "/auth/refresh", auth: false, desc: "Exchange refresh token for new access token", body: "refresh_token" },
    { method: "GET",  path: "/api/health", auth: false, desc: "Platform health check endpoint", body: "—" },
    { method: "POST", path: "/api/predict", auth: true, desc: "Submit telemetry for crash probability prediction", body: "12 telemetry fields" },
    { method: "POST", path: "/api/predict/batch", auth: true, desc: "Batch prediction for multiple records", body: "records[]" },
    { method: "GET",  path: "/api/history", auth: true, desc: "Retrieve user's prediction history", body: "?limit=50&offset=0" },
    { method: "GET",  path: "/api/explain", auth: true, desc: "Feature importance from trained model", body: "—" },
    { method: "GET",  path: "/admin/users", auth: "admin", desc: "List all registered users", body: "—" },
    { method: "DELETE", path: "/admin/user/{id}", auth: "admin", desc: "Delete user account", body: "—" },
    { method: "GET",  path: "/admin/system-metrics", auth: "admin", desc: "CPU, memory, disk usage", body: "—" },
  ];

  const params = [
    { name: "altitude", type: "float", range: "0–50,000 ft", desc: "Aircraft altitude above ground level" },
    { name: "velocity", type: "float", range: "0–1,000 kts", desc: "Total airspeed" },
    { name: "vertical_speed", type: "float", range: "any (fpm)", desc: "Rate of climb (positive) or descent (negative)" },
    { name: "horizontal_speed", type: "float", range: "≥0 kts", desc: "Horizontal ground speed" },
    { name: "pitch_angle", type: "float", range: "-90° to 90°", desc: "Nose attitude: positive=up, negative=down" },
    { name: "roll_angle", type: "float", range: "-180° to 180°", desc: "Wing bank angle" },
    { name: "yaw_angle", type: "float", range: "-180° to 180°", desc: "Heading deviation" },
    { name: "g_force", type: "float", range: "-5 to 10 G", desc: "Gravitational force loading" },
    { name: "fuel_level", type: "float", range: "0–100%", desc: "Remaining fuel as percentage" },
    { name: "engine_status", type: "bool", range: "true/false", desc: "Engine operational status" },
    { name: "wind_speed", type: "float", range: "≥0 kts", desc: "Surface wind speed at landing zone" },
    { name: "visibility", type: "float", range: "≥0 SM", desc: "Forward visibility in statute miles" },
  ];

  const sections = ["overview", "endpoints", "parameters", "risk-guide", "websocket"];
  const methodColor = { GET: "#00ff9d", POST: "#00c8ff", DELETE: "#ff3355" };

  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>API REFERENCE</div>
          <h1>Developer <span className="text-accent">Documentation</span></h1>
          <p>Complete reference for integrating with the SAFE-LAND-AI prediction API.</p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className="btn btn-sm"
              style={{ background: activeSection === s ? "var(--accent)" : "transparent", color: activeSection === s ? "#000" : "var(--text2)", border: "1px solid var(--border)", textTransform: "uppercase", fontFamily: "var(--font-hd)", letterSpacing: "1px", fontSize: "0.65rem" }}>
              {s.replace("-", " ")}
            </button>
          ))}
        </div>

        {activeSection === "overview" && (
          <div className="card">
            <div className="card-title">◈ Overview</div>
            <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: "1rem" }}>
              The SAFE-LAND-AI REST API accepts aircraft telemetry parameters and returns real-time crash probability predictions
              with risk classification and actionable recommendations. All prediction endpoints require JWT Bearer token authentication.
            </p>
            <div style={{ background: "var(--bg3)", borderRadius: "8px", padding: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.82rem", marginBottom: "1rem" }}>
              <div style={{ color: "var(--text2)", marginBottom: "0.5rem" }}>Base URL</div>
              <div style={{ color: "var(--accent)" }}>http://localhost:8000</div>
            </div>
            <div style={{ background: "var(--bg3)", borderRadius: "8px", padding: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
              <div style={{ color: "var(--text2)", marginBottom: "0.5rem" }}>Authorization Header</div>
              <div style={{ color: "var(--accent2)" }}>Authorization: Bearer {"<access_token>"}</div>
            </div>
          </div>
        )}

        {activeSection === "endpoints" && (
          <div className="card">
            <div className="card-title">◈ API Endpoints</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Method</th><th>Path</th><th>Auth</th><th>Description</th></tr></thead>
                <tbody>
                  {endpoints.map((ep, i) => (
                    <tr key={i}>
                      <td><span style={{ fontFamily: "var(--font-mono)", color: methodColor[ep.method] || "#fff", fontWeight: 700 }}>{ep.method}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{ep.path}</td>
                      <td>{ep.auth === true ? <span className="tag">JWT</span> : ep.auth === "admin" ? <span className="tag" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>ADMIN</span> : <span style={{ color: "var(--text2)", fontSize: "0.78rem" }}>Public</span>}</td>
                      <td style={{ color: "var(--text2)" }}>{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "parameters" && (
          <div className="card">
            <div className="card-title">◈ Prediction Input Parameters</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Parameter</th><th>Type</th><th>Range</th><th>Description</th></tr></thead>
                <tbody>
                  {params.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{p.name}</td>
                      <td><span className="tag">{p.type}</span></td>
                      <td style={{ color: "var(--text2)", fontSize: "0.78rem" }}>{p.range}</td>
                      <td style={{ color: "var(--text2)" }}>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "risk-guide" && (
          <div className="card">
            <div className="card-title">◈ Risk Level Interpretation Guide</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(RISK_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", padding: "1rem", background: cfg.bg, borderRadius: "8px", border: `1px solid ${cfg.color}30` }}>
                  <div style={{ minWidth: "100px" }}><RiskBadge level={key} /></div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Probability: {key === "NOMINAL" ? "< 15%" : key === "ADVISORY" ? "15–35%" : key === "CAUTION" ? "35–55%" : key === "WARNING" ? "55–75%" : "> 75%"}
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "var(--text2)" }}>
                      {key === "NOMINAL" && "All parameters within normal operating envelope. Continue approach per standard procedures."}
                      {key === "ADVISORY" && "Elevated risk detected. Heightened crew awareness recommended. Monitor parameters closely."}
                      {key === "CAUTION" && "Approach stability degraded. Go-around criteria may be met. Review stabilized approach checklist."}
                      {key === "WARNING" && "High risk of hard landing or exceedance. Execute go-around unless immediate correction is achievable."}
                      {key === "CRITICAL" && "Imminent crash landing risk. Execute go-around immediately. Declare emergency if engine failure confirmed."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "websocket" && (
          <div className="card">
            <div className="card-title">◈ WebSocket Telemetry Stream</div>
            <p style={{ color: "var(--text2)", marginBottom: "1rem", lineHeight: 1.7 }}>
              Connect to the WebSocket endpoint to receive live 1Hz telemetry with embedded predictions.
            </p>
            <div style={{ background: "var(--bg3)", borderRadius: "8px", padding: "1.2rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.8 }}>
              <div style={{ color: "var(--text2)", marginBottom: "0.75rem" }}>// Connect</div>
              <div style={{ color: "var(--accent2)" }}>{"const ws = new WebSocket('ws://localhost:8000/ws');"}</div>
              <div style={{ color: "var(--text2)", margin: "0.75rem 0" }}>// Receive message</div>
              <div style={{ color: "var(--accent)" }}>{"ws.onmessage = (event) => {"}</div>
              <div style={{ color: "var(--text)", paddingLeft: "1.5rem" }}>{"const data = JSON.parse(event.data);"}</div>
              <div style={{ color: "var(--text)", paddingLeft: "1.5rem" }}>{"// data.prediction_probability: 0.0 - 1.0"}</div>
              <div style={{ color: "var(--text)", paddingLeft: "1.5rem" }}>{"// data.risk_level: NOMINAL | ADVISORY | CAUTION | WARNING | CRITICAL"}</div>
              <div style={{ color: "var(--text)", paddingLeft: "1.5rem" }}>{"// data.recommendations: string[]"}</div>
              <div style={{ color: "var(--accent)" }}>{"}"}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ telemetry, prediction, wsStatus }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("telemetry");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [form, setForm] = useState({
    altitude: 1500, velocity: 130, vertical_speed: -600, horizontal_speed: 125,
    pitch_angle: -3, roll_angle: 2, yaw_angle: 0, g_force: 1.1,
    fuel_level: 45, engine_status: true, wind_speed: 12, visibility: 8,
  });
  const [manualResult, setManualResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [explainData, setExplainData] = useState(null);
  const [toast, setToast] = useState(null);
  const predictionTimerRef = useRef(null);

  if (!user) return (
    <div className="page flex-center" style={{ minHeight: "80vh" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: "420px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
        <div style={{ fontFamily: "var(--font-hd)", color: "var(--accent)", marginBottom: "0.75rem" }}>AUTHENTICATION REQUIRED</div>
        <p className="text-dim">The dashboard requires a valid pilot, researcher, or admin account. Please login to access real-time telemetry and prediction tools.</p>
      </div>
    </div>
  );

  const normalizePredictPayload = (payload) => {
    const limits = {
      altitude: { min: 0, max: 50000 },
      velocity: { min: 0, max: 1000 },
      vertical_speed: { min: -5000, max: 5000 },
      horizontal_speed: { min: 0, max: 1000 },
      pitch_angle: { min: -90, max: 90 },
      roll_angle: { min: -180, max: 180 },
      yaw_angle: { min: -180, max: 180 },
      g_force: { min: -5, max: 10 },
      fuel_level: { min: 0, max: 100 },
      wind_speed: { min: 0, max: 150 },
      visibility: { min: 0, max: 20 },
    };

    const normalized = { ...payload };
    for (const [key, range] of Object.entries(limits)) {
      const value = Number(normalized[key]);
      if (!Number.isFinite(value)) return null;
      normalized[key] = Math.min(range.max, Math.max(range.min, value));
    }
    normalized.engine_status = Boolean(normalized.engine_status);
    return normalized;
  };

  const runPrediction = async (payload = form, { silent = false } = {}) => {
    const normalizedPayload = normalizePredictPayload(payload);
    if (!normalizedPayload) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("sl_token");
      const res = await fetch(`${API_BASE}/api/predict/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(normalizedPayload)
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map(item => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Prediction preview failed");
      }
      setManualResult(data);
      if (!silent) setToast({ msg: "Prediction updated", type: "success" });
    } catch (e) {
      if (!silent) setToast({ msg: e.message, type: "error" });
    } finally { setLoading(false); }
  };

  const savePredictionReport = async () => {
    const normalizedPayload = normalizePredictPayload(form);
    if (!normalizedPayload) {
      setToast({ msg: "Enter valid telemetry values before saving", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("sl_token");
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(normalizedPayload)
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map(item => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to save report");
      }
      setManualResult(data);
      setToast({ msg: "Prediction saved to Reports", type: "success" });
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user || activeTab !== "predict") return;
    clearTimeout(predictionTimerRef.current);
    predictionTimerRef.current = setTimeout(() => {
      runPrediction(form, { silent: true });
    }, 250);
    return () => clearTimeout(predictionTimerRef.current);
  }, [form, activeTab, user]);

  const loadExplain = async () => {
    try {
      const token = localStorage.getItem("sl_token");
      const res = await fetch(`${API_BASE}/api/explain`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setExplainData(data);
    } catch { setExplainData(null); }
  };

  const displayPred = manualResult || prediction;
  const risk = displayPred?.risk_level || "NOMINAL";
  const riskCfg = RISK_CONFIG[risk] || RISK_CONFIG.NOMINAL;
  const liveTelem = telemetry;
  const predictFields = [
    { key: "altitude", label: "Altitude", unit: "ft", step: 10, min: 0, max: 50000 },
    { key: "velocity", label: "Airspeed", unit: "kts", step: 1, min: 0, max: 1000 },
    { key: "vertical_speed", label: "Vertical Speed", unit: "fpm", step: 10, min: -5000, max: 5000 },
    { key: "horizontal_speed", label: "Horizontal Speed", unit: "kts", step: 1, min: 0, max: 1000 },
    { key: "pitch_angle", label: "Pitch", unit: "deg", step: 0.1, min: -90, max: 90 },
    { key: "roll_angle", label: "Roll", unit: "deg", step: 0.1, min: -180, max: 180 },
    { key: "yaw_angle", label: "Yaw", unit: "deg", step: 0.1, min: -180, max: 180 },
    { key: "g_force", label: "G-Force", unit: "G", step: 0.1, min: -5, max: 10 },
    { key: "fuel_level", label: "Fuel", unit: "%", step: 0.1, min: 0, max: 100 },
    { key: "wind_speed", label: "Wind", unit: "kts", step: 0.1, min: 0, max: 150 },
    { key: "visibility", label: "Visibility", unit: "SM", step: 0.1, min: 0, max: 20 },
  ];

  return (
    <div className="dashboard-layout">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button className="btn btn-ghost btn-sm sidebar-toggle" onClick={() => setSidebarCollapsed(v => !v)}>
          <span className="icon">{sidebarCollapsed ? ">>" : "<<"}</span>
          <span className="sidebar-text">{sidebarCollapsed ? "Expand" : "Collapse"}</span>
        </button>
        <div className="sidebar-section">
          <div className="sidebar-label">Main</div>
          {[
            { id: "telemetry", icon: "📡", label: "Live Telemetry" },
            { id: "predict", icon: "🧠", label: "Prediction" },
            { id: "explain", icon: "📊", label: "Feature Importance" },
            { id: "recommendations", icon: "⚡", label: "Recommendations" },
          ].map(tab => (
            <button key={tab.id} className={`sidebar-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => { setActiveTab(tab.id); if (tab.id === "explain" && !explainData) loadExplain(); }}>
              <span className="icon">{tab.icon}</span>
              <span className="sidebar-text">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Status</div>
          <div className="sidebar-status-card">
            <div className="sidebar-status-live">
              <span className="sidebar-status-text" style={{ color: "var(--text2)", fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>
                Status: Active
              </span>
              <span className="sidebar-live-pill">
                <span className="sidebar-live-dot" style={{ background: wsStatus === "connected" ? "var(--accent2)" : "var(--danger)", boxShadow: wsStatus === "connected" ? "var(--glow2)" : "0 0 12px rgba(255,51,85,0.5)" }} />
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
              <span className="sidebar-status-text" style={{ color: "var(--text2)" }}>Model</span>
              <span style={{ color: "var(--accent2)" }}>READY</span>
            </div>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-risk-card" style={{ padding: "0.75rem 0.5rem", background: riskCfg.bg, borderRadius: "8px", border: `1px solid ${riskCfg.color}30`, textAlign: "center" }}>
            <div className="sidebar-risk-body" style={{ fontSize: "0.6rem", letterSpacing: "2px", color: "var(--text2)", marginBottom: "4px", fontFamily: "var(--font-hd)" }}>RISK STATUS</div>
            <div className="sidebar-risk-indicator">
              <div className="status-dot" style={{ background: riskCfg.color, boxShadow: `0 0 16px ${riskCfg.color}` }} />
            </div>
            <div className="sidebar-risk-badge">
              <RiskBadge level={risk} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`dash-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-hd)", fontSize: "1.1rem", letterSpacing: "2px" }}>FLIGHT OPERATIONS CENTER</h2>
            <div className="text-dim">Session: {new Date().toUTCString().slice(0, 25)} UTC</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className={`status-dot ${wsStatus === "connected" ? "" : "offline"}`} />
            <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{wsStatus === "connected" ? "LIVE DATA" : "SIMULATION"}</span>
          </div>
        </div>

        {/* TELEMETRY TAB */}
        {activeTab === "telemetry" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Gauge */}
              <div className="card flex-center" style={{ flexDirection: "column", padding: "2rem" }}>
                <div className="card-title">◈ Crash Probability</div>
                <ProbabilityGauge value={displayPred?.prediction_probability || 0} size={220} />
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <div className="text-dim">Confidence</div>
                  <div style={{ fontFamily: "var(--font-hd)", color: "var(--accent)", fontSize: "1.1rem" }}>
                    {((displayPred?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Live Telemetry Grid */}
              <div className="card">
                <div className="card-title">◈ Live Parameters</div>
                <div className="telem-grid">
                  {liveTelem ? [
                    { label: "Altitude", value: liveTelem.altitude?.toFixed(0), unit: "ft" },
                    { label: "Airspeed", value: liveTelem.velocity?.toFixed(0), unit: "kts" },
                    { label: "Vert Speed", value: liveTelem.vertical_speed?.toFixed(0), unit: "fpm", color: liveTelem.vertical_speed < -1500 ? "var(--danger)" : undefined },
                    { label: "Horiz Speed", value: liveTelem.horizontal_speed?.toFixed(0), unit: "kts" },
                    { label: "Pitch", value: liveTelem.pitch_angle?.toFixed(1), unit: "°" },
                    { label: "Roll", value: liveTelem.roll_angle?.toFixed(1), unit: "°" },
                    { label: "G-Force", value: liveTelem.g_force?.toFixed(2), unit: "G", color: liveTelem.g_force > 3 ? "var(--warn)" : undefined },
                    { label: "Fuel", value: liveTelem.fuel_level?.toFixed(1), unit: "%", color: liveTelem.fuel_level < 15 ? "var(--danger)" : "var(--accent2)" },
                    { label: "Wind", value: liveTelem.wind_speed?.toFixed(1), unit: "kts" },
                    { label: "Visibility", value: liveTelem.visibility?.toFixed(1), unit: "SM" },
                    { label: "Engine", value: liveTelem.engine_status ? "NOMINAL" : "FAILED", unit: "", color: liveTelem.engine_status ? "var(--accent2)" : "var(--danger)" },
                  ].map((c, i) => <TelemCell key={i} {...c} />)
                    : <div className="text-dim">Waiting for telemetry…</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PREDICT TAB */}
        {activeTab === "predict" && (
          <div className="predict-layout">
            <div className="card predict-panel">
              <div className="predict-meta">
                <div>
                  <div className="card-title">◈ Telemetry Input</div>
                  <div className="text-dim">Adjust the aircraft state for live preview, then click Predict to save the report.</div>
                </div>
                <div className="predict-meta-chip">{saving ? "Saving report..." : loading ? "Refreshing prediction..." : "Live preview active"}</div>
              </div>
              <div className="predict-scroll">
              <div className="predict-form-grid">
                {predictFields.map(field => (
                  <div key={field.key} className="predict-field">
                    <div className="predict-field-header">
                      <label className="predict-field-label">{field.label}</label>
                      <span className="predict-field-value">
                        {Number(form[field.key]).toFixed(field.step < 1 ? 1 : 0)} {field.unit}
                      </span>
                    </div>
                    <input
                      className="input-range"
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                      style={{ width: "100%", marginBottom: "0.8rem" }}
                    />
                    <input
                      className="input"
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value === "" ? field.min : Number(e.target.value) }))}
                    />
                  </div>
                ))}
                <div className="predict-field" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div className="predict-field-header">
                    <label className="predict-field-label">Engine Status</label>
                    <span className="predict-field-value" style={{ color: form.engine_status ? "var(--accent2)" : "var(--danger)" }}>
                      {form.engine_status ? "Operational" : "Failed"}
                    </span>
                  </div>
                  <select className="input" value={String(form.engine_status)} onChange={e => setForm(prev => ({ ...prev, engine_status: e.target.value === "true" }))}>
                    <option value="true">Operational</option>
                    <option value="false">Failed</option>
                  </select>
                  <div className="text-dim" style={{ fontSize: "0.76rem", marginTop: "0.75rem" }}>
                    Switching engine state recalculates the safety envelope immediately.
                  </div>
                </div>
              </div>
              </div>
            </div>
            <div>
              <div className="card predict-result-card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-title">◈ Prediction Result</div>
                {manualResult ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                      <ProbabilityGauge value={manualResult.prediction_probability} size={200} />
                    </div>
                    <div className="predict-summary">
                      <div style={{ background: "var(--bg3)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div className="text-dim" style={{ marginBottom: "4px" }}>Risk Score</div>
                        <div style={{ fontFamily: "var(--font-hd)", fontSize: "1.5rem", color: riskCfg.color }}>{manualResult.risk_score}/5</div>
                      </div>
                      <div style={{ background: "var(--bg3)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div className="text-dim" style={{ marginBottom: "4px" }}>Confidence</div>
                        <div style={{ fontFamily: "var(--font-hd)", fontSize: "1.5rem", color: "var(--accent)" }}>{(manualResult.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <RiskBadge level={manualResult.risk_level} />
                    </div>
                    <div>
                      {manualResult.recommendations.map((r, i) => (
                        <div key={i} className="rec-item">
                          <div className="rec-dot" style={{ background: riskCfg.color }} />
                          <span style={{ fontSize: "0.83rem", color: "var(--text2)" }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-dim" style={{ textAlign: "center", padding: "2rem 0" }}>
                    Adjust any field to generate a live prediction preview.
                  </div>
                )}
              </div>
              <div className="predict-actions">
                <button className="btn btn-primary" onClick={savePredictionReport} disabled={saving || loading}>
                  {saving ? "Saving..." : "Predict"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPLAIN TAB */}
        {activeTab === "explain" && (
          <div className="card">
            <div className="card-title">◈ Feature Importance — Random Forest Model</div>
            {explainData ? (
              <>
                <div style={{ marginBottom: "1rem", color: "var(--text2)", fontSize: "0.83rem" }}>
                  Model: {explainData.model_version} · {explainData.total_features} features analyzed
                </div>
                {explainData.feature_importances.map((f, i) => (
                  <FeatureBar key={i} name={f.feature} value={f.importance} description={f.description} />
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <button className="btn btn-primary" onClick={loadExplain}>Load Feature Analysis</button>
              </div>
            )}
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeTab === "recommendations" && (
          <div className="card">
            <div className="card-title">◈ AI Recommendations</div>
            {displayPred?.recommendations?.length > 0 ? (
              <div>
                <div style={{ marginBottom: "1.5rem" }}><RiskBadge level={risk} /></div>
                {displayPred.recommendations.map((r, i) => (
                  <div key={i} className="rec-item" style={{ padding: "1rem 0" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: riskCfg.color, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.7 }}>{r}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-dim" style={{ textAlign: "center", padding: "2rem" }}>Run a prediction to see AI recommendations</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SIMULATION PAGE ──────────────────────────────────────────────────────────
function SimulationPage() {
  const SIM_FRAMES = 120;
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);

  const generateScenario = useCallback(() => {
    const frames = [];
    let alt = 3000, vs = -400, vel = 145, fuel = 68, wind = 10;
    for (let i = 0; i < SIM_FRAMES; i++) {
      alt = Math.max(0, alt + vs / 60 + (Math.random() - 0.5) * 15);
      vs = Math.max(-2500, Math.min(200, vs + (Math.random() - 0.5) * 80));
      vel = Math.max(90, Math.min(180, vel + (Math.random() - 0.5) * 3));
      fuel = Math.max(0, fuel - 0.06);
      wind = Math.max(0, wind + (Math.random() - 0.5) * 2);
      const pitch = -3 + (Math.random() - 0.5) * 4;
      const roll = (Math.random() - 0.5) * 8;
      const gf = 1 + (Math.random() - 0.5) * 0.2;
      // Compute risk proxy
      let riskScore = 0;
      if (alt < 200 && vs < -1500) riskScore += 3;
      if (Math.abs(pitch) > 15) riskScore += 2;
      if (fuel < 10) riskScore += 3;
      if (wind > 35) riskScore += 2;
      const prob = Math.min(0.95, riskScore / 10 + Math.random() * 0.05);
      frames.push({ alt, vs, vel, fuel, wind, pitch, roll, gf, prob, frame: i });
    }
    return frames;
  }, []);

  const [scenario] = useState(() => generateScenario());
  const current = scenario[frame] || scenario[0];
  const riskKey = current.prob < 0.15 ? "NOMINAL" : current.prob < 0.35 ? "ADVISORY" : current.prob < 0.55 ? "CAUTION" : current.prob < 0.75 ? "WARNING" : "CRITICAL";

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setFrame(f => { if (f >= SIM_FRAMES - 1) { setPlaying(false); return f; } return f + 1; });
      }, 100 / speed);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed]);

  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>SIMULATION ENGINE</div>
          <h1>Flight <span className="text-accent">Scenario</span> Replay</h1>
          <p>Replay and analyze simulated approach scenarios with real-time risk visualization.</p>
        </div>

        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          <div className="card flex-center" style={{ flexDirection: "column" }}>
            <div className="card-title">◈ Risk Probability</div>
            <ProbabilityGauge value={current.prob} size={200} />
            <div style={{ marginTop: "1rem" }}><RiskBadge level={riskKey} /></div>
          </div>
          <div className="card">
            <div className="card-title">◈ Approach Parameters</div>
            <div className="telem-grid">
              <TelemCell label="Altitude" value={current.alt.toFixed(0)} unit="ft" />
              <TelemCell label="Vert Speed" value={current.vs.toFixed(0)} unit="fpm" color={current.vs < -1500 ? "var(--danger)" : undefined} />
              <TelemCell label="Airspeed" value={current.vel.toFixed(0)} unit="kts" />
              <TelemCell label="Fuel" value={current.fuel.toFixed(1)} unit="%" color={current.fuel < 15 ? "var(--danger)" : "var(--accent2)"} />
              <TelemCell label="Wind" value={current.wind.toFixed(1)} unit="kts" />
              <TelemCell label="Pitch" value={current.pitch.toFixed(1)} unit="°" />
              <TelemCell label="Roll" value={current.roll.toFixed(1)} unit="°" />
              <TelemCell label="G-Force" value={current.gf.toFixed(2)} unit="G" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-title">◈ Mission Timeline Replay</div>
          <div className="sim-timeline">
            <div className="sim-progress" style={{ width: `${(frame / (SIM_FRAMES - 1)) * 100}%` }} />
            <div className="sim-track" />
            <div className="sim-needle" style={{ left: `${(frame / (SIM_FRAMES - 1)) * 100}%` }} />
            {/* Risk dots */}
            {scenario.filter((_, i) => i % 10 === 0).map((f, i) => {
              const c = f.prob < 0.15 ? "#00ff9d" : f.prob < 0.35 ? "#ffe500" : f.prob < 0.55 ? "#ff9500" : f.prob < 0.75 ? "#ff4500" : "#ff0033";
              return <div key={i} style={{ position: "absolute", bottom: "12px", left: `${(i * 10 / (SIM_FRAMES - 1)) * 100}%`, width: "8px", height: "8px", borderRadius: "50%", background: c, transform: "translateX(-50%)" }} />;
            })}
          </div>
          <input type="range" className="input-range" style={{ width: "100%", marginBottom: "1rem" }}
            min={0} max={SIM_FRAMES - 1} value={frame} onChange={e => setFrame(Number(e.target.value))} />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm" onClick={() => setPlaying(!playing)}>
              {playing ? "⏸ Pause" : "▶ Play"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFrame(0); setPlaying(false); }}>⏮ Reset</button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="text-dim" style={{ fontSize: "0.78rem" }}>Speed:</span>
              {[0.5, 1, 2, 4].map(s => (
                <button key={s} className="btn btn-sm" onClick={() => setSpeed(s)}
                  style={{ background: speed === s ? "var(--accent)" : "transparent", color: speed === s ? "#000" : "var(--text2)", border: "1px solid var(--border)", padding: "4px 10px" }}>
                  {s}×
                </button>
              ))}
            </div>
            <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text2)" }}>
              Frame {frame + 1} / {SIM_FRAMES}
            </div>
          </div>
        </div>

        {/* Risk curve */}
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-title">◈ Risk Probability Curve</div>
          <svg viewBox={`0 0 1000 120`} style={{ width: "100%", height: "120px" }}>
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff0033" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff0033" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M${scenario.map((f, i) => `${(i / (SIM_FRAMES - 1)) * 1000},${110 - f.prob * 100}`).join(" L")} L1000,110 L0,110 Z`} fill="url(#curveGrad)" />
            <polyline points={scenario.map((f, i) => `${(i / (SIM_FRAMES - 1)) * 1000},${110 - f.prob * 100}`).join(" ")}
              fill="none" stroke="#ff3355" strokeWidth="2" />
            <line x1={(frame / (SIM_FRAMES - 1)) * 1000} y1="0" x2={(frame / (SIM_FRAMES - 1)) * 1000} y2="120"
              stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4,4" />
          </svg>
        </div>
      </section>
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("sl_token");
      const res = await fetch(`${API_BASE}/api/history`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const downloadCSV = () => {
    if (!records.length) return;
    const headers = Object.keys(records[0]).join(",");
    const rows = records.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "safe_land_history.csv"; a.click();
  };

  if (!user) return (
    <div className="page flex-center" style={{ minHeight: "80vh" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
        <div className="card-title">Authentication Required</div>
        <p className="text-dim">Please login to access your flight reports.</p>
      </div>
    </div>
  );

  // Analytics
  const nomCount = records.filter(r => r.risk_level === "NOMINAL").length;
  const critCount = records.filter(r => ["WARNING", "CRITICAL"].includes(r.risk_level)).length;
  const avgProb = records.length ? (records.reduce((a, r) => a + (r.prediction_probability || 0), 0) / records.length * 100).toFixed(1) : 0;

  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>REPORTS</div>
          <h1>Flight <span className="text-accent">Analytics</span> & History</h1>
          <p>Review your prediction history, risk distribution, and export data for further analysis.</p>
        </div>

        {/* Summary */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {[
            { label: "Total Predictions", value: total, color: "var(--accent)" },
            { label: "Nominal Flights", value: nomCount, color: "var(--accent2)" },
            { label: "High-Risk Events", value: critCount, color: "var(--danger)" },
            { label: "Avg Risk Probability", value: `${avgProb}%`, color: "var(--warn)" },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: "center" }}>
              <div className="text-dim mb-1">{s.label}</div>
              <div style={{ fontFamily: "var(--font-hd)", fontSize: "1.8rem", color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div className="card-title" style={{ margin: 0 }}>◈ Prediction History</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
              <button className="btn btn-primary btn-sm" onClick={downloadCSV} disabled={!records.length}>↓ Export CSV</button>
            </div>
          </div>
          {loading ? (
            <div className="flex-center" style={{ padding: "3rem" }}><div className="spinner" /></div>
          ) : records.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Date/Time</th><th>Alt (ft)</th><th>Speed (kts)</th>
                    <th>V/S (fpm)</th><th>Fuel %</th><th>Probability</th><th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--text2)" }}>{r.id}</td>
                      <td style={{ fontSize: "0.78rem" }}>{new Date(r.created_at).toLocaleString()}</td>
                      <td>{r.altitude?.toFixed(0)}</td>
                      <td>{r.velocity?.toFixed(0)}</td>
                      <td style={{ color: r.vertical_speed < -1500 ? "var(--danger)" : undefined }}>
                        {r.vertical_speed?.toFixed(0)}
                      </td>
                      <td>{r.fuel_level?.toFixed(1)}</td>
                      <td style={{ fontFamily: "var(--font-hd)", fontSize: "0.82rem" }}>
                        {r.prediction_probability ? `${(r.prediction_probability * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td>{r.risk_level ? <RiskBadge level={r.risk_level} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-center" style={{ padding: "3rem", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>📋</div>
              <div className="text-dim">No predictions recorded yet. Run your first prediction from the Dashboard.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="page-header">
          <div className="tag" style={{ marginBottom: "1rem" }}>CONTACT</div>
          <h1>Get in <span className="text-accent">Touch</span></h1>
          <p>Questions about the platform, API integration, or enterprise deployment? We're here to help.</p>
        </div>

        <div className="grid-2">
          <div>
            {/* Contact form */}
            <div className="card contact-form" style={{ maxWidth: "100%" }}>
              <div className="card-title">◈ Send Message</div>
              {sent ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                  <div style={{ fontFamily: "var(--font-hd)", color: "var(--accent2)", marginBottom: "0.5rem" }}>MESSAGE TRANSMITTED</div>
                  <div className="text-dim">We'll respond within 24 hours.</div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: "1rem" }} onClick={() => setSent(false)}>Send Another</button>
                </div>
              ) : (
                <div>
                  {["name", "email", "subject"].map(field => (
                    <div key={field} className="input-group">
                      <label className="input-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input className="input" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={field === "email" ? "you@example.com" : ""} />
                    </div>
                  ))}
                  <div className="input-group">
                    <label className="input-label">Message</label>
                    <textarea className="input" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ resize: "vertical" }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>Send Message →</button>
                </div>
              )}
            </div>
          </div>

          <div>
            {/* Developer profiles */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-title">◈ Development Team</div>
              {[
                { initials: "SL", name: "SAFE-LAND-AI Core Team", role: "Platform Architecture & ML Engineering", email: "team@safeland.ai" },
                { initials: "AV", name: "Aviation Safety Division", role: "Domain Expertise & Risk Modeling", email: "safety@safeland.ai" },
              ].map((dev, i) => (
                <div key={i} className="dev-card" style={{ marginBottom: i === 0 ? "1rem" : 0 }}>
                  <div className="dev-avatar">{dev.initials}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-hd)", fontSize: "0.8rem", color: "var(--text)", letterSpacing: "1px", marginBottom: "3px" }}>{dev.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text2)", marginBottom: "6px" }}>{dev.role}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{dev.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">◈ Quick Links</div>
              {[
                { label: "API Documentation", href: "#" },
                { label: "GitHub Repository", href: "#" },
                { label: "Docker Image", href: "#" },
                { label: "OpenAPI Spec (JSON)", href: `${API_BASE}/openapi.json` },
                { label: "Interactive API Docs", href: `${API_BASE}/docs` },
              ].map((link, i) => (
                <a key={i} href={link.href} target="_blank" rel="noreferrer"
                  style={{ display: "block", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "var(--accent2)"}
                  onMouseLeave={e => e.target.style.color = "var(--accent)"}>
                  → {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div style={{ marginBottom: "0.5rem" }}>
        <strong>SAFE-LAND-AI</strong>
      </div>
      <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        {["Home", "About", "Resources", "Documentation", "Dashboard", "Contact"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "0.8rem" }}>{p}</button>
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
        © {new Date().getFullYear()} SAFE-LAND-AI Aviation Intelligence Platform · Built with FastAPI + React + Random Forest
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("Home");
  const [user, setUser] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const wsRef = useRef(null);

  // Theme toggle
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // Auth
  useEffect(() => {
    const token = localStorage.getItem("sl_token");
    if (token) {
      fetch(`${API_BASE}/auth/me`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUser(data); })
        .catch(() => {});
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("sl_token");
    localStorage.removeItem("sl_refresh");
    setUser(null);
    setPage("Home");
  };

  // WebSocket
  useEffect(() => {
    let alive = true;
    let retryTimeout;

    const connect = () => {
      if (!alive) return;
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) return;
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => { if (alive) setWsStatus("connected"); };
        ws.onmessage = (e) => {
          if (!alive) return;
          try {
            const data = JSON.parse(e.data);
            setTelemetry(data);
            setPrediction({
              prediction_probability: data.prediction_probability,
              risk_level: data.risk_level,
              risk_score: data.risk_score,
              recommendations: data.recommendations,
              confidence: data.confidence,
            });
          } catch {}
        };
        ws.onclose = () => {
          if (wsRef.current === ws) wsRef.current = null;
          if (alive) {
            setWsStatus("disconnected");
            retryTimeout = setTimeout(connect, 3000);
          }
        };
        ws.onerror = () => ws.close();
      } catch {
        if (alive) retryTimeout = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => { alive = false; clearTimeout(retryTimeout); wsRef.current?.close(); };
  }, []);

  // User context value
  const authVal = { user, setUser, logout };
  const themeVal = { theme, toggleTheme };

  const renderPage = () => {
    switch (page) {
      case "Home":          return <HomePage setPage={setPage} telemetry={telemetry} prediction={prediction} />;
      case "About":         return <AboutPage />;
      case "Resources":     return <ResourcesPage />;
      case "Documentation": return <DocumentationPage />;
      case "Dashboard":     return <DashboardPage telemetry={telemetry} prediction={prediction} wsStatus={wsStatus} />;
      case "Simulation":    return <SimulationPage />;
      case "Reports":       return <ReportsPage />;
      case "Contact":       return <ContactPage />;
      default:              return <HomePage setPage={setPage} telemetry={telemetry} prediction={prediction} />;
    }
  };

  return (
    <ThemeContext.Provider value={themeVal}>
      <AuthContext.Provider value={authVal}>
        <div className={`app ${theme}`}>
          <StyleInjector />
          <Topbar page={page} setPage={setPage} wsStatus={wsStatus} />
          {telemetry && <LiveTicker telemetry={telemetry} />}
          <main>{renderPage()}</main>
          <Footer setPage={setPage} />
        </div>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}



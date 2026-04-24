import React, { useRef, useEffect, useState } from 'react';

// ── Radar geometry ─────────────────────────────────────────────────────────────
const CX = 50, CY = 50, R = 44;
const SWEEP_DEG_PER_SEC = 45;

const toXY = (deg, radius = R) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
};

const sector = (startDeg, endDeg, radius = R) => {
  const [x1, y1] = toXY(startDeg, radius);
  const [x2, y2] = toXY(endDeg, radius);
  const large = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
};

// ── Static data ────────────────────────────────────────────────────────────────
const CONTACTS = [
  { id: 'GRP-01', deg: 335, r: 18, color: '#22d3ee', type: 'FRIENDLY' },
  { id: 'UNK-22', deg: 48,  r: 30, color: '#f472b6', type: 'UNKNOWN'  },
  { id: 'GRP-02', deg: 200, r: 25, color: '#22d3ee', type: 'FRIENDLY' },
  { id: 'HOT-07', deg: 78,  r: 36, color: '#ef4444', type: 'HOSTILE'  },
];

const CONTROLS = [
  { symbol: '+',  label: 'ZOOM' },
  { symbol: '−',  label: 'ZOOM' },
  { symbol: '◎',  label: 'SCAN' },
  { symbol: '⌖',  label: 'MARK' },
  { symbol: '≡',  label: 'MENU' },
];

const BOTTOM_CARDS = [
  { label: 'IFF',         value: 'NO REPLY', color: '#f87171' },
  { label: 'FLIGHT PLAN', value: 'NONE',     color: '#f87171' },
  { label: 'COMMS',       value: 'GUARD',    color: '#fbbf24' },
  { label: 'DIST 12NM',   value: '11.8 NM',  color: '#f87171' },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function TacticalRadarUI() {
  const [sweep, setSweep] = useState(0);
  const [zulu, setZulu]   = useState('');
  const rafRef  = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (prevRef.current != null) {
        const dt = ts - prevRef.current;
        setSweep(s => (s + SWEEP_DEG_PER_SEC * dt / 1000) % 360);
      }
      prevRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const fmtZulu = () => setZulu(new Date().toISOString().slice(11, 19) + 'Z');
    fmtZulu();
    const clock = setInterval(fmtZulu, 1000);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(clock);
    };
  }, []);

  const [leadX, leadY] = toXY(sweep);

  return (
    // ── Outer grid: map panel | 320 px source summary ──────────────────────────
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: '24px',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#05090f',
        fontFamily: 'monospace',
        userSelect: 'none',
      }}
    >

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT: Main map / radar panel
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '24px', minWidth: 0 }}>

        {/* Top-left status label */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(34,211,238,0.45)', textTransform: 'uppercase' }}>
            Tactical Overwatch
          </div>
          <div style={{ fontSize: 14, letterSpacing: '0.15em', color: '#22d3ee', fontWeight: 600 }}>
            ZONE ALPHA / BALTIC
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(34,211,238,0.35)' }}>
            {zulu}
          </div>
        </div>

        {/* Top-right DATALINK box */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(34,211,238,0.28)',
            background: 'rgba(8,47,73,0.5)',
            padding: '6px 12px',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 6px #34d399',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#67e8f9', textTransform: 'uppercase' }}>
              Datalink Synced
            </span>
          </div>
        </div>

        {/* Radar — centered in map panel, responsive size */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(420px, 55vw, 620px)',
            height: 'clamp(420px, 55vw, 620px)',
            filter: 'drop-shadow(0 0 28px rgba(34,211,238,0.14))',
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <defs>
              <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="radarBound">
                <circle cx={CX} cy={CY} r={R} />
              </clipPath>
            </defs>

            {/* Radar face */}
            <circle cx={CX} cy={CY} r={R} fill="rgba(5,9,15,0.98)" />

            {/* Concentric rings × 3 */}
            {[R / 3, (R * 2) / 3, R].map((rr, i) => (
              <circle key={i} cx={CX} cy={CY} r={rr} fill="none"
                stroke={`rgba(34,211,238,${0.07 + i * 0.06})`} strokeWidth="0.35" />
            ))}

            {/* Cardinal axis lines */}
            <line x1={CX} y1={CY - R} x2={CX} y2={CY + R}
              stroke="rgba(34,211,238,0.11)" strokeWidth="0.3" />
            <line x1={CX - R} y1={CY} x2={CX + R} y2={CY}
              stroke="rgba(34,211,238,0.11)" strokeWidth="0.3" />
            {/* Diagonal lines — fainter */}
            <line x1={CX - R * 0.707} y1={CY - R * 0.707}
              x2={CX + R * 0.707} y2={CY + R * 0.707}
              stroke="rgba(34,211,238,0.05)" strokeWidth="0.2" />
            <line x1={CX + R * 0.707} y1={CY - R * 0.707}
              x2={CX - R * 0.707} y2={CY + R * 0.707}
              stroke="rgba(34,211,238,0.05)" strokeWidth="0.2" />

            {/* Radar sweep — clipped to circle */}
            <g clipPath="url(#radarBound)">
              <path d={sector(sweep - 45, sweep)} fill="rgba(34,211,238,0.055)" />
              <path d={sector(sweep - 20, sweep)} fill="rgba(34,211,238,0.10)"  />
              <line x1={CX} y1={CY} x2={leadX} y2={leadY}
                stroke="rgba(34,211,238,0.75)" strokeWidth="0.55" filter="url(#glow)" />
            </g>

            {/* Outer border ring */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke="rgba(34,211,238,0.24)" strokeWidth="0.5" />

            {/* Center pip */}
            <circle cx={CX} cy={CY} r="0.7"
              fill="rgba(34,211,238,0.7)" filter="url(#glow)" />

            {/* Aircraft contacts */}
            {CONTACTS.map(({ id, deg, r: cr, color }) => {
              const [ax, ay] = toXY(deg, cr);
              const labelLeft = ax > CX;
              const lbX = labelLeft ? ax - 14.5 : ax + 2.8;
              const lbY = ay - 3.2;
              return (
                <g key={id} filter="url(#glow)">
                  <circle cx={ax} cy={ay} r="2.5"
                    fill="none" stroke={color} strokeWidth="0.4" opacity="0.45" />
                  <circle cx={ax} cy={ay} r="1.1" fill={color} opacity="0.95" />
                  <rect x={lbX} y={lbY} width="11.5" height="6"
                    fill="rgba(0,0,0,0.84)" stroke={color} strokeWidth="0.25" rx="0.5" />
                  <text x={lbX + 1} y={lbY + 4.3}
                    fontSize="2.6" fill={color} fontFamily="monospace" fontWeight="700">
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom info cards — absolute, 4-column grid, stays inside map panel */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {BOTTOM_CARDS.map(({ label, value, color }) => (
            <div key={label} style={{
              border: '1px solid rgba(51,65,85,0.8)',
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 12px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT: Source Summary — 320 px sibling in outer grid
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '320px',
          minWidth: '320px',
          maxWidth: '320px',
          height: '100%',
          overflowY: 'auto',
          padding: '20px',
          borderLeft: '1px solid rgba(34,211,238,0.10)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Panel header */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(34,211,238,0.50)', textTransform: 'uppercase', marginBottom: 8 }}>
            Source Summary
          </div>
          <div style={{ height: 1, background: 'rgba(34,211,238,0.12)' }} />
        </div>

        {/* Active contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(34,211,238,0.40)', textTransform: 'uppercase' }}>
            Active Contacts
          </div>
          {CONTACTS.map(({ id, deg, color, type }) => (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid rgba(30,41,59,0.9)',
              background: 'rgba(2,6,23,0.7)',
              padding: '8px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, letterSpacing: '0.12em', color, fontWeight: 700 }}>{id}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.15em', color: '#475569', textTransform: 'uppercase' }}>{type}</span>
                <span style={{ fontSize: 9, color: '#334155' }}>{deg}°</span>
              </div>
            </div>
          ))}
        </div>

        {/* Threat status block */}
        <div style={{
          border: '1px solid rgba(239,68,68,0.20)',
          background: 'rgba(127,29,29,0.10)',
          padding: '12px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(248,113,113,0.70)', textTransform: 'uppercase' }}>
            Threat Status
          </div>
          {[
            { k: 'IFF',   v: 'NO REPLY',      c: '#f87171' },
            { k: 'Mode',  v: 'UNCOOPERATIVE',  c: '#f87171' },
            { k: 'Track', v: 'HOT-07 CLOSING', c: '#fbbf24' },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <span style={{ color: '#475569' }}>{k}</span>
              <span style={{ color: c, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(34,211,238,0.08)' }} />

        {/* Control buttons — 48×48, centered, gap 12 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(34,211,238,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>
            Controls
          </div>
          {CONTROLS.map(({ symbol, label }, i) => (
            <button
              key={i}
              style={{
                width: 48, height: 48,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3,
                border: '1px solid rgba(34,211,238,0.22)',
                background: 'rgba(34,211,238,0.03)',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34,211,238,0.10)';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.50)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(34,211,238,0.03)';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.22)';
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: '#22d3ee' }}>{symbol}</span>
              <span style={{ fontSize: 7, letterSpacing: '0.15em', color: 'rgba(34,211,238,0.45)', textTransform: 'uppercase' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

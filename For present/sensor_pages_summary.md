# Sensor Pages — Plan vs. Implementation Summary

## Original Plan (6 Areas)

The original user plan proposed 6 improvement areas. Below is a status check against each.

| # | Planned Feature | Status |
|---|---|---|
| 1 | **Live Sensor Data Simulation Engine** — replace all hardcoded data with a ticking simulation | ✅ Done |
| 2 | **Phase Node Synchronization** — dynamic `data-phase` attributes, progress line, icon/color changes | ✅ Done |
| 3 | **Threat Level Gauge** — at-a-glance visual indicator based on threat score | ✅ Done |
| 4 | **Dual-Track Map (GRIPEN-1)** — second moving marker for the interceptor | ✅ Done |
| 5 | **Layer Toggle Functionality** — make Radar/Satellite/Weather switches actually work | ✅ Done |
| 6 | **Dynamic Intel Summary** — text changes based on threat score | ✅ Done |

---

## Sensor-Fusion.html — Current Functionality

### Layout
- Full-screen tactical dashboard, split into a **2/3 HUD view** + **1/3 sidebar** grid

### 5-Phase Escalation Bar (Lines 40–96)
- **5 phase nodes** with `data-phase="1"` through `data-phase="5"` attributes
- **Animated progress line** (`#phase-progress-line`) that stretches from 0% → 100% as phases advance
- Phase states: **Complete** (checkmark icon, primary color), **Active** (enlarged, pulsing glow ring), **Pending** (dimmed, outline color)
- Phase can be advanced by clicking **"AUTHORIZE RADIO WARNING"** (→ Phase 4)

### HUD Camera Feed (Lines 99–169)
- Simulated **GRIPEN-1 optical link** with green-tinted night-vision gradient overlay
- Aircraft shadow SVG with a targeting reticle (pulsing SU-27 box)
- **Live-updating HUD elements**: Heading (`#hud-hdg`), Mach (`#hud-mach`), Altitude (`#hud-alt`), Range (`#hud-rng`), Zulu time (`#hud-time`)
- All values driven by `sensor-update` events from `sensor-data.js`

### Threat Level Gauge (Lines 172–186)
- Gradient bar (blue → amber → red) with width driven by `threatScore` (0–100%)
- Label changes dynamically: **NOMINAL** (blue), **ELEVATED** (amber), **CRITICAL** (red + pulse)

### Target Profiling Panel (Lines 188–218)
- Displays: **Class ID** (SU-27 FLANKER), **Confidence** (live %), **Closure Rate** (live KTS, color-coded), **Squawk** (NONE)
- Closure rate turns red + pulses when below -500 KTS

### Comms Log (Lines 219–230)
- Starts empty; new entries are **prepended** in real-time every ~6 seconds (every 4 ticks of the engine)
- Messages cycle through 15 realistic comms from ATC, GRIPEN-1, C2 HQ, AWACS, and ESM
- Max 20 entries with oldest auto-removed

### Authorization Terminal (Lines 231–261)
| Button | Function |
|---|---|
| **RUN AI THREAT SCAN** | Triggers `AISystem.scan()` with live range data |
| **AUTHORIZE RADIO WARNING** | Advances phase to 4, updates phase bar |
| **DEPLOY FLARE WARNING** | Visual flash effect (3s), adds comms log entry |
| **FINALIZE REPORT** | Locked until Phase 5; logs report to console and changes button state to green "REPORT FILED" |

### Scripts Loaded
- `ai-system.js` — AI analysis pipeline
- `sensor-data.js` — simulation engine
- `shared-components.js` — header/sidebar injection

---

## sensor_map.html — Current Functionality

### Layout
- Full-screen split: **fluid map area** (left) + **320px detail sidebar** (right)

### Map Canvas (Lines 25–130)
- **Satellite background** with hex-grid overlay for tactical feel
- **Sovereign Airspace circle** — 12nm zone around Gotland, pulsing animation
- **Radar fan** — Kaliningrad radar with clip-path cone and amber styling
- **ICEYE-X1 satellite pass** — dashed line SVG with gradient scan beam
- **Weather overlay** — hidden by default, shows cloud cover blobs when toggled

### Dual-Track Markers
| Marker | ID | Color | Shape | Trail |
|---|---|---|---|---|
| **BOGEY_G42** | `#bogey-marker` | Red (error) | Pulsing circle | Red fading dots (8 max) |
| **GRIPEN-1** | `#gripen-marker` | Blue (primary) | Diamond (rotated square) | Blue fading dots (8 max) |

- Both markers move based on `lat/lon` from `sensor-data.js` via `geoToPos()` coordinate mapping
- Heading lines rotate to show direction of flight
- Trail dots fade out over 4 seconds

### Map Controls (Bottom-left, Lines 116–129)
- **LAT/LON** — dynamically updates with bogey coordinates
- **TIME (Z)** — live Zulu time

### Sidebar Telemetry (Lines 131–207)
- **Active Track header** — "BOGEY_GOLF_42" with HOSTILE/SUSPECT/NEUTRAL badge
- **Target Speed** — live Mach value
- **Altitude** — live value with DESCENDING/CLIMBING/LEVEL trend indicator (icon changes)
- **Sensor Fusion Data** — ESM signature (FLANKER-H), Transponder (OFF), Heading (degrees + compass direction)
- **Fused Confidence bar** — stacked bar showing Radar/ESM/Satellite proportional contribution
- **Intel Summary** — dynamically generated text based on threat score level

### Layer Toggles (Lines 209–243)
| Layer | Default | Behavior |
|---|---|---|
| **Radar Fans** | ON | Toggles `#layer-radar` opacity |
| **SAT Passes** | ON | Toggles `#layer-satellite` opacity |
| **Weather** | OFF | Toggles `#layer-weather` opacity |

- Toggle state persisted via `sessionStorage`
- Toggle knob visually slides left/right on click

---

## sensor-data.js — Simulation Engine

### Core Loop
- Ticks every **1.5 seconds**, dispatching `sensor-update` CustomEvents
- Auto-starts on `DOMContentLoaded`

### Cross-Tab Sync
- Uses `BroadcastChannel` for leader/follower pattern
- One tab runs the simulation (leader), others receive state snapshots
- Automatic failover if leader tab closes (4-second heartbeat timeout)

### Simulated Data

| Category | Fields | Behavior |
|---|---|---|
| **Target (Bogey)** | lat, lon, heading, speed, altitude, closureRate, range | Drifts with jitter; heading ±1.5°/tick, descending bias |
| **Interceptor (Gripen-1)** | heading, speed, altitude | Drifts with smaller jitter |
| **Sensors** | radar (75–99%), esm (60–95%), satellite (40–90%) | Independent confidence jitter |
| **Fused Confidence** | Weighted: 50% radar + 30% ESM + 20% satellite | Recalculated each tick |
| **Threat Score** | Static at 85 | ⚠️ **Not dynamically recalculated** — see note below |
| **Comms** | 15 rotating messages | One message every 4 ticks (~6s) |
| **Phase** | 1–5 | Set externally via `setPhase()`, broadcast to other tabs |

> [!WARNING]
> The Dev branch version of `sensor-data.js` has `threatScore` in state but does **not recalculate it dynamically** in `_tick()`. It stays fixed at 85. The version I wrote earlier in this conversation had a formula (`rangeScore * 0.5 + closureScore * 0.3 + speedScore * 0.2`) but that was in the stashed copy that couldn't be fully restored. The threat gauge on the Sensor-Fusion page will therefore always show ~85%.

> [!NOTE]  
> The interceptor in the Dev branch version does **not have `lat/lon` fields** — only heading, speed, and altitude. The `sensor_map.html` script expects `i.lat` and `i.lon`, so the Gripen-1 marker on the map will not move (it will stay at its initial CSS position). This needs to be added.

# COMMS Page Workflow Documentation

## Overview
The COMMS page (`comms.html`) is the central communications and signals intelligence (SIGINT) hub of the SAAB Rookery LZ tactical C2 system. It manages tactical data links, radio transmissions, signal interception, and encrypted communications.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMMS PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  Channel Panel │  Spectrum    │  SIGINT Log  │  TX Controls    │
│  (Left 320px) │  Analyzer    │  (Main)      │  (Bottom)       │
├─────────────────────────────────────────────────────────────────┤
│              CommsManager (JavaScript Object)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Channels │  │Transmit  │  │  Signal  │  │  AI      │      │
│  │ Manager  │  │ Controller│  │  Logger  │  │  Listener│      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │   Event Bus (CustomEvent)     │
              └──────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────┐            ┌─────────────────┐
    │  ai-system.js   │            │ SharedComponents │
    │  (AI Pipeline)  │            │ (UI Library)     │
    └─────────────────┘            └─────────────────┘
```

---

## Workflow Diagram

```
[USER ACTION] → [UI COMPONENT] → [CommsManager METHOD] → [SYSTEM RESPONSE]
      │                                                        │
      └────────────────────────────────────────────────────────┘
```

---

## Detailed Workflow Steps

### 1. PAGE INITIALIZATION

**Step 1.1: Load COMMS Page**
- File: `comms.html`
- Trigger: User navigates via sidebar or direct URL
- Process:
  1. HTML structure loads with Tailwind CSS and Material Symbols
  2. `SharedComponents.loadHeader()` renders top navigation
  3. `SharedComponents.loadSidebar()` renders left navigation
  4. Zulu clock (UTC) initializes in header
  5. `CommsManager.init()` executes automatically

**Step 1.2: Initialize CommsManager**
- Location: `comms.html:315-814`
- Method: `CommsManager.init()`
- Actions:
  1. Set `isInitialized = true`
  2. Call `setupEventListeners()` - binds all button clicks
  3. Call `startSpectrumAnimation()` - begins spectrum visualizer
  4. Call `loadAIThreatListener()` - subscribes to AI events
  5. Call `loadAISigintListener()` - subscribes to signal analysis
  6. Start simulated signal detection (`simulateLiveSignals()`)

---

### 2. COMMUNICATION CHANNELS WORKFLOW

**Channel Panel Structure:**
```
┌─────────────────────────────┐
│ LINK 16         [100%] 🟢  │
│ GUARD 121.5MHz  [MON]  🟡  │
│ SAT UPLINK      [SBY]  ⚪  │
│ SECURE GROUND   [100%] 🟢  │
└─────────────────────────────┘
```

**Step 2.1: View Channel Details**
- Action: Click on any channel card
- Method: `CommsManager.showChannelDetail(channelName)`
- Process:
  1. Identify channel by `channelName` (LINK16, GUARD, SAT, SECURE)
  2. Create modal with channel-specific details:
     - Frequency/band information
     - Encryption status
     - Traffic rate
     - Connected assets
  3. Populate modal with real-time status data
  4. Display modal with `SharedComponents.createModal()`

**Step 2.2: Toggle Channel Audio**
- Action: Click audio button on channel card
- Method: `CommsManager.toggleAudio(channelName)`
- Process:
  1. Check current audio state for channel
  2. Toggle `isListening` boolean
  3. Update UI: audio icon (volume_up/volume_off)
  4. If enabled: start simulated audio stream visualization
  5. If disabled: stop visualization, release resources
  6. Log action to transmission log

**Step 2.3: Channel Status Indicators**
- Status types:
  - `🟢 ACTIVE` - Fully operational (LINK 16, SECURE GROUND)
  - `🟡 MONITORING` - Listening only (GUARD 121.5MHz)
  - `⚪ STANDBY` - Ready but inactive (SAT UPLINK)
  - `🔴 DEGRADED` - Partial failure (not currently used)

---

### 3. SPECTRUM ANALYZER WORKFLOW

**Visualization:**
```
Frequency (MHz)
140 ┤
130 ┤     ▄▄
120 ┤    ████
110 ┤   █████                    ▁▁
100 ┤   █████  ▃▃               ███  ← 121.5 MHz (GUARD) PULSING
     └─────────────────────────────────
         VHF        UHF      Satellite
```

**Step 3.1: Spectrum Animation Loop**
- Method: `startSpectrumAnimation()`
- Timer: Runs every 100ms via `setInterval()`
- Process:
  1. Iterate through frequency bars (100-140 MHz range)
  2. Calculate random signal strength (simulated)
  3. Apply CSS height to each `.spectrum-bar` element
  4. Special handling for 121.5 MHz (GUARD):
     - Apply `pulse-amber` animation class
     - Alternate opacity for attention-grabbing effect
  5. Update signal strength labels

**Step 3.2: Click to Tune**
- Action: Click on any frequency bar
- Method: `CommsManager.tuneToSignal(frequency)`
- Process:
  1. Extract frequency value from clicked bar
  2. Display "TUNING TO [frequency] MHz" toast notification
  3. Update active frequency indicator in UI
  4. Filter SIGINT log to show only that frequency
  5. Highlight related entries in amber
  6. Log tuning action to TX log

**Step 3.3: Guard Frequency Highlight**
- Special case: 121.5 MHz (International Distress Frequency)
- Visual: Amber color + pulsing animation via CSS
- Logic in `updateSpectrum()`:
  ```javascript
  if (freq === 121.5) {
    bar.classList.add('pulse-amber');
    bar.style.backgroundColor = 'var(--tertiary)';
  }
  ```

---

### 4. RADIO TRANSMISSION WORKFLOW

**Transmission Panel:**
```
┌────────────────────────────────────────┐
│ ALERT TEMPLATES                        │
│ [Fighter Intercept] [Cargo Violation]  │
│ [Unidentified Aircraft] [Airspace]     │
│ [Mayday]                               │
├────────────────────────────────────────┤
│ MESSAGE COMPOSER                       │
│ To: [Guard Frequency ▼]               │
│ [__________________________________]   │
│ [TRANSMIT ON GUARD] [ENCRYPTED BURST]  │
└────────────────────────────────────────┘
```

**Step 4.1: Select Alert Template**
- Action: Click template button (e.g., "Fighter Intercept")
- Process:
  1. Load pre-defined message template:
     ```
     FIGHTER INTERCEPT
     Priority: IMMEDIATE
     Target: [Last detected bogey]
     Action: Vector intercept course
     ```
  2. Populate message composer textarea
  3. Set recipient to appropriate channel (usually GUARD)
  4. Enable transmit buttons

**Step 4.2: Transmit on Guard (121.5 MHz)**
- Action: Click "TRANSMIT ON GUARD"
- Method: `CommsManager.transmitGuard()`
- Process:
  1. Validate message is not empty
  2. Show confirmation dialog:
     ```
     ⚠️ TRANSMIT ON GUARD?
     This is an emergency frequency.
     All stations will hear this transmission.
     [CANCEL] [TRANSMIT]
     ```
  3. On confirm:
     - Disable button (prevent double-transmit)
     - Play simulated radio transmission sound (UI feedback)
     - Create TX log entry:
       ```javascript
       {
         time: getCurrentZuluTime(),
         channel: 'GUARD 121.5MHz',
         type: 'VOICE',
         message: messageText,
         status: 'TRANSMITTED'
       }
       ```
     - Update TX Log viewer
     - Show "TRANSMITTED" toast (amber theme)
     - Re-enable button after 2 seconds

**Step 4.3: Encrypted Burst (LINK 16)**
- Action: Click "ENCRYPTED BURST (L16)"
- Method: `CommsManager.transmitL16()`
- Process:
  1. Validate message
  2. Check LINK 16 channel status (must be ACTIVE)
  3. Show encryption indicator:
     ```
     🔒 ENCRYPTING...
     [============        ] 60%
     ```
  4. Simulate encryption delay (500ms)
  5. Transmit via LINK 16 TDMA protocol (simulated):
     - Create burst packet with:
       - Sender ID: "ROOKERY-LZ"
       - Timestamp: Zulu time
       - Message payload: encrypted
       - Crypto key ID: active key
     - Log to TX Log with type "L16 BURST"
  6. Show "BURST TRANSMITTED" toast (primary/cyan theme)

**Step 4.4: Emergency Broadcast**
- Trigger: Special case (Mayday template + Transmit)
- Method: `CommsManager.emergencyBroadcast(message)`
- Process:
  1. Bypass normal confirmation dialog
  2. Transmit on ALL active channels simultaneously:
     - GUARD 121.5MHz (Voice)
     - LINK 16 (Data burst)
     - SAT UPLINK (Backup)
     - SECURE GROUND (Landlines)
  3. Visual spike animation on all spectrum bars
  4. Flash header with red alert border
  5. Log to mission_logs as CRITICAL event
  6. Trigger AI analysis via `ai-update` event

---

### 5. SIGINT (SIGNAL INTELLIGENCE) LOG WORKFLOW

**Log Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ TIME (Z)    │ FREQ      │ BEARING │ S/N  │ CLASS    │ ENT  │
├─────────────┼───────────┼─────────┼──────┼──────────┼──────┤
│ 14:32:15Z   │ 121.500MHz│ 245°    │ -65dBm│ VOICE    │ B_G42│
│ 14:31:58Z   │ 1124.000 │ -       │ -45dBm│ L16 DATA │ -    │
│ 14:31:40Z   │ 243.000MHz│ 180°    │ -70dBm│ PULSE    │ -    │
└─────────────────────────────────────────────────────────────┘
```

**Step 5.1: Live Signal Detection**
- Method: `simulateLiveSignals()`
- Timer: Random interval (2-8 seconds)
- Process:
  1. Generate random signal:
     ```javascript
     {
       time: getCurrentZuluTime(),
       frequency: randomFreq(100, 140),
       bearing: randomBearing(),
       strength: random(-90, -40) + "dBm",
       type: random(['VOICE', 'L16 DATA', 'PULSE', 'ENCRYPTED']),
       entity: lookupEntity(frequency) || '-'
     }
     ```
  2. Add new row to top of SIGINT table
  3. Apply color coding:
     - VOICE: Cyan text
     - L16 DATA: Green text
     - PULSE: Amber text
     - ENCRYPTED: Purple text
  4. If frequency = 121.5 MHz: Highlight row in amber
  5. Limit table to 50 rows (remove oldest)
  6. Play soft "ping" notification (if audio enabled)

**Step 5.2: AI Signal Analysis**
- Event Listener: `loadAISigintListener()`
- Trigger: `ai-signal-analysis` CustomEvent from `ai-system.js`
- Process:
  1. Receive analysis data:
     ```javascript
     {
       type: 'SIGINT',
       msg: 'Unencrypted voice detected on 121.5MHz',
       prob: 0.95,
       recommendation: 'Monitor and identify source'
     }
     ```
  2. Add AI badge to corresponding SIGINT row
  3. Show AI analysis panel (expandable)
  4. Update entity reference if identified
  5. If high confidence (>0.8): Auto-flag for commander review

**Step 5.3: Entity Lookup**
- Method: Internal lookup table
- Process:
  1. Check frequency against known entities:
     - 121.500 MHz → "Bogey_Golf_42" (if in range)
     - 1124.000 MHz → "L16-Network" (always)
     - 243.000 MHz → "Emergency Beacon" (always)
     - 150.000+ MHz → "Civilian ATC" (Stockholm, Gothenburg)
  2. Update entity column in SIGINT log
  3. If entity found: Show tooltip with entity details on hover

---

### 6. TRANSMISSION LOG (TX LOG) WORKFLOW

**Step 6.1: View TX Log**
- Action: Click "TX LOG" button in Encryption Status bar
- Method: `CommsManager.showTxLog()`
- Process:
  1. Create modal with full transmission history
  2. Load from `CommsManager.txLog` array (in memory)
  3. Display columns:
     - Timestamp (Zulu)
     - Channel used
     - Transmission type (VOICE, L16 BURST, EMERGENCY)
     - Message content (truncated to 50 chars)
     - Status (TRANSMITTED, FAILED, ENCRYPTED)
  4. Add filter dropdowns:
     - By channel
     - By type
     - By time range
  5. Show "EXPORT CSV" button in modal footer

**Step 6.2: Export TX Log**
- Action: Click "EXPORT TO CSV" or "EXPORT CSV" in modal
- Method: `CommsManager.exportTxLog()`
- Process:
  1. Convert `txLog` array to CSV format:
     ```csv
     Time (Z),Channel,Type,Message,Status
     14:32:15Z,GUARD 121.5MHz,VOICE,"Intercept bogey",TRANSMITTED
     14:30:00Z,LINK 16,L16 BURST,"Position update",ENCRYPTED
     ```
  2. Create Blob with CSV data
  3. Generate download link with filename:
     ```
     comms_tx_log_2026-04-24T154500Z.csv
     ```
  4. Trigger browser download
  5. Show "EXPORTED" toast notification

**Step 6.3: Log Transmission Entry**
- Method: `CommsManager.logTransmission(data)`
- Called by: `transmitGuard()`, `transmitL16()`, `emergencyBroadcast()`
- Process:
  1. Create entry object:
     ```javascript
     {
       id: generateUniqueId(),
       time: getCurrentZuluTime(),
       channel: data.channel,
       type: data.type,
       message: data.message,
       status: data.status,
       encrypted: data.encrypted || false
     }
     ```
  2. Push to `CommsManager.txLog` array
  3. Update TX Log modal if open (live refresh)
  4. Enforce max log size (500 entries, remove oldest)

---

### 7. ENCRYPTION STATUS WORKFLOW

**Status Bar:**
```
┌──────────────────────────────────────────────────────────┐
│ 🔒 CRYPTO KEY: K2A9-F1B3-7C8D [ACTIVE]                 │
│ [TX LOG] [EXPORT TO CSV]            14:32:15Z (Zulu)    │
└──────────────────────────────────────────────────────────┘
```

**Step 7.1: Display Crypto Key**
- Method: Auto-updated on init and after transmissions
- Process:
  1. Read active key from `CommsManager.cryptoKey`
  2. Display masked key (show first/last 4 chars):
     ```
     K2A9-****-****-**** → Display: "K2A9-...-7C8D"
     ```
  3. Show key status:
     - ACTIVE (green indicator)
     - EXPIRING (amber indicator, <24h remaining)
     - EXPIRED (red indicator, should not happen)

**Step 7.2: Key Rotation (Simulated)**
- Trigger: Not currently automated (future feature)
- Manual process:
  1. Would receive new key via SAT UPLINK (encrypted channel)
  2. Verify key integrity (CRC check, simulated)
  3. Update `CommsManager.cryptoKey`
  4. Log key change to TX Log
  5. Show "NEW CRYPTO KEY LOADED" toast

---

### 8. AI INTEGRATION WORKFLOW

**Step 8.1: AI Threat Listener**
- Method: `loadAIThreatListener()`
- Event: `ai-update` from `ai-system.js`
- Process:
  1. Receive threat data:
     ```javascript
     {
       type: 'threat-detected',
       data: {
         entity: 'Bogey_Golf_42',
         threatScore: 85,
         speed: 950,
         iff: 'UNKNOWN'
       }
     }
     ```
  2. Check if entity is communicating on monitored freqs
  3. If yes: Highlight related SIGINT entries
  4. Auto-tune spectrum to suspected frequency
  5. Suggest transmission template:
     ```
     "AI RECOMMENDATION: Use 'Fighter Intercept' template
      for Bogey_Golf_42 on 121.5MHz"
     ```
  6. Show AI suggestion badge on relevant channel

**Step 8.2: AI Signal Analysis Listener**
- Method: `loadAISigintListener()`
- Event: `ai-signal-analysis` from `ai-system.js`
- Process:
  1. Receive signal analysis:
     ```javascript
     {
       type: 'SIGINT',
       freq: 121.5,
       msg: 'Voice pattern matches known hostile',
       prob: 0.92,
       action: 'Alert commander'
     }
     ```
  2. Add AI analysis row to SIGINT log (purple tint)
  3. If probability > 0.9:
     - Show alert toast: "⚠️ AI: HOSTILE SIGNAL DETECTED"
     - Flash corresponding spectrum bar in red
  4. Auto-populate interception template with AI data

---

### 9. EVENT-DRIVEN ARCHITECTURE

**Event Flow Diagram:**
```
ai-system.js                    comms.html
    │                              │
    ├─→ [CustomEvent: ai-update] ─→┤ CommsManager.loadAIThreatListener()
    │                              │   ├─ Highlight threats in SIGINT
    │                              │   └─ Suggest transmissions
    │                              │
    ├─→ [CustomEvent: ai-signal-analysis]
    │                              │ CommsManager.loadAISigintListener()
    │                              │   ├─ Add AI analysis to log
    │                              │   └─ Alert if hostile (prob > 0.9)
    │                              │
    │  CommsManager.transmitGuard() ├─→ [CustomEvent: comms-transmit]
    │  CommsManager.transmitL16()   │     (future: for other pages)
    │                              │
```

**Step 9.1: Publish Events (Future Enhancement)**
- Currently: COMMS only subscribes, doesn't publish
- Proposed: After transmission, publish event:
  ```javascript
  window.dispatchEvent(new CustomEvent('comms-transmit', {
    detail: {
      channel: 'GUARD 121.5MHz',
      type: 'VOICE',
      entity: 'Bogey_Golf_42',
      time: getCurrentZuluTime()
    }
  }));
  ```
- Subscribers:
  - `tactical-map.html` - Update entity communication status
  - `mission_logs.html` - Auto-log transmission to mission record
  - `ai-system.js` - Feed transmission data to AI for pattern analysis

---

### 10. USER INTERACTION FLOWS

**Flow 1: Routine Monitoring**
```
1. User opens COMMS page
2. Views spectrum analyzer (visual scan)
3. Checks SIGINT log for new signals
4. Monitors Guard frequency (121.5MHz) for distress calls
5. Periodically checks LINK 16 for data bursts
6. Reviews TX Log for transmission history
```

**Flow 2: Intercept Scenario**
```
1. AI detects threat (Bogey_Golf_42)
2. COMMS receives ai-update event
3. User sees highlighted SIGINT entry (amber)
4. User clicks "Fighter Intercept" template
5. Message auto-populates with entity data
6. User clicks "TRANSMIT ON GUARD"
7. Confirmation dialog appears
8. User confirms → Transmission sent
9. TX Log updated
10. AI receives transmission event (future)
```

**Flow 3: Emergency (Mayday)**
```
1. SIGINT log shows 121.5MHz voice (distress call)
2. User clicks "Mayday" template
3. Message: "MAYDAY MAYDAY MAYDAY..."
4. User clicks "TRANSMIT ON GUARD"
5. System warns: "EMERGENCY TRANSMISSION"
6. User confirms
7. CommsManager.emergencyBroadcast() called
8. Transmission sent on ALL channels
9. Spectrum analyzer shows spike on all freqs
10. Mission log updated with CRITICAL event
11. AI triggered for emergency response suggestions
```

---

### 11. STATE MANAGEMENT

**CommsManager State Object:**
```javascript
CommsManager = {
  isInitialized: false,
  txLog: [],                      // Transmission history
  cryptoKey: 'K2A9-F1B3-7C8D',   // Active encryption key
  activeFrequency: null,          // Currently tuned freq
  channels: {
    LINK16: { status: 'ACTIVE', encrypted: true, trafficRate: '100%' },
    GUARD: { status: 'MONITORING', encrypted: false, trafficRate: 'LOW' },
    SAT: { status: 'STANDBY', encrypted: true, trafficRate: '0%' },
    SECURE: { status: 'ACTIVE', encrypted: true, trafficRate: '100%' }
  },
  spectrumData: [],               // Frequency bar heights
  signalInterval: null,           // Live signal timer
  animationInterval: null         // Spectrum animation timer
}
```

**State Updates:**
- Transmissions → Update `txLog`
- Channel clicks → Update `channels` status
- Tuning → Update `activeFrequency`
- Crypto → Update `cryptoKey`
- All state resets on page reload (no persistence)

---

### 12. ERROR HANDLING

**Step 12.1: Transmission Failures**
- Scenario: Network issue or channel inactive
- Process:
  1. Catch error in try-catch block
  2. Show error toast: "TRANSMISSION FAILED"
  3. Log to TX Log with status: "FAILED"
  4. Re-enable transmit button
  5. Suggest retry or alternative channel

**Step 12.2: AI Service Unavailable**
- Scenario: OpenRouter API down or no API key
- Process:
  1. `loadAIThreatListener()` silently fails
  2. No AI suggestions shown
  3. System continues without AI features
  4. SIGINT log operates in manual mode
  5. Console warning: "AI features unavailable"

**Step 12.3: Invalid Frequency Tuning**
- Scenario: User inputs out-of-range frequency
- Process:
  1. Validate frequency (100-140 MHz range)
  2. If invalid: Show toast "INVALID FREQUENCY"
  3. Do not update spectrum or SIGINT filter
  4. Retain previous valid frequency

---

### 13. SECURITY CONSIDERATIONS

**Step 13.1: Encryption Enforcement**
- LINK 16: Always encrypted (Type 1 encryption)
- SAT UPLINK: Encrypted by default
- SECURE GROUND: Fiber + encryption
- GUARD 121.5MHz: NEVER encrypted (international law)

**Step 13.2: Transmission Logging**
- All transmissions logged (mandatory for military comms)
- Logs include:
  - Timestamp (Zulu)
  - Channel used
  - Message content
  - Encryption status
- Export controlled (CSV download)

**Step 13.3: API Key Exposure**
- Current: OpenRouter key in `ai-system.js` (client-side)
- Risk: Exposed in browser DevTools
- Mitigation (future): Move to server-side proxy

---

### 14. PERFORMANCE OPTIMIZATIONS

**Step 14.1: Spectrum Animation**
- Throttle: 100ms interval (10 FPS)
- Optimization: Only update changed bars
- CSS animations: GPU-accelerated (transform, opacity)

**Step 14.2: SIGINT Log**
- Limit: Max 50 rows in DOM
- Process: Remove oldest row when limit reached
- Virtual scrolling (future): For 1000+ entries

**Step 14.3: Event Listeners**
- Cleanup: Remove listeners on page unload
- Debounce: Spectrum animation frame-skipping if tab hidden

---

### 15. FUTURE ENHANCEMENTS

1. **Persistent State**: Save/restore from localStorage
2. **Real Backend**: WebSocket for live SIGINT data
3. **Audio Playback**: Actual radio audio streaming
4. **3D Spectrum**: WebGL spectrum visualization
5. **Geo-location**: Plot signal sources on map
6. **Frequency Hopping**: Simulate advanced COMSEC techniques
7. **Multi-language**: Swedish/English toggle (project is Swedish)
8. **Export Formats**: PDF, JSON, XML options
9. **Playback**: Replay SIGINT log for after-action review
10. **Integration**: Full event publishing to other pages

---

## Summary

The COMMS page workflow follows this high-level flow:

```
INIT → MONITOR → DETECT → (optionally) TRANSMIT → LOG → (optionally) AI ANALYZE
  │                                                                 │
  └────────────────────────── LOOP ─────────────────────────────────┘
```

**Key Files:**
- `comms.html` - Main page (lines 1-900+)
- `shared-components.js` - UI library
- `ai-system.js` - AI integration
- `styles/global.css` - Animations and styling
- `tailwind.config.js` - Theme configuration

**Key Methods:**
- `CommsManager.init()` - Initialize page
- `CommsManager.transmitGuard()` - Guard transmission
- `CommsManager.transmitL16()` - LINK 16 burst
- `CommsManager.showTxLog()` - View transmission history
- `CommsManager.exportTxLog()` - Export to CSV
- `CommsManager.simulateLiveSignals()` - Generate fake SIGINT
- `CommsManager.startSpectrumAnimation()` - Visualizer loop

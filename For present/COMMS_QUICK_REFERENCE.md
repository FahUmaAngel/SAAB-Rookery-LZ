# SAAB C2 Comms Page - Quick Reference Guide
## Functions, Methods & Key Interactions

---

## 🔥 Core Functions Reference

### **1. Initialization Functions**

| Function | Called | Purpose | Frequency |
|----------|--------|---------|-----------|
| `init()` | On page load | Initialize all systems | Once |
| `startZuluClock()` | By init() | Start UTC time display | Every 1 second |
| `startLiveUpdates()` | By init() | Start signal simulation | Every 5 seconds |
| `startSweepAnimation()` | By init() | Start spectrum animation | Every 200ms |
| `loadAIThreatListener()` | By init() | Listen for AI threats | Event-based |
| `loadAISigintListener()` | By init() | Listen for AI signals | Event-based |

**Syntax:**
```javascript
CommsManager.init();  // Triggers all 6 sub-functions automatically
```

---

### **2. Transmission Functions**

#### **A. Guard Transmission (121.5 MHz)**

```javascript
CommsManager.transmitGuard()
```

**What it does:**
- Validates message is not empty
- Shows toast notification
- Animates Guard Bar spike (10% → 98% → restore)
- Adds entry to SIGINT log
- Logs transmission to TX history
- Duration: 800ms animation

**Example Flow:**
```
User Message: "UNIDENTIFIED AIRCRAFT TURN 180 DEGREES"
    ↓
transmitGuard()
    ├─ ✅ Validation passed (not empty)
    ├─ 📢 Toast: "TX: GUARD 121.5 MHz"
    ├─ 📊 Guard bar animation
    ├─ 📋 SIGINT entry added
    └─ 💾 TX log updated
```

---

#### **B. Link 16 Transmission (Encrypted)**

```javascript
CommsManager.transmitL16()
```

**What it does:**
- Validates message is not empty
- Shows toast with encryption icon
- Simulates TDMA burst (40% random bars spike)
- Each bar: 50-95% height for 600ms
- Adds SIGINT entry with type "ENCRYPTED"
- Duration: 600ms animation

**Example Flow:**
```
User Message: "TARGET COORDINATES 59.3°N 18.0°E"
    ↓
transmitL16()
    ├─ ✅ Validation passed
    ├─ 🔐 Toast: "TX: LINK 16"
    ├─ ⚡ TDMA Burst animation (multiple bars)
    ├─ 📋 SIGINT entry (type: ENCRYPTED)
    └─ 💾 TX log updated
```

---

#### **C. Emergency Broadcast**

```javascript
CommsManager.emergencyBroadcast()
```

**What it does:**
- Shows confirmation dialog
- If cancelled: return
- If confirmed:
  - Auto-load mayday message (if empty)
  - Show error/warning toast
  - Spike Guard Bar to 98% for 1200ms
  - Add TWO SIGINT entries (121.5 + L16)
  - Log with type "DISTRESS"

**Confirmation Needed:**
```
"CONFIRM DISTRESS BROADCAST - Will transmit on ALL channels. Continue?"
```

---

#### **D. Load Template**

```javascript
CommsManager.loadTemplate(templateType)
```

**Parameters:**
- `"fighter"` - Military aircraft intercept warning
- `"cargo"` - Cargo vessel warning
- `"aircraft"` - Unidentified aircraft warning
- `"breach"` - Airspace breach warning
- `"mayday"` - Distress signal

**Example:**
```javascript
CommsManager.loadTemplate("fighter");
// Textarea fills with: "UNIDENTIFIED MILITARY AIRCRAFT..."
```

---

### **3. SIGINT Management Functions**

#### **A. Add SIGINT Entry**

```javascript
CommsManager.addSigintEntry(data)
```

**Parameters:**
```javascript
{
    time: "12:44:02",           // Zulu time
    freq: "118.250",            // Frequency or type
    bearing: "184°/45NM",       // Direction/distance
    sigStrength: "-65 dBm",     // Signal strength
    decode: "CLEAR VOICE",      // Classification
    entity: "CIV_ATC_STHLM"    // Source identifier
}
```

**Rules:**
- Prevents duplicates (same time + freq)
- Inserts at top of table (newest first)
- Max 50 entries kept
- Auto-colors based on type

**Example:**
```javascript
CommsManager.addSigintEntry({
    time: new Date().toUTCString().slice(17, 25),
    freq: "121.500",
    bearing: "092°/68NM",
    sigStrength: "-52 dBm",
    decode: "UNMODULATED CARRIER",
    entity: "Bogey_Golf_42"
});
// Appears as new row in SIGINT table
```

---

#### **B. Show SIGINT Detail Modal**

```javascript
CommsManager.showSigintDetail(data)
```

**Displays:**
- Signal frequency
- Bearing & distance
- Signal strength
- Time detected
- Entity reference
- Decoded message
- Action buttons: DISMISS, TUNE TO SIGNAL

---

#### **C. Handle Table Click**

```javascript
CommsManager.handleTableClick(event)
```

**Triggered:** User clicks row in SIGINT table
**Result:** Opens `showSigintDetail()` modal

---

### **4. Spectrum Control Functions**

#### **A. Tune To Signal**

```javascript
CommsManager.tuneToSignal(frequency)
```

**Parameters:**
- `"121.500"` - Guard frequency
- `"118.250"` - ATC frequency
- `"L16_DATA"` - Link 16 data
- Or any frequency string

**What it does:**
- Highlights matching spectrum bar (bg-tertiary)
- Sets bar height to 80%
- Shows "TUNED: [freq]" indicator
- Displays toast notification
- Stores current frequency for reference

**Example:**
```javascript
CommsManager.tuneToSignal("121.500");
// Guard bar highlighted
// Display: "TUNED: 121.500"
// Toast: "Locked to 121.500"
```

---

#### **B. Toggle Sweep**

```javascript
CommsManager.toggleSweep()
```

**States:**
- **Active:** "SWEEP: ACTIVE" (tertiary color)
  - Bars animate continuously
  - Heights randomize every 200ms
  
- **Stopped:** "SWEEP: STOPPED" (outline color)
  - Animation pauses
  - Bars hold current state

**Example:**
```
Click button: "STOP"
    ↓
CommsManager.toggleSweep()
    ├─ Sweep status: STOPPED
    ├─ Animation cleared
    └─ Toast: "RADAR SWEEP - Stopped"

Click button: "START"
    ↓
CommsManager.toggleSweep()
    ├─ Sweep status: ACTIVE
    ├─ Animation resumed
    └─ Toast: "RADAR SWEEP - Active"
```

---

#### **C. Start Sweep Animation**

```javascript
CommsManager.startSweepAnimation()
```

**Auto-called by:** toggle or init
**Frequency:** Every 200ms
**Effect:**
- All bars (except Guard): randomize height
- Guard bar: 15% chance to spike
- Creates live spectrum effect

---

#### **D. Simulate Signal Detection**

```javascript
CommsManager.simulateSignalDetection()
```

**Auto-called by:** Live updates timer (30% probability)
**Effect:**
- Random spectrum bar (not tuned) selected
- Bar spikes to 50-90% for 1500ms
- Highlighted with tertiary color
- Simulates detected signal

---

### **5. Channel Control Functions**

#### **A. Show Channel Detail**

```javascript
CommsManager.showChannelDetail(channel)
```

**Parameters:**
```javascript
"LINK16"   // Tactical Data Link
"GUARD"    // Emergency Channel
"SAT"      // Satellite Uplink
"SECURE"   // Secure Ground Line
```

**Modal Shows:**
- Frequency / Type / Status / Encryption
- Tune input field (except SECURE channel)
- Buttons: TUNE, CLOSE

**Example:**
```javascript
CommsManager.showChannelDetail("LINK16");
// Modal displays:
// Frequency: JD081-225
// Type: Tactical Data Link
// Status: 100%
// Encryption: AES-256
// [Tune Input] [TUNE] [CLOSE]
```

---

#### **B. Toggle Audio**

```javascript
CommsManager.toggleAudio(channel)
```

**Parameters:**
- `"link16"` - Link 16 channel
- `"guard"` - Guard frequency
- `"sat"` - Satellite uplink

**Effect:**
- Toggles mute state (boolean)
- Updates volume icon (volume_up ↔ volume_off)
- No actual audio (simulation)

---

### **6. Modal & UI Functions**

#### **A. Show TX Log Modal**

```javascript
CommsManager.showTxLog()
```

**Displays:**
- All transmissions (up to 20 entries)
- Time, channel, type, message, status
- EXPORT LOG button
- CLOSE button

**CSV Export Format:**
```
TIME,CHANNEL,TYPE,MESSAGE,STATUS
12:44:02,121.500 MHz,GUARD,UNIDENTIFIED AIRCRAFT TURN...,SENT
12:44:58,LINK 16,L16,TARGET COORDINATES 59.3°N...,SENT
```

---

#### **B. Show Guard Options Modal**

```javascript
CommsManager.showGuardOptions()
```

**Triggered:** User clicks Guard frequency bar (121.5 MHz)

**Displays:**
- Detected signal: -52 dBm
- Classification: UNMODULATED CARRIER
- Three action buttons:
  1. **TRANSMIT WARNING** → Load template + transmit
  2. **TUNE TO FREQUENCY** → Lock to 121.500
  3. **SEND DISTRESS** → Load mayday + transmit

---

#### **C. Show Quick Alert**

```javascript
CommsManager.showQuickAlert()
```

**Auto-triggered:** AI threat score > 50

**Displays:**
- ⚠ THREAT DETECTED
- AI Threat Score value
- TRANSMIT WARNING button
- DISMISS button
- Pulsing animation

---

#### **D. Quick Alert Action**

```javascript
CommsManager.quickAlert()
```

**What it does:**
- Closes alert modal
- Auto-loads message: "AUTOMATED WARNING - UNIDENTIFIED CONTACT..."
- Calls `transmitGuard()`
- Executes full transmission workflow

---

### **7. Data Logging Functions**

#### **A. Log Transmission**

```javascript
CommsManager.logTransmission(data)
```

**Parameters:**
```javascript
{
    time: "12:44:02",
    channel: "121.500 MHz",     // or "LINK 16", "ALL CHANNELS"
    type: "GUARD",              // or "L16", "DISTRESS"
    message: "Message text...",
    status: "SENT"              // Always "SENT" for now
}
```

**Effect:**
- Prepends to txLog array
- Updates TX Log modal if visible
- Keeps max 20 rows
- Stores for export

---

#### **B. Export TX Log**

```javascript
CommsManager.exportTxLog()
```

**Generates:**
- CSV file with all transmissions
- Filename: `tx_log_YYYY-MM-DD.csv`
- Auto-downloads to user's device

**CSV Content:**
```
TIME,CHANNEL,TYPE,MESSAGE,STATUS
12:44:02,121.500 MHz,GUARD,UNIDENTIFIED AIRCRAFT TURN 180 DEGREES,SENT
12:45:15,LINK 16,L16,TARGET COORDINATES TRANSMITTED,SENT
```

---

### **8. AI Integration Functions**

#### **A. Load AI Threat Listener**

```javascript
CommsManager.loadAIThreatListener()
```

**Sets up:** Event listener for `ai-update` events
**Condition:** If `phase === 'DETECT'` AND `threatScore > 50`
**Action:** Calls `showQuickAlert()`

---

#### **B. Load AI SIGINT Listener**

```javascript
CommsManager.loadAISigintListener()
```

**Sets up:** Event listener for `ai-signal-analysis` events
**Data:** Receives `{ type, msg, prob }`
**Action:** Automatically adds to SIGINT table with AI marker

---

#### **C. Quick Alert**

```javascript
CommsManager.quickAlert()
```

**Triggered:** User clicks "TRANSMIT WARNING" in Quick Alert
**Flow:**
- Auto-message: "AUTOMATED WARNING..."
- Calls `transmitGuard()`
- Full transmission workflow

---

## 📊 Data Structures

### **CommsManager State Object**

```javascript
CommsManager = {
    // ===== STATE =====
    audioMuted: {
        link16: false,  // boolean
        guard: false,   // boolean
        sat: false      // boolean
    },
    
    signals: [],        // Array of signal objects
    txLog: [],          // Array of transmission logs
    liveUpdateTimer: null,     // setInterval ID
    sweepTimer: null,          // setInterval ID
    initialized: false,        // boolean
    aiThreatListenerLoaded: false,    // boolean
    aiSigintListenerLoaded: false,    // boolean
    currentFreq: null,                // Current tuned frequency
    
    // ===== TEMPLATES =====
    templates: {
        fighter: "UNIDENTIFIED MILITARY AIRCRAFT...",
        cargo: "CARGO VESSEL [NAME]...",
        aircraft: "UNIDENTIFIED AIRCRAFT...",
        breach: "WARNING - RESTRICTED AIRSPACE...",
        mayday: "MAYDAY MAYDAY MAYDAY..."
    }
}
```

---

### **Transmission Log Entry**

```javascript
{
    time: "12:44:02",                    // HH:MM:SS Zulu
    channel: "121.500 MHz",              // Channel name
    type: "GUARD",                       // GUARD, L16, DISTRESS
    message: "AIRCRAFT TURN 180 DEGREES",  // Message text
    status: "SENT"                       // Status
}
```

---

### **SIGINT Entry**

```javascript
{
    time: "12:44:02",                    // HH:MM:SS Zulu
    freq: "118.250",                     // Frequency or type
    bearing: "184°/45NM",                // Direction/distance
    sigStrength: "-65 dBm",              // Signal strength in dBm
    decode: "CLEAR VOICE",               // Classification
    entity: "CIV_ATC_STHLM"             // Source identifier
}
```

---

## ⚡ Quick Interactions

### **Interaction 1: Send Guard Warning**

```
1. Click "ALERT TEMPLATE" dropdown
2. Select "fighter"
3. Template loads: "UNIDENTIFIED MILITARY AIRCRAFT..."
4. (Optional) Edit message
5. Click "TRANSMIT ON GUARD"
6. Toast: "TX: GUARD 121.5 MHz"
7. Guard bar spikes animation
8. SIGINT entry added
9. TX log updated
```

---

### **Interaction 2: Transmit Encrypted Data**

```
1. Type/paste message in textarea
2. Click "ENCRYPTED BURST (L16)"
3. Toast: "TX: LINK 16"
4. Spectrum burst animation (multiple bars)
5. SIGINT entry with type "ENCRYPTED"
6. TX log shows LINK 16 transmission
```

---

### **Interaction 3: Emergency Distress**

```
1. Click "⚠ DISTRESS" button
2. Confirmation: "CONFIRM DISTRESS BROADCAST?"
3. If Yes:
   - Message auto-loaded
   - Guard bar 98% spike for 1.2s
   - Two SIGINT entries added
   - TX log type "DISTRESS"
4. If No: Return to editing
```

---

### **Interaction 4: Monitor & Tune**

```
1. Watch SIGINT table for new entries (auto-updates)
2. Notice Guard bar spiking → Click it
3. Guard Options modal appears
4. Click "TUNE TO FREQUENCY"
5. Bar highlighted (bg-tertiary)
6. Display shows "TUNED: 121.500"
7. Close modal
8. Continue monitoring
```

---

### **Interaction 5: AI Threat Alert**

```
1. AI detects threat (threatScore > 50)
2. ai-update event fires
3. Quick Alert modal appears
4. Shows threat score + warning
5. User clicks "TRANSMIT WARNING"
6. Auto-loads "AUTOMATED WARNING..."
7. transmitGuard() executes
8. Modal closes
9. TX complete
```

---

## 📍 Important Notes

### **Message Validation**
- All transmission functions require non-empty message
- Empty message → Toast "NO MESSAGE" → No transmission

### **Animation Timing**
- Guard transmission spike: **800ms**
- L16 burst spike: **600ms**
- Distress spike: **1200ms**
- Spectrum sweep cycle: **200ms**
- Live update cycle: **5000ms** (5 seconds)

### **Entry Limits**
- SIGINT table: max 50 rows
- TX Log modal: max 20 rows
- Prevents memory bloat

### **AI Integration**
- Requires ai-system.js loaded
- Events: `ai-update`, `ai-signal-analysis`
- No AI → Fallback to manual operation

### **Responsive Design**
- Left panel: fixed 320px width
- Center/Right panels: fluid width
- Uses Tailwind CSS classes
- Dark mode enabled

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `comms.html` | Main page (HTML + inline JS) |
| `ai-system.js` | AI threat detection & analysis |
| `shared-components.js` | Toast notifications & shared UI |
| `tailwind.config.js` | CSS configuration |
| `styles/global.css` | Global styles |

---

**Last Updated:** 2026-04-24
**Quick Reference Version:** 1.0

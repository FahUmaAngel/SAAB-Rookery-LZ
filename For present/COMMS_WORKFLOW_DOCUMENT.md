# SAAB C2 COMMS PAGE - Workflow Documentation
## Communications & SIGINT Management System

---

## 📋 สารบัญ

1. [ภาพรวมของระบบ](#ภาพรวมของระบบ)
2. [ขั้นตอนการทำงาน](#ขั้นตอนการทำงาน)
3. [องค์ประกอบหลัก](#องค์ประกอบหลัก)
4. [ระบบ Events & Listeners](#ระบบ-events--listeners)
5. [ลำดับการทำงาน](#ลำดับการทำงาน)
6. [Use Cases](#use-cases)

---

## 🎯 ภาพรวมของระบบ

หน้า **comms.html** เป็นศูนย์ควบคุมการสื่อสาร (Command & Control) ของระบบ SAAB C2 ที่ยูนิตทหารใช้ในการ:
- ✅ ติดตามสัญญาณวิทยุ (Signals Intelligence - SIGINT)
- ✅ ส่งคำเตือนและข้อมูลข่าวสารแบบเข้ารหัส
- ✅ ควบคุมเสา Radar และความถี่วิทยุ
- ✅ ตรวจสอบภัยคุกคามผ่านการวิเคราะห์ AI
- ✅ บันทึก Transmission Log สำหรับประวัติการสื่อสาร

---

## ⚙️ ขั้นตอนการทำงาน

### **PHASE 1: Initialization (การเริ่มต้น)**

เมื่อผู้ใช้เข้ามาที่หน้า comms.html ระบบจะทำการเตรียมความพร้อมตามลำดับนี้:

```javascript
CommsManager.init()
├── startZuluClock()              // เริ่มนาฬิกา UTC (Zulu Time)
├── startLiveUpdates()            // เริ่ม Timer สำหรับการอัปเดตเสมือน
├── startSweepAnimation()         // เริ่มแอนิเมชัน Radar Sweep
└── loadAIThreatListener()        // เชื่อมต่อ AI Threat Detection
    └── loadAISigintListener()    // เชื่อมต่อ AI Signal Analysis
```

**ระยะเวลา:**
- **Zulu Clock**: อัปเดตทุก 1 วินาที
- **Live Updates**: ทุก 5 วินาที (30% โอกาสสัญญาณใหม่)
- **Sweep Animation**: ทุก 200ms

---

### **PHASE 2: Interface Layout (โครงสร้างอินเทอร์เฟส)**

หน้า Comms แบ่งออกเป็น 3 ส่วนหลัก:

#### **LEFT PANEL - Communication Control (กว้าง 320px)**

```
┌─────────────────────────────────┐
│ COMMUNICATION CHANNELS          │
├─────────────────────────────────┤
│ ● LINK 16 [100%] 🔊             │ ← Tactical Data Link
│ ○ GUARD 121.5 [MONITORING] 🔊   │ ← Emergency Channel (Pulse Effect)
│ ● SAT UPLINK [STDBY] 🔊         │ ← Satellite Uplink
│ ● SECURE GROUND [lock] 🔓       │ ← Fiber Backbone
└─────────────────────────────────┘
│ TRANSMISSION CONTROL - TX: ARMED │
├─────────────────────────────────┤
│ [⚠ DISTRESS] [PHASE 4 QRA]      │
│ Alert Template: ▼               │
│ Guard Message: [textarea]       │
│ [📡 TRANSMIT ON GUARD]          │
│ [🔐 ENCRYPTED BURST L16]        │
└─────────────────────────────────┘
│ 🛡 CRYPTO KEY: ENCRYPTED        │
│ [📋 TX LOG]        ZULU 12:34   │
└─────────────────────────────────┘
```

**ฟังก์ชันหลัก:**
- 🔘 ปุ่มช่องสัญญาณ → `showChannelDetail()` แสดง Modal details
- 📝 Template → `loadTemplate()` ป้อนข้อความเทมเพลต
- 📡 Transmit buttons → `transmitGuard()` / `transmitL16()` 

---

#### **CENTER PANEL - Spectrum Visualization (ยืดหยุ่น)**

```
┌─────────────────────────────────────────────┐
│ ACTIVE INTERCEPT SPECTRUM [VHF/UHF]        │
│ [STOP]  SWEEP: ACTIVE   TUNED: --          │
├─────────────────────────────────────────────┤
│                                             │
│  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    │
│  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    │ ← Heights vary
│  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    │   based on signal
│  ▲     ▲     ▲     ▲     ▲ ▲ ▲▲ ▲ ▲ █     │   strength
│ 100   110    120    130    140             │
│         MHz  (Guard Frequency = 121.5)    │
└─────────────────────────────────────────────┘
```

**ฟังก์ชันหลัก:**
- 🎯 Click Bar → `tuneToSignal(freq)` ล็อกความถี่
- 🔄 Toggle Sweep → `toggleSweep()` เปิด/ปิด Animation
- 📊 Animation → `startSweepAnimation()` สร้างเสียงจำลอง
- ⚠️ Guard Bar Special → `showGuardOptions()` แสดงเมนูเฉพาะ

---

#### **RIGHT PANEL - SIGINT Log (ยืดหยุ่นที่เหลือ)**

```
┌─────────────────────────────────────┐
│ SIGNAL INTERCEPT LOG (SIGINT)      │
│ 🔴 LIVE FEED                        │
├─────────────────────────────────────┤
│ TIME(Z) │ FREQ    │ BRG    │ STR   │
├─────────────────────────────────────┤
│ 12:44:02│118.250 │184°/45NM│-65dBm│ ← อาจคลิกเพื่อดู Details
│ 12:44:15│UHF_SAT │ORBITAL │-92dBm│
│ 12:44:58│121.500 │092°/68NM│-52dBm│ ← Bogey_Golf_42 (ทำเครื่องหมาย)
│ 12:45:08│--      │--      │--    │ ← รอสัญญาณ...
└─────────────────────────────────────┘
```

**ฟังก์ชันหลัก:**
- 📋 Click Row → `handleTableClick()` → `showSigintDetail()` Modal
- ➕ Add Entry → `addSigintEntry()` บันทึกสัญญาณใหม่
- 🔄 Auto Updates → `startLiveUpdates()` จำลองการอัปเดตแบบสดไป

---

### **PHASE 3: User Interactions (ปฏิสัมพันธ์ของผู้ใช้)**

#### **การเลือกช่องสัญญาณ (Channel Selection)**

```
User Clicks Channel
    ↓
CommsManager.showChannelDetail(channel)
    ↓
Create Modal showing:
    - Frequency (ความถี่)
    - Status (สถานะ)
    - Type (ประเภท)
    - Encryption (การเข้ารหัส)
    - Tune Input Field (สำหรับเปลี่ยนความถี่)
    ↓
User selects "TUNE" or clicks another button
```

**ช่องสัญญาณที่มี:**

| Channel | Frequency | Type | Encryption | Status |
|---------|-----------|------|-----------|--------|
| LINK 16 | JD081-225 | Tactical Data Link | AES-256 | 100% |
| GUARD | 121.500 MHz | Emergency | NONE | MONITORING |
| SAT | 243-400 MHz | Satellite | TRANSOMET | STANDBY |
| SECURE | Fiber Optic | Land Line | TYPE 1 | ACTIVE |

---

#### **การเลือก Alert Template**

```
User selects from dropdown
    ↓
CommsManager.loadTemplate(type)
    ↓
Populate textarea with preset message:
    - fighter: "UNIDENTIFIED MILITARY AIRCRAFT..."
    - cargo: "CARGO VESSEL [NAME]..."
    - aircraft: "UNIDENTIFIED AIRCRAFT..."
    - breach: "WARNING - RESTRICTED AIRSPACE..."
    - mayday: "MAYDAY MAYDAY MAYDAY..."
    ↓
User can edit message before sending
```

---

#### **การส่งข้อมูลข่าวสาร (Transmission Process)**

##### **1️⃣ TRANSMIT ON GUARD (121.5 MHz)**

```
User clicks "TRANSMIT ON GUARD"
    ↓
CommsManager.transmitGuard()
    ↓
Validation: ❌ if message empty → Show Toast "NO MESSAGE"
    ↓
✅ Process:
    1. Show Toast "TX: GUARD 121.5 MHz"
    2. Spike Guard Bar (Height: 10% → 98% → restore)
    3. Add entry to SIGINT Log:
       - freq: "121.500"
       - decode: "WARNING BURST"
       - entity: "SWAF_GUARD_TX"
    4. Log to Transmission Log:
       - channel: "121.500 MHz"
       - type: "GUARD"
       - status: "SENT"
    5. Clear template selector
```

**เวลาแอนิเมชัน:** 800ms spike, then restore

---

##### **2️⃣ ENCRYPTED BURST (LINK 16)**

```
User clicks "ENCRYPTED BURST (L16)"
    ↓
CommsManager.transmitL16()
    ↓
Validation: ❌ if message empty → Show Toast "NO MESSAGE"
    ↓
✅ Process:
    1. Show Toast "TX: LINK 16" (with encryption icon)
    2. Simulate TDMA burst across spectrum:
       - 40% chance each bar spikes
       - Height: original → (50-95%) → restore
    3. Add entry to SIGINT Log:
       - freq: "L16_DATA"
       - decode: "ENCRYPTED"
       - entity: "SWAF_AWACS"
    4. Log to Transmission Log:
       - channel: "LINK 16"
       - type: "L16"
       - status: "SENT"
    5. Clear template selector
```

**เวลาแอนิเมชัน:** 600ms burst, then restore

---

##### **3️⃣ EMERGENCY BROADCAST (Distress)**

```
User clicks "⚠ DISTRESS"
    ↓
CommsManager.emergencyBroadcast()
    ↓
Confirmation Dialog: "CONFIRM DISTRESS BROADCAST..."
    ↓
❌ if Cancel → return (ยกเลิก)
✅ if Confirm:
    1. Load default mayday message (if empty)
    2. Show Toast "DISTRESS" (warning/error color)
    3. Spike Guard Bar to 98%
    4. Add TWO entries to SIGINT:
       - 121.500 MHz DISTRESS BURST
       - L16_DATA DISTRESS ENCRYPTED
    5. Log transmission with type "DISTRESS"
```

---

### **PHASE 4: Real-time Updates (การอัปเดตแบบสดเพื่อ)**

#### **Live Updates Timer (ทุก 5 วินาที)**

```
setInterval every 5000ms:
    ↓
30% probability: simulateSignalDetection()
    - Pick random spectrum bar
    - Spike to 50-90% for 1500ms
    - Highlight as "detected signal"
    
80% probability: Add random SIGINT entry
    - Select from predefined sources:
        • 118.250 (ATC Stockholm)
        • 134.100 (ATC Gothenburg)
        • 243.000 (Unknown Marine)
        • UHF_SAT_2 (SWAF AWACS)
    - Randomize: bearing, signal strength
    - Add to table (newest first)
    - Keep max 50 entries
```

**รายการสัญญาณเสมือน:**

```javascript
const sources = [
    { freq: '118.250', bearing: '185°/42NM', decode: 'CLEAR VOICE', entity: 'CIV_ATC_STHLM' },
    { freq: '134.100', bearing: '210°/28NM', decode: 'CLEAR VOICE', entity: 'CIV_ATC_GOT' },
    { freq: '243.000', bearing: '045°/95NM', decode: 'PULSE_BEACON', entity: 'UNKNOWN_MARINE' },
    { freq: 'UHF_SAT_2', bearing: 'N/A(ORBITAL)', decode: 'ENCRYPTED_DATA', entity: 'SWAF_AWACS' }
];
```

---

#### **Sweep Animation (ทุก 200ms)**

```
setInterval every 200ms:
    ↓
For each spectrum bar:
    - If NOT tuned (bg-tertiary) → randomize height
    - Height: 10% + random(70%)
    - Opacity: 0.3 + random(0.5)
    
15% probability:
    - Guard Bar (121.5) spikes to 75-95%
    - Simulates occasional activity on emergency freq
```

---

#### **Zulu Clock (ทุก 1 วินาที)**

```
setInterval every 1000ms:
    ↓
Get current UTC time
    ↓
Format: "ZULU HH:MM:SS"
    ↓
Update element #shared-zulu-clock
```

---

### **PHASE 5: AI Integration (การบูรณาการ AI)**

#### **5A: AI Threat Listener**

```
loadAIThreatListener()
    ↓
window.addEventListener('ai-update', callback)
    ↓
When AI event fires with phase='DETECT':
    if AISystem.state.threatScore > 50:
        ↓
        showQuickAlert()
            ├─ Display modal with threat score
            ├─ Button: "TRANSMIT WARNING"
            ├─ Button: "DISMISS"
            └─ Auto-dismisses after user action
```

**Quick Alert Modal:**
```
┌────────────────────────────────┐
│ ⚠ THREAT DETECTED             │
├────────────────────────────────┤
│ AI Threat Score: 75%           │
│ Quick broadcast available      │
│ [📡 TRANSMIT WARNING] [DISMISS]│
└────────────────────────────────┘
```

---

#### **5B: AI SIGINT Listener**

```
loadAISigintListener()
    ↓
window.addEventListener('ai-signal-analysis', callback)
    ↓
When AI event fires with signal analysis:
    ↓
    addSigintEntry({
        time: now,
        freq: detail.type,           // e.g., "VOICE", "SIGINT"
        bearing: `AI/${prob}%`,       // e.g., "AI/95%"
        sigStrength: '-58 dBm',
        decode: detail.msg,          // AI analysis text
        entity: 'AI_SIGINT'
    })
    ↓
    Insert as new row in SIGINT table (top priority)
```

**AI Analysis Types:**
- `VOICE`: Voice stress detection
- `SIGINT`: Encrypted datalink patterns
- `IFF`: Transponder information
- `INTENT`: Flight path analysis

---

### **PHASE 6: Modal Dialogs (ไดอะล็อกและปอปอัป)**

#### **Channel Detail Modal**

```
Triggered by: showChannelDetail(channel)
Content:
├─ Channel Name
├─ Frequency Display
├─ Status
├─ Type
├─ Encryption Method
├─ Tune Input (if applicable)
└─ Close/Tune buttons
```

---

#### **SIGINT Detail Modal**

```
Triggered by: handleTableClick() → showSigintDetail(data)
Content:
├─ Signal Details Grid:
│  ├─ Frequency
│  ├─ Bearing
│  ├─ Signal Strength
│  ├─ Time Detected
│  └─ Entity Reference
├─ Decoded Message
└─ Action Buttons:
   ├─ DISMISS
   └─ TUNE TO SIGNAL → tuneToSignal(freq)
```

---

#### **Transmission Log Modal**

```
Triggered by: showTxLog()
Content:
├─ Table of all transmissions (max 20):
│  ├─ Time (Zulu)
│  ├─ Channel
│  ├─ Type (GUARD/L16/DISTRESS)
│  ├─ Message preview
│  └─ Status
├─ Export Log button → exportTxLog()
│  (Creates CSV file: tx_log_YYYY-MM-DD.csv)
└─ Close button
```

---

#### **Guard Options Modal**

```
Triggered by: showGuardOptions() [when clicking Guard bar]
Content:
├─ Signal Display:
│  ├─ Current Signal: -52 dBm
│  └─ Classification: UNMODULATED CARRIER
├─ Action Buttons:
│  ├─ [📡 TRANSMIT WARNING]
│  ├─ [🎯 TUNE TO FREQUENCY]
│  └─ [⚠ SEND DISTRESS]
└─ Each action has specific behavior:
   ├─ TRANSMIT: Load fighter template & transmit
   ├─ TUNE: Lock to 121.500 MHz
   └─ DISTRESS: Load mayday & transmit
```

---

## 🎯 องค์ประกอบหลัก

### **Data Structures**

```javascript
CommsManager = {
    // State
    audioMuted: { link16, guard, sat },
    signals: [],
    txLog: [],
    currentFreq: null,
    
    // Timers
    liveUpdateTimer: null,
    sweepTimer: null,
    
    // Flags
    initialized: boolean,
    aiThreatListenerLoaded: boolean,
    aiSigintListenerLoaded: boolean,
    
    // Templates
    templates: {
        fighter: "...",
        cargo: "...",
        aircraft: "...",
        breach: "...",
        mayday: "..."
    }
}
```

---

### **Key DOM Elements**

| ID | Purpose | Type | Updates |
|----|---------|------|---------|
| `header-placeholder` | Top navigation | Injected | ไม่ระบุ |
| `sidebar-placeholder` | Side navigation | Injected | ไม่ระบุ |
| `spectrum-container` | Spectrum bars wrapper | Div | High frequency |
| `.spectrum-bar` | Individual frequency bars | Divs | Real-time |
| `#bar-guard` | Guard frequency bar | Div | Real-time (special) |
| `#shared-zulu-clock` | Zulu time display | Span | Every 1s |
| `#sigint-body` | SIGINT table body | Tbody | Event-based |
| `#tx-message` | Message textarea | Textarea | User input |
| `#sweep-status` | Sweep control button | Button | On toggle |
| `#sweep-indicator` | Sweep status badge | Span | On toggle |
| `#tuned-freq-display` | Current tuned frequency | Span | On tune |

---

## 📡 ระบบ Events & Listeners

### **Custom Events (จาก AI System)**

#### **1. ai-update Event**
```javascript
// Emitted by: AISystem.log()
// When: Threat detection phase completes
Detail: { timestamp, phase, message, threatScore, confidence }

// Listener in Comms:
if (phase === 'DETECT' && threatScore > 50) {
    showQuickAlert();  // Display threat warning
}
```

#### **2. ai-signal-analysis Event**
```javascript
// Emitted by: AISystem.analyzeSignal()
// When: AI completes SIGINT analysis
Detail: { type, msg, prob }

// Listener in Comms:
addSigintEntry({
    time: now,
    freq: type,              // VOICE, SIGINT, IFF, INTENT
    bearing: `AI/${prob*100}%`,
    sigStrength: '-58 dBm',
    decode: msg,
    entity: 'AI_SIGINT'
});
```

#### **3. ai-asset-recommendation Event**
```javascript
// Emitted by: AISystem.recommendAsset()
// When: Asset optimization completes
// Listener: Typically in Asset-ready.html
```

---

### **Browser Events**

| Event | Listener | Action |
|-------|----------|--------|
| `DOMContentLoaded` | - | Trigger CommsManager.init() |
| `popstate` | window | Re-initialize on browser back |
| `click` | Channel buttons | showChannelDetail() |
| `change` | Template select | loadTemplate() |
| `click` | Spectrum bars | tuneToSignal() |
| `click` | SIGINT rows | handleTableClick() |
| `click` | Guard bar | showGuardOptions() |

---

## 🔄 ลำดับการทำงาน

### **Scenario 1: Detection & Warning Transmission**

```
1. User navigates to comms.html
   └─ CommsManager.init() triggers
   
2. AI System detects threat (e.g., unknown aircraft)
   └─ AISystem.state.threatScore = 75
   └─ Emits 'ai-update' event
   
3. Comms listener catches event
   └─ threatScore > 50
   └─ showQuickAlert() displays modal
   
4. User clicks "TRANSMIT WARNING"
   └─ Message auto-filled with fighter template
   └─ transmitGuard() executes:
      ├─ Validate message (not empty)
      ├─ Toast notification
      ├─ Spike Guard Bar animation
      ├─ Add entry to SIGINT log
      ├─ Log transmission
      └─ Clear template selector
   
5. Real-time systems updated
   └─ Transmission Log modal updated
   └─ SIGINT table refreshed
   └─ Guard frequency active indicator
```

---

### **Scenario 2: Encrypted Data Burst (LINK 16)**

```
1. User manually composes tactical message
   └─ Clicks "ALERT TEMPLATE" → selects "cargo"
   └─ Template loads into textarea
   └─ User edits if needed
   
2. User clicks "ENCRYPTED BURST (L16)"
   └─ transmitL16() executes:
      ├─ Validate message
      ├─ Toast "TX: LINK 16"
      ├─ TDMA Burst Animation:
      │  └─ 40% chance each bar (except Guard) spikes
      │  └─ Heights: 50-95% for 600ms
      ├─ Add SIGINT entry (type: ENCRYPTED, entity: SWAF_AWACS)
      ├─ Log to transmission history
      └─ Clear template
   
3. Spectrum visualization updates
   └─ Multiple bars flash simultaneously
   └─ User sees distributed TDMA pattern
   
4. Next live update cycle
   └─ Log entry visible in SIGINT table
   └─ Transmission Log updated
```

---

### **Scenario 3: Signal Detection & Investigation**

```
1. Live Update Timer fires (5s interval)
   └─ Random probability triggers signal simulation
   └─ Random spectrum bar spikes to 50-90%
   └─ Held for 1500ms
   
2. User notices spike on Guard bar (121.5 MHz)
   └─ Clicks on Guard bar visualization
   
3. showGuardOptions() modal displays
   └─ Shows detected signal: -52 dBm
   └─ Shows classification: UNMODULATED CARRIER
   
4. User chooses action:
   
   Option A: TUNE TO FREQUENCY
   └─ tuneToSignal('121.500')
      ├─ Highlight Bar spectrum-bar with bg-tertiary
      ├─ Set height to 80%
      ├─ Display "TUNED: 121.500" indicator
      └─ Toast "Locked to 121.500"
   
   Option B: TRANSMIT WARNING
   └─ Load fighter template
   └─ transmitGuard() executes
   └─ Same as Scenario 1 steps 4-5
   
5. User can click row in SIGINT table later
   └─ showSigintDetail() shows full details
   └─ Can choose to tune or dismiss
```

---

### **Scenario 4: Real-time Spectrum Monitoring**

```
Timeline:
T=0s: Page loads
     └─ CommsManager.init()
     └─ Zulu Clock starts
     └─ Sweep Animation starts
     └─ Live Updates Timer starts

T=0.2s: First Sweep Animation cycle
       └─ All bars (except Guard) randomize
       └─ Guard Bar pulses independently

T=1s: Zulu Clock update (first tick)
     └─ "ZULU 12:44:02"

T=5s: Live Updates cycle fires
     └─ 30% signal simulation
     └─ 80% new SIGINT entry
     └─ New row added to table (newest at top)

T=5.2s: Another Sweep Animation cycle
       └─ Heights randomized again

T=10s: Second Live Updates cycle
      └─ Another possible signal/entry

... (continuous looping)

User Can At Any Time:
- Click channel buttons → Modal with tuning
- Click spectrum bar → Highlight & tune
- Click SIGINT row → Details modal
- Select template → Fill textarea
- Type message → Custom input
- Click transmit button → Execute transmission
- Click sweep button → Toggle animation
- Click TX LOG → View history
```

---

## 💡 Use Cases

### **Use Case 1: Intercepting Unknown Aircraft**

```
Situation: AI detects unidentified aircraft approaching airspace
Expected Flow:
   1. AI threat score rises above 50
   2. Quick Alert modal appears
   3. Operator clicks "TRANSMIT WARNING"
   4. Fighter template loads + transmits on Guard 121.5
   5. Message echoes in SIGINT log
   6. Guard Bar visualization spikes
   7. Transmission logged in TX Log modal
   
Result: All units hear warning broadcast on Guard frequency
```

---

### **Use Case 2: Tactical Coordination (LINK 16)**

```
Situation: Need to send encrypted coordinate update to AWACS
Expected Flow:
   1. Operator manually composes message
   2. Clicks "ALERT TEMPLATE" → selects appropriate type
   3. Edits template as needed
   4. Clicks "ENCRYPTED BURST (L16)"
   5. TDMA burst animation across spectrum
   6. Burst logged to SIGINT with encryption marker
   7. Entry shows in transmission log
   
Result: Secure encrypted message sent to LINK 16 network (AWACS)
```

---

### **Use Case 3: Monitoring Active Signals**

```
Situation: Keeping watch on multiple frequencies during patrol
Expected Flow:
   1. Operator keeps Guard frequency highlighted
   2. Operator monitors SIGINT table for new entries
   3. Every 5 seconds, system simulates random signals
   4. New rows appear (civilian ATC, marine beacons, etc.)
   5. If interesting signal detected, click row
   6. Details modal shows frequency, bearing, strength
   7. Operator can tune or take action
   
Result: Real-time monitoring of tactical communications
```

---

### **Use Case 4: Emergency Broadcast**

```
Situation: Critical situation requiring immediate broadcast
Expected Flow:
   1. Operator clicks "⚠ DISTRESS" button
   2. Confirmation dialog appears
   3. If operator confirms:
      ├─ Default Mayday message auto-loaded
      ├─ Transmitted on ALL channels
      ├─ Guard Bar spikes dramatically
      ├─ SIGINT log updated with distress entries (×2)
      ├─ TX Log marked as "DISTRESS" type
      └─ Toast notification (error/warning color)
   
Result: Emergency broadcast sent to all stations
```

---

### **Use Case 5: Export & Documentation**

```
Situation: Need to document communication history after mission
Expected Flow:
   1. Operator clicks "📋 TX LOG" button
   2. Transmission Log modal opens
   3. Shows all previous transmissions (up to 20 entries)
   4. Each entry shows: time, channel, type, message, status
   5. Operator clicks "EXPORT LOG"
   6. CSV file downloaded: tx_log_2026-04-24.csv
   7. File contains all transmissions in spreadsheet format
   
Result: Mission communications documented and archived
```

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│                     COMMS PAGE                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Action                                            │
│  ↓                                                       │
│  CommsManager Function                                  │
│  ├─ Validation                                          │
│  ├─ DOM Updates                                         │
│  ├─ Data Logging                                        │
│  └─ Event Dispatch                                      │
│  ↓                                                       │
│  Visual Feedback                                        │
│  ├─ Toast Notification                                  │
│  ├─ Spectrum Animation                                  │
│  ├─ SIGINT Table Update                                 │
│  └─ Modal Display                                       │
│  ↓                                                       │
│  Persistent Storage                                     │
│  ├─ txLog Array                                         │
│  ├─ Current Frequency                                   │
│  └─ Audio Mute State                                    │
│  ↓                                                       │
│  AI Integration                                         │
│  └─ Event Listener (receives ai-update/ai-signal)       │
│     └─ Auto-update SIGINT / Show Alert                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Summary

หน้า **comms.html** เป็นศูนย์ควบคุมการสื่อสารที่ซับซ้อน โดยใช้:

- **3 Layout Sections**: Control Panel, Spectrum Visualization, SIGINT Log
- **6 Main Phases**: Initialization, Layout, User Interactions, Real-time Updates, AI Integration, Modal Dialogs
- **Multiple Timers**: Zulu Clock (1s), Live Updates (5s), Sweep Animation (200ms)
- **Template System**: Pre-defined messages (Fighter, Cargo, Aircraft, Breach, Mayday)
- **Transmission Types**: Guard (121.5 MHz), Encrypted Link 16, Distress Broadcast
- **AI Integration**: Threat detection alerts, SIGINT analysis
- **Logging & Export**: TX log storage, CSV export capability
- **Visual Feedback**: Animations, modals, toasts, spectrum visualization

ระบบนี้ออกแบบมาสำหรับการสื่อสารทางทหาร โดยคำนึงถึงความเร็ว ความแม่นยำ และความปลอดภัย

---

**Last Updated:** 2026-04-24
**Status:** Workflow Documentation Complete

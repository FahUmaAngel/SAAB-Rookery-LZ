# COMMS Page — Flow & Functionality Reference

> Based on actual code in `comms.html`. All functions, events, and flows documented from source.

---

## Asset Ready — Completeness Confirmation

ก่อนเข้า COMMS ยืนยัน Asset Ready ครบถ้วนแล้ว:

| Function | เรียกจาก | สถานะ |
|---|---|---|
| `exportCSV()` | EXPORT CSV button | ✅ |
| `aiOptimizeScramble()` | AI OPTIMIZE SCRAMBLE button | ✅ |
| `refreshData()` | FORCE REFRESH button | ✅ |
| `setIncidentActive()` | Incident cards | ✅ |
| `selectQRASlot()` | QRA-1, QRA-2, QRA-3 cards | ✅ |
| `scramble()` | SCRAMBLE button | ✅ |
| `showPreFlightChecklist()` | CHECKLIST button | ✅ |
| `showLoadoutConfig()` | LOADOUT button | ✅ |
| `showBaseDetail()` | Base cards (F7, F17, F21) | ✅ |
| `sort()` | Table column headers (5 คอลัมน์) | ✅ |
| `showDetail()` | Maintenance table rows | ✅ (เพิ่งแก้) |
| `updateKPIs()` | init, scramble, refreshData | ✅ (เพิ่งเพิ่ม) |

---

## COMMS Page — ภาพรวม

`comms.html` คือ workstation ด้านการสื่อสารและการดักฟังสัญญาณ (SIGINT) ของระบบ C2 ประกอบด้วย 2 ส่วนหลัก:

```
┌──────────────────────────────────────────────────────────────────┐
│  Left Column (320px fixed)    │  Right Column (fluid)           │
│  ─────────────────────────    │  ──────────────────────────     │
│  [Communication Channels]     │  [Active Intercept Spectrum]    │
│  [TX Control Panel]           │  [SIGINT Log Table]             │
│  [Encryption Status + Clock]  │                                 │
└──────────────────────────────────────────────────────────────────┘
                               │
                    CommsManager (JS object)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
         ai-system.js                SharedComponents
     (AI event pipeline)             (toast, header, nav)
```

---

## State ของ CommsManager

```javascript
CommsManager = {
    audioMuted:              { link16: false, guard: false, sat: false },
    txLog:                   [],          // ประวัติการส่งทั้งหมด (in-memory)
    signals:                 [],          // ไม่ได้ใช้งานปัจจุบัน
    liveUpdateTimer:         null,        // timer ของ startLiveUpdates()
    sweepTimer:              null,        // timer ของ startSweepAnimation()
    initialized:             false,
    aiThreatListenerLoaded:  false,
    aiSigintListenerLoaded:  false,
    currentFreq:             null,        // ความถี่ที่ tuned อยู่ปัจจุบัน
    templates:               { fighter, cargo, aircraft, breach, mayday }
}
```

---

## 1. Initialization Flow

เมื่อหน้าโหลด script เรียก `CommsManager.init()` ทันที (ไม่รอ DOMContentLoaded ถ้า DOM พร้อมแล้ว)

```
Page Load
    │
    ├─→ CommsManager.init()
    │       │
    │       ├─→ startZuluClock()        [ทุก 1 วินาที]
    │       ├─→ startLiveUpdates()      [ทุก 5 วินาที]
    │       ├─→ startSweepAnimation()   [ทุก 200ms]
    │       ├─→ loadAIThreatListener()  [ลงทะเบียน event listener 1 ครั้ง]
    │       └─→ loadAISigintListener()  [ลงทะเบียน event listener 1 ครั้ง]
    │
    └─→ SharedComponents (header + sidebar inject)
```

### 1.1 `startZuluClock()`
อัปเดต `#shared-zulu-clock` ทุก 1 วินาที แสดง UTC เช่น `ZULU 14:32:07`

### 1.2 `startLiveUpdates()`
ทุก **5 วินาที**:
- **30% โอกาส** → `simulateSignalDetection()` — spike bar สุ่มในสเปกตรัมชั่วคราว
- **20% โอกาส** → `addSigintEntry()` — เพิ่มแถวใหม่ใน SIGINT log จาก sources list 4 แหล่ง

### 1.3 `startSweepAnimation()`
ทุก **200ms**: ปรับความสูง + opacity ของทุก `.spectrum-bar` แบบสุ่ม
- **ข้ามบาร์ที่ tuned** (class `bg-tertiary`) เพื่อไม่รบกวนการแสดง
- สุ่ม 15% โอกาส spike guard bar (121.5 MHz)

---

## 2. Communication Channels Panel

```
┌─────────────────────────────────────────────┐
│  LINK 16          [100%]  [🔊] → clickable  │
│  GUARD 121.5 MHz  [MON]   [🔊] → clickable  │  ← amber pulse
│  SAT UPLINK       [STDBY] [🔊] → clickable  │
│  SECURE GROUND    [lock]       → clickable  │
└─────────────────────────────────────────────┘
```

### 2.1 คลิก Channel Card → `showChannelDetail(channelId)`

รับ channelId: `'LINK16'` | `'GUARD'` | `'SAT'` | `'SECURE'`

**Flow:**
```
คลิก card
    │
    └─→ showChannelDetail(id)
            │
            ├─→ lookup ข้อมูลจาก channels object ภายใน:
            │       LINK16: freq=JD081-225, encryption=AES-256
            │       GUARD:  freq=121.500 MHz, encryption=NONE
            │       SAT:    freq=UHF 243-400 MHz, encryption=TRANSOMET
            │       SECURE: freq=Fiber Optic, encryption=TYPE 1
            │
            ├─→ สร้าง modal แสดง: freq, type, status, encryption
            │
            └─→ [ถ้าไม่ใช่ SECURE] แสดง TUNE input + ปุ่ม TUNE
                    └─→ คลิก TUNE → tuneToSignal(freq) + ปิด modal
```

### 2.2 คลิกปุ่ม 🔊 → `toggleAudio(channel)`

```
คลิก volume button (stopPropagation ไม่ trigger card click)
    │
    └─→ toggleAudio('link16' | 'guard' | 'sat')
            │
            ├─→ flip audioMuted[channel]
            └─→ เปลี่ยน icon: volume_up ↔ volume_off
```

> หมายเหตุ: `stopPropagation()` ถูกใช้บนปุ่มเสียง เพื่อไม่ให้การคลิก audio ไปเปิด channel modal ด้วย

---

## 3. Transmission Control Panel

```
┌────────────────────────────────────────────┐
│  TX: ARMED        [⚠️ DISTRESS]  [PHASE 4 QRA] │
│                                            │
│  ALERT TEMPLATE: [── select ──▼]          │
│  MESSAGE: [_____________________________]  │
│           [TRANSMIT ON GUARD]              │
│           [ENCRYPTED BURST (L16)]          │
└────────────────────────────────────────────┘
```

### 3.1 Select Template → `loadTemplate(type)`

```
เลือก dropdown option
    │
    └─→ loadTemplate(type)
            │
            └─→ ใส่ข้อความใน #tx-message textarea
                    fighter:  "UNIDENTIFIED MILITARY AIRCRAFT..."
                    cargo:    "CARGO VESSEL [NAME]..."
                    aircraft: "UNIDENTIFIED AIRCRAFT ON SQUAWK 7000..."
                    breach:   "WARNING - RESTRICTED AIRSPACE VIOLATION..."
                    mayday:   "MAYDAY MAYDAY MAYDAY..."
```

### 3.2 TRANSMIT ON GUARD → `transmitGuard()`

```
คลิก TRANSMIT ON GUARD
    │
    ├─→ [validate] ถ้า textarea ว่าง → toast "NO MESSAGE" → หยุด
    │
    ├─→ toast: "TX: GUARD 121.5" (type: error/red)
    │
    ├─→ spike #bar-guard → height 98% → กลับปกติใน 800ms
    │
    ├─→ addSigintEntry({ freq: '121.500', decode: 'WARNING BURST', entity: 'SWAF_GUARD_TX' })
    │
    ├─→ logTransmission({ channel: '121.500 MHz', type: 'GUARD', message, status: 'SENT' })
    │
    └─→ reset select dropdown (value = '')
```

### 3.3 ENCRYPTED BURST (L16) → `transmitL16()`

```
คลิก ENCRYPTED BURST
    │
    ├─→ [validate] ถ้า textarea ว่าง → toast "NO MESSAGE" → หยุด
    │
    ├─→ toast: "TX: LINK 16 - Encrypted burst sent"
    │
    ├─→ spectrum burst animation:
    │       forEach .spectrum-bar (ไม่ใช่ guard bar, ไม่ใช่ bg-tertiary)
    │           40% โอกาส spike ชั่วคราว 600ms
    │
    ├─→ addSigintEntry({ freq: 'L16_DATA', bearing: 'TDMA_NET', decode: 'ENCRYPTED', entity: 'SWAF_AWACS' })
    │
    ├─→ logTransmission({ channel: 'LINK 16', type: 'L16', message, status: 'SENT' })
    │
    └─→ reset select dropdown
```

### 3.4 DISTRESS Button → `emergencyBroadcast()`

```
คลิก DISTRESS (แดง, pulse)
    │
    ├─→ confirm() dialog: "CONFIRM DISTRESS BROADCAST - Will transmit on ALL channels."
    │
    ├─→ [ถ้า textarea ว่าง] → auto-fill ด้วย MAYDAY default message
    │
    ├─→ toast: "DISTRESS - Emergency broadcast on ALL channels" (type: error)
    │
    ├─→ logTransmission({ channel: 'ALL CHANNELS', type: 'DISTRESS', ... })
    │
    ├─→ addSigintEntry x2:
    │       - { freq: '121.500', decode: 'DISTRESS BURST', entity: 'SWAF_DISTRESS_TX' }
    │       - { freq: 'L16_DATA', decode: 'DISTRESS ENCRYPTED', entity: 'SWAF_DISTRESS_TX' }
    │
    └─→ spike #bar-guard → 98% → กลับปกติใน 1200ms
```

---

## 4. Spectrum Analyzer

```
VHF/UHF Spectrum (100–140 MHz)
│
│        █                           ← bar-guard (121.5 MHz) amber pulse
│  ▄  ▄▄ █▄  ▃▃ ▃  ▄ ▄▄  ▄▄▄ ▄▄ ▄
└──────────────────────────────────────
  100  110  120(↑GUARD)  130  140 MHz
                              ↑ sweep ทุก 200ms
```

### 4.1 คลิก Spectrum Bar → `tuneToSignal(freq)`

```
คลิก bar (แต่ละ bar มี freq ผูกอยู่: 100.0, 102.5, ... 140.0)
    │
    ├─→ [validate] ถ้า freq = '--' → return
    │
    ├─→ currentFreq = freq
    │
    ├─→ ลบ highlight เดิม: ลบ bg-tertiary จากทุก bar
    │
    ├─→ highlight bar ที่ตรงกับ freq: เพิ่ม bg-tertiary, height=80%, opacity=1
    │
    ├─→ แสดง #tuned-freq-display: "TUNED: 118.2 MHz" (ซ่อนอยู่ → show)
    │
    └─→ toast: "TUNING - Locked to [freq]"
```

### 4.2 คลิก Guard Bar (121.5 MHz) → `showGuardOptions()`

```
คลิก #bar-guard
    │
    └─→ showGuardOptions()
            │
            └─→ modal แสดง signal info (-52 dBm, UNMODULATED CARRIER)
                    3 ปุ่ม:
                    ├─→ [TRANSMIT WARNING]
                    │       ├─→ ปิด modal
                    │       ├─→ ใส่ template fighter ใน textarea
                    │       └─→ transmitGuard()
                    │
                    ├─→ [TUNE TO FREQUENCY]
                    │       ├─→ ปิด modal
                    │       └─→ tuneToSignal('121.500')
                    │
                    └─→ [SEND DISTRESS]
                            ├─→ ปิด modal
                            ├─→ ใส่ "MAYDAY MAYDAY MAYDAY - " + templates.mayday
                            └─→ transmitGuard()
```

### 4.3 Toggle Sweep → `toggleSweep()`

```
คลิกปุ่ม STOP/START
    │
    ├─→ [ถ้า ACTIVE] → หยุด sweepTimer + เปลี่ยน indicator เป็น "SWEEP: STOPPED"
    │                    toast: "RADAR SWEEP Stopped"
    │
    └─→ [ถ้า STOPPED] → เริ่ม startSweepAnimation() ใหม่ + indicator → "SWEEP: ACTIVE"
                         toast: "RADAR SWEEP Active"
```

---

## 5. SIGINT Log Table

```
┌──────────┬──────────┬─────────────┬──────────┬──────────────────┬──────────────────┐
│ TIME (Z) │ FREQ     │ SRC_BRG     │ SIG_STR  │ DECODE_CLASS     │ ENTITY REF       │
├──────────┼──────────┼─────────────┼──────────┼──────────────────┼──────────────────┤
│ 12:44:02 │ 118.250  │ 184°/45NM   │ -65 dBm  │ CLEAR VOICE      │ CIV_ATC_STOCKHOLM│ ← คลิกได้
│ 12:44:58 │ 121.500  │ 092°/68NM   │ -52 dBm  │ UNMODULATED CARR │ Bogey_Golf_42    │ ← amber highlight
└──────────┴──────────┴─────────────┴──────────┴──────────────────┴──────────────────┘
```

### 5.1 คลิก Row → `handleTableClick(e)` → `showSigintDetail(data)`

```
คลิก row ใน #sigint-body
    │
    ├─→ handleTableClick(e)
    │       ├─→ event.target.closest('tr')
    │       ├─→ [skip] ถ้าเป็น thead หรือ freq = '--'
    │       └─→ อ่านค่า cells[0..5] → ส่งไป showSigintDetail(data)
    │
    └─→ showSigintDetail(data)
            │
            └─→ modal แสดง: freq, bearing, sigStr, decoded message, entity
                    2 ปุ่ม:
                    ├─→ [DISMISS] → ปิด modal
                    └─→ [TUNE TO SIGNAL] → tuneToSignal(data.freq) + ปิด modal
```

### 5.2 เพิ่ม Entry ใหม่ → `addSigintEntry(data)`

เรียกโดย: `transmitGuard()`, `transmitL16()`, `emergencyBroadcast()`, `startLiveUpdates()`, `loadAISigintListener()`

```
addSigintEntry({ time, freq, bearing, sigStrength, decode, entity })
    │
    ├─→ [dedup check] ถ้ามี row ที่มี time + freq เดิมอยู่แล้ว → return (ไม่เพิ่ม)
    │
    ├─→ สร้าง <tr> ใหม่ (primary/cyan highlight style)
    │
    ├─→ insertBefore(row, tbody.firstChild) → เพิ่มที่ด้านบนสุด
    │
    └─→ จำกัด 50 แถว: ลบแถวท้ายสุดออกถ้าเกิน
```

---

## 6. Encryption Status Bar + TX Log

```
┌─────────────────────────────────────────────────────────┐
│  🛡 CRYPTO KEY: ENCRYPTED SECURE    [TX LOG]  ZULU 14:32:07 │
└─────────────────────────────────────────────────────────┘
```

### 6.1 TX LOG Button → `showTxLog()`

```
คลิก TX LOG
    │
    ├─→ [guard] ถ้า #tx-log-modal มีอยู่แล้ว → return (ป้องกัน duplicate modal)
    │
    └─→ สร้าง modal (#tx-log-modal) แสดงตาราง:
            TIME | CHANNEL | TYPE | MESSAGE (30 chars) | STATUS
            │
            ├─→ render จาก this.txLog array (ที่ตอนนี้บันทึกอยู่ใน memory)
            │
            └─→ 2 ปุ่ม:
                    ├─→ [EXPORT LOG] → exportTxLog()
                    └─→ [CLOSE] → ปิด modal
```

> หมายเหตุ: `logTransmission()` มี logic update `#tx-log-body` ถ้า modal เปิดอยู่ ทำให้ log live-update ได้ขณะดูอยู่

### 6.2 Export TX Log → `exportTxLog()`

```
คลิก EXPORT LOG
    │
    ├─→ [validate] ถ้า txLog.length === 0 → toast "NO LOG" → return
    │
    ├─→ สร้าง CSV:
    │       header: TIME, CHANNEL, TYPE, MESSAGE, STATUS
    │       rows: จาก txLog array
    │
    ├─→ new Blob([csv], { type: 'text/csv' })
    │
    ├─→ URL.createObjectURL(blob) → <a>.click() → download
    │
    ├─→ URL.revokeObjectURL(url) → คืน memory
    │
    └─→ toast: "EXPORTED - TX log downloaded"
```

### 6.3 `logTransmission(data)` — Internal

```javascript
data = { time, channel, type, message, status }
```

- เพิ่มลง `this.txLog` ที่ index 0 (ใหม่สุดอยู่บน)
- ถ้า `#tx-log-body` มีอยู่ในหน้า (modal เปิด) → เพิ่ม row ทันที
- จำกัด 20 แถวใน modal (ลบแถวท้ายสุดออก)

---

## 7. AI Integration

COMMS page ไม่ได้เรียก AI โดยตรง แต่รับ event จาก `ai-system.js` ผ่าน CustomEvent

### 7.1 `loadAIThreatListener()` — ฟัง `ai-update`

```
ai-system.js dispatch: CustomEvent('ai-update', { phase: 'DETECT', ... })
    │
    └─→ CommsManager listener
            │
            ├─→ [check] phase === 'DETECT' && AISystem.state.threatScore > 50
            │
            └─→ [ถ้าผ่าน] showQuickAlert()
                    │
                    └─→ สร้าง #quick-alert overlay (floating, top center):
                            - แสดง threat score
                            - ปุ่ม [TRANSMIT WARNING] → quickAlert()
                            - ปุ่ม [DISMISS] → ลบ overlay
```

### 7.2 `quickAlert()`

```
คลิก TRANSMIT WARNING บน quick-alert overlay
    │
    ├─→ ใส่ auto-warning message ใน #tx-message
    ├─→ ลบ #quick-alert overlay
    └─→ transmitGuard()
```

### 7.3 `loadAISigintListener()` — ฟัง `ai-signal-analysis`

```
ai-system.js dispatch: CustomEvent('ai-signal-analysis', { type, msg, prob })
    │
    └─→ CommsManager listener
            │
            └─→ addSigintEntry({
                    time: now (UTC),
                    freq: detail.type (e.g. 'VOICE', 'SIGINT'),
                    bearing: `AI/${prob*100}%`,
                    sigStrength: '-58 dBm',
                    decode: detail.msg,
                    entity: 'AI_SIGINT'
                })
```

---

## 8. Full User Flows

### Flow A: Routine Monitoring
```
1. เปิดหน้า COMMS
2. startSweepAnimation() เริ่มทำงาน → bars เคลื่อนไหว
3. startLiveUpdates() ทุก 5s → SIGINT log อัปเดตเอง
4. Zulu clock แสดง real-time UTC
5. สังเกต GUARD bar (amber pulse) = มีสัญญาณ 121.5 MHz อยู่เสมอ
```

### Flow B: ดักสัญญาณแล้วส่งคำเตือน
```
1. เห็น row ใน SIGINT log ที่น่าสงสัย (Bogey_Golf_42 บน 121.500)
2. คลิก row → showSigintDetail() → อ่านข้อมูลครบ
3. คลิก [TUNE TO SIGNAL] → bar 121.5 highlight amber
4. ปิด detail modal
5. เลือก template "Russian Fighter Intercept" จาก dropdown
6. textarea auto-fill ด้วยข้อความมาตรฐาน
7. คลิก [TRANSMIT ON GUARD]
   ├─ toast ยืนยัน
   ├─ bar-guard spike → 98%
   ├─ SIGINT log เพิ่ม entry SWAF_GUARD_TX
   └─ txLog บันทึกการส่ง
8. คลิก TX LOG → ดูประวัติยืนยัน
```

### Flow C: Emergency Distress
```
1. ได้รับ Mayday จาก SIGINT (GUARD 121.500 active)
2. คลิก GUARD bar → showGuardOptions() modal
3. คลิก [SEND DISTRESS]
   ├─ auto-fill MAYDAY message
   └─ transmitGuard() ทำงาน
   หรือ
4. คลิกปุ่ม [DISTRESS] (แดง, pulse) ที่ TX panel
   ├─ confirm() dialog
   ├─ broadcast ALL channels
   ├─ SIGINT log: 121.500 + L16_DATA
   └─ guard bar spike 1.2s
```

### Flow D: AI Threat Alert
```
1. ai-system.js วิเคราะห์ภัยคุกคาม → dispatch ai-update (threatScore > 50)
2. CommsManager รับ event → showQuickAlert()
3. Floating overlay ปรากฏ: "THREAT DETECTED — Score: 75%"
4. คลิก [TRANSMIT WARNING]
   ├─ auto-fill warning message
   ├─ ปิด overlay
   └─ transmitGuard() ทำงาน
```

### Flow E: ดูและ Export TX History
```
1. คลิก TX LOG
2. modal แสดงประวัติทั้งหมด (สูงสุด 20 แถวใน modal)
3. คลิก EXPORT LOG
   ├─ สร้าง CSV จาก txLog array
   └─ browser download: tx_log_YYYY-MM-DD.csv
```

---

## 9. Event System ภาพรวม

```
            ai-system.js
                 │
    ┌────────────┴─────────────┐
    │                          │
    ▼                          ▼
CustomEvent                CustomEvent
'ai-update'            'ai-signal-analysis'
    │                          │
    ▼                          ▼
showQuickAlert()         addSigintEntry()
(threat overlay)         (new SIGINT row)
```

**Events ที่ COMMS ส่งออก (ปัจจุบัน):** ไม่มี — COMMS เป็น subscriber เท่านั้น

---

## 10. Functions ทั้งหมด

| Function | Trigger | หน้าที่ |
|---|---|---|
| `init()` | Page load | เริ่มระบบทั้งหมด |
| `startZuluClock()` | init | clock UTC ทุก 1s |
| `startLiveUpdates()` | init | simulate SIGINT entries ทุก 5s |
| `startSweepAnimation()` | init, toggleSweep | animate spectrum bars ทุก 200ms |
| `simulateSignalDetection()` | startLiveUpdates | spike bar สุ่ม 1.5s |
| `loadAIThreatListener()` | init | subscribe 'ai-update' event |
| `loadAISigintListener()` | init | subscribe 'ai-signal-analysis' event |
| `loadTemplate(type)` | dropdown change | fill textarea ด้วย template |
| `transmitGuard()` | button click | ส่งบน 121.5 MHz + log |
| `transmitL16()` | button click | ส่ง encrypted burst + log |
| `emergencyBroadcast()` | DISTRESS button | ส่งทุก channel + log |
| `toggleAudio(ch)` | volume button | toggle mute icon |
| `showChannelDetail(id)` | channel card click | modal ข้อมูล channel |
| `showGuardOptions()` | guard bar click | modal 3 quick actions |
| `tuneToSignal(freq)` | bar click / modal | highlight bar + show TUNED |
| `toggleSweep()` | STOP/START button | start/stop sweep timer |
| `handleTableClick(e)` | tbody click | delegate → showSigintDetail |
| `showSigintDetail(data)` | handleTableClick | modal รายละเอียด signal |
| `addSigintEntry(data)` | multiple callers | prepend row to SIGINT table |
| `showQuickAlert()` | AI threat event | floating threat overlay |
| `quickAlert()` | overlay button | auto-fill + transmitGuard |
| `logTransmission(data)` | transmit functions | บันทึก txLog + update modal |
| `showTxLog()` | TX LOG button | modal ประวัติการส่ง |
| `exportTxLog()` | modal button | CSV download จาก txLog |

---

## 11. หมายเหตุสำคัญ

- **State ไม่ persistent** — reload หน้า = txLog และ SIGINT log หายทั้งหมด
- **SIGINT live rows ถูกจำกัดที่ 50 แถว** ใน DOM (แถวเก่าสุดถูกลบออก)
- **TX Log modal จำกัดที่ 20 แถว** แต่ `txLog` array ไม่มีขีดจำกัด (เก็บทั้งหมด)
- **Dedup ใน addSigintEntry** ป้องกัน entry ซ้ำ (time + freq เดียวกัน)
- **emergencyBroadcast** ใช้ `confirm()` dialog ทั่วไป ไม่ใช่ custom modal
- **`window.CommsManager`** ถูก expose ออกสู่ global เพื่อให้ pages อื่นเรียกได้
- **`reinit()`** รองรับ SPA navigation ผ่าน popstate event

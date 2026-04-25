# Asset Ready Page - Flow & Operation Documentation

## Overview
หน้า Asset Ready เป็นระบบจัดการ Fleet Management และ Quick Reaction Alert (QRA) สำหรับกองทัพอากาศ SAAB ใช้ติดตามสถานะความพร้อมของอากาศยาน การจัดการเหตุการณ์ฉุกเฉิน และการระดมเครื่องบินขึ้นปฏิบัติการ

---

## User Flow การทำงาน

### 1. เริ่มต้นหน้าเว็บ (Page Load)
```
[Asset-ready.html] ──loads──► [asset-ready.js] ──init()──► [Telemetry starts]
                                                │
                                                ├── Search Input Setup
                                                ├── Incident Active Setup
                                                ├── KPI Sync
                                                └── Entry Animations
```

### 2. Incident Management Flow
```
User clicks Incident Card
         │
         ▼
setIncidentActive(incidentId)
         │
         ├── Highlight selected card (ring-sky-400)
         ├── Update incident style (opacity, border)
         └── Store selectedIncidentId
```

### 3. QRA Selection & Scramble Flow
```
Step 1: User clicks QRA Slot
        │
        ▼
selectQRASlot(slotNum)
        │
        ├── Highlight selected slot (border-sky-500)
        └── Store selectedQRA

Step 2: User clicks SCRAMBLE button
        │
        ▼
scramble()
        │
        ├── Validate: Check QRA selected?
        ├── Validate: Check not already scrambled?
        ├── Validate: Check status not COLD/STANDBY?
        │
        ├── Update status to "SCRAMBLED"
        ├── Add to scrambledSlots Set
        ├── Update Live Metrics (standby -1, scrambled +1)
        ├── Create mission from incident
        └── Update KPIs
```

### 4. Pre-Flight Checklist Flow
```
User clicks CHECKLIST button
         │
         ▼
showPreFlightChecklist() ──creates modal with checklist items
         │
         ├── User clicks items to check/uncheck
         ├── Toggle status PENDING ↔ CHECKED
         ├── Update visual (checkbox, color, label)
         │
         └── User clicks "Initiate Launch"
             │
             ├── Validate: All items checked?
             │    ├── If NO: Show warning toast
             │    └── If YES: Call scramble()
             │
             └── Close modal
```

### 5. Weapon Loadout Flow
```
User clicks LOADOUT button
         │
         ▼
showLoadoutConfig() ──creates modal with weapons list
         │
         ├── Display munitionStock from data
         ├── User clicks to toggle selection
         │
         └── User clicks "Confirm Configuration"
              │
              └── Close modal + Show toast
```

### 6. Base Detail Flow
```
User clicks Airbase Card
         │
         ▼
showBaseDetail(baseName)
         │
         ├── Get base data from defined object
         ├── Find grounded aircraft at base
         ├── Create modal with:
         │    - Wing Designation
         │    - Location
         │    - Readiness Level (progress bar)
         │    - QRA Status
         │    - Pilots Active
         │    - Grounded Aircraft list
         │
         └── Two buttons:
              ├── "AI Optimization" → recommendAsset()
              └── "Close Intel" → Close modal
```

### 7. Search & Sort Flow
```
Search Input:
User types → input event → searchQuery updated
                           │
                           ▼
filterTable() ──filters rows by:
                - assetId
                - base
                - procedure
                - status
                │
                └── Apply sort + Show filtered

Sort:
User clicks column header → sort(column)
                         │
                         ├── Toggle ascending/descending
                         ├── Update sort arrows UI
                         └── Apply sort + Show
```

### 8. Refresh Data Flow
```
User clicks FORCE REFRESH
         │
         ▼
refreshData()
         │
         ├── Button shows "REFRESHING..."
         ├── Wait 800ms
         │
         ├── Randomize QRA statuses (HOT/WARM/COLD)
         ├── Randomize incident times
         ├── Recalculate live metrics:
         │    - Patrolling = 8 (fixed)
         │    - Standby = calculated
         │    - Scrambled = scrambledSlots.size
         │
         ├── Update all KPIs
         └── Show "DATA UPDATED" toast
```

### 9. Export CSV Flow
```
User clicks EXPORT CSV
         │
         ▼
exportCSV()
         │
         ├── Collect maintenance table data:
         │    - Asset ID
         │    - Base
         │    - Procedure
         │    - Est. Downtime
         │    - Status
         │
         ├── Create CSV content
         ├── Generate download link
         ├── Auto download file
         └── Show "EXPORT SUCCESS" toast
```

### 10. AI Optimize Flow
```
User clicks AI OPTIMIZE SCRAMBLE
         │
         ▼
aiOptimizeScramble()
         │
         ├── Find first available QRA slot
         ├── Select that slot
         ├── Call AISystem.recommendAsset()
         │
         └── Show toast: "QRA-X selected — [Base] recommended"
```

---

## Data Structures

### qraData Object
```javascript
{
    1: { pilot: 'LT Berg',  aircraft: 'JAS 39C / 391', fuel: 85, temp: 42 },
    2: { pilot: 'LT Lind',  aircraft: 'JAS 39E / 394', fuel: 92, temp: 38 },
    3: { pilot: 'TBD',      aircraft: 'STANDBY',        fuel: 0,  temp: 0  }
}
```

### munitionStock Object
```javascript
{
    'Meteor BVR':   { qty: 42, threshold: 20, level: '85%', status: 'OPTIMAL' },
    'IRIS-T SRAAM': { qty: 28, threshold: 15, level: '70%', status: 'NOMINAL' },
    'GBU-39 SDB':   { qty: 12, threshold: 30, level: '40%', status: 'REORDER' },
    'AIM-120B':    { qty: 32, threshold: 20, level: '75%', status: 'OPTIMAL' },
    'KEP 500':     { qty: 8,  threshold: 5,  level: '60%', status: 'NOMINAL' }
}
```

---

## UI Components

### 1. Header
- Title: "Fleet Management"
- Status badge: "SYS: ONLINE // REFRESH: LIVE // TELEMETRY: ACTIVE"
- Buttons: EXPORT CSV, AI OPTIMIZE SCRAMBLE, FORCE REFRESH

### 2. Incident Feed (Col 4)
- แสดงเหตุการณ์ฉุกเฉินล่าสุด
- แต่ละ card แสดง: เวลา, ระดับความรุนแรง, รายละเอียด, ชื่อยาน, ระยะทาง

### 3. QRA Panel (Col 8)
- 3 QRA Slots แสดง pilot, aircraft, status
- Status indicators: HOT (pulse), WARM, COLD, STANDBY, SCRAMBLED
- Buttons: SCRAMBLE, CHECKLIST, LOADOUT

### 4. KPIs Row
- **Fleet Availability**: 84% (+2.4% 24H)
- **QRA Ready Status**: 2/3 slots ready
- **Ground Alerts**: 3 units grounded + badges

### 5. Airbase Status
- 3 bases: F7 Såtenäs, F17 Kallinge, F21 Luleå
- แสดง: aircraft availability %, munitions inventory %
- Warning indicator สำหรับ F21 Luleå (DEGRADED)

### 6. Maintenance Table
- Columns: Asset Designation, Station, Procedure, Downtime Est., Current Status
- Filter input: ค้นหาด้วย asset ID หรือ base
- Sortable columns
- Click row → showDetail()

### 7. Live Metrics Footer
- 4 counters: Patrolling, Standby, Grounded, Scrambled
- Real-time updates via telemetry

---

## Key Functions Summary

| Function | Description |
|----------|-------------|
| `init()` | Initialize manager, setup listeners |
| `scramble()` | Launch selected QRA aircraft |
| `selectQRASlot()` | Select QRA slot |
| `showBaseDetail()` | Show base info modal |
| `showPreFlightChecklist()` | Show checklist modal |
| `showLoadoutConfig()` | Show weapon loadout modal |
| `showDetail()` | Show asset maintenance detail |
| `filterTable()` | Filter maintenance table |
| `sort()` | Sort table by column |
| `refreshData()` | Refresh all data |
| `exportCSV()` | Export to CSV file |
| `aiOptimizeScramble()` | AI-optimize scramble |
| `updateKPIs()` | Sync KPI displays |

---

## Event Listeners

1. **ai-asset-recommendation**: รับคำแนะนำจาก AI → highlight base card
2. **DOMContentLoaded**: เรียก init() เมื่อหน้าโหลดเสร็จ
3. **search input**: กรองตารางตาม query
4. **checklist items**: toggle check status
5. **loadout items**: toggle weapon selection

---

## Feature Status

**ครบถ้วน** ✅ ทุก function ทำงานครบถ้วน
- ✅ Incident Management
- ✅ QRA Selection & Scramble
- ✅ Pre-Flight Checklist
- ✅ Weapon Loadout Configuration
- ✅ Base Detail View
- ✅ Maintenance Table (Search, Sort, Filter)
- ✅ CSV Export
- ✅ Force Refresh
- ✅ AI Optimize
- ✅ Real-time Telemetry
- ✅ KPI Synchronization
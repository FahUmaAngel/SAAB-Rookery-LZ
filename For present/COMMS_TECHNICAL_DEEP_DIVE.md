# SAAB C2 Comms Page - Deep Dive Technical Documentation
## In-Depth Function Analysis & Implementation Details

---

## 🔬 Detailed Function Breakdown

### **Section 1: Initialization Phase**

#### **1.1 CommsManager.init()**

```javascript
// Called automatically when DOM ready
CommsManager.init = function() {
    // Guard: prevent re-initialization
    if (this.initialized) return;
    this.initialized = true;
    
    // Sequential initialization
    this.startZuluClock();
    this.startLiveUpdates();
    this.startSweepAnimation();
    this.loadAIThreatListener();
    this.loadAISigintListener();
};
```

**What Happens:**
1. Flag set to true (prevent duplicate init)
2. Five sub-systems start in order
3. All are non-blocking (async execution)

**Timeline:**
```
T=0ms: init() called
    ├─ startZuluClock() → Clock running (every 1s)
    ├─ startLiveUpdates() → Timer queued (first at 5s)
    ├─ startSweepAnimation() → Animation loop (every 200ms)
    ├─ loadAIThreatListener() → Listener attached
    └─ loadAISigintListener() → Listener attached

T=200ms: First sweep animation cycle
T=1000ms: First zulu clock tick
T=5000ms: First live update
```

---

#### **1.2 startZuluClock()**

```javascript
CommsManager.startZuluClock = function() {
    const update = () => {
        const el = document.getElementById('shared-zulu-clock');
        if (!el) return;
        
        const now = new Date();
        const h = String(now.getUTCHours()).padStart(2, '0');
        const m = String(now.getUTCMinutes()).padStart(2, '0');
        const s = String(now.getUTCSeconds()).padStart(2, '0');
        
        el.textContent = `ZULU ${h}:${m}:${s}`;
    };
    
    update();  // Call once immediately
    setInterval(update, 1000);  // Then every second
};
```

**Breakdown:**
1. Get current UTC time
2. Pad hours/minutes/seconds to 2 digits
3. Format: "ZULU HH:MM:SS"
4. Update DOM every 1000ms

**Example Output:**
```
ZULU 12:44:02
ZULU 12:44:03
ZULU 12:44:04
... (increments every second)
```

---

#### **1.3 startLiveUpdates()**

```javascript
CommsManager.startLiveUpdates = function() {
    // Prevent duplicate timers
    if (this.liveUpdateTimer) return;
    
    const sources = [
        { freq: '118.250', bearing: '185°/42NM', decode: 'CLEAR VOICE', 
          entity: 'CIV_ATC_STHLM' },
        { freq: '134.100', bearing: '210°/28NM', decode: 'CLEAR VOICE', 
          entity: 'CIV_ATC_GOT' },
        { freq: '243.000', bearing: '045°/95NM', decode: 'PULSE_BEACON', 
          entity: 'UNKNOWN_MARINE' },
        { freq: 'UHF_SAT_2', bearing: 'N/A(ORBITAL)', decode: 'ENCRYPTED_DATA', 
          entity: 'SWAF_AWACS' }
    ];
    
    const strengths = ['-65 dBm', '-70 dBm', '-75 dBm', '-80 dBm', '-55 dBm'];
    
    this.liveUpdateTimer = setInterval(() => {
        // 30% chance: trigger signal detection animation
        if (Math.random() > 0.7) {
            this.simulateSignalDetection();
        }
        
        // 80% chance: add new SIGINT entry
        if (Math.random() > 0.8) {
            const sig = sources[Math.floor(Math.random() * sources.length)];
            this.addSigintEntry({
                time: new Date().toUTCString().slice(17, 25),
                freq: sig.freq,
                bearing: sig.bearing,
                sigStrength: strengths[Math.floor(Math.random() * strengths.length)],
                decode: sig.decode,
                entity: sig.entity
            });
        }
    }, 5000);  // Every 5 seconds
};
```

**Probability Analysis:**
```
Every 5 seconds:
├─ 30% probability (Math.random() > 0.7):
│  └─ Spectrum bar spikes
├─ 20% probability (Math.random() > 0.8):
│  └─ New SIGINT entry added
└─ Both can happen in same cycle
```

**Expected Frequency:**
- Signal spikes: ~30% every 5s = 0.3 × 12/min = 3.6/min
- SIGINT entries: ~20% every 5s = 0.2 × 12/min = 2.4/min
- (Both are randomized)

---

#### **1.4 startSweepAnimation()**

```javascript
CommsManager.startSweepAnimation = function() {
    // Prevent duplicate timers
    if (this.sweepTimer) return;
    
    const bars = document.querySelectorAll('.spectrum-bar');
    
    this.sweepTimer = setInterval(() => {
        bars.forEach(bar => {
            // Skip Guard bar if tuned (bg-tertiary)
            if (bar.classList.contains('bg-tertiary')) return;
            
            // Randomize height between 10% and 80%
            bar.style.height = (10 + Math.random() * 70) + '%';
            
            // Randomize opacity between 0.3 and 0.8
            bar.style.opacity = 0.3 + Math.random() * 0.5;
        });
        
        // 15% chance per cycle
        if (Math.random() > 0.85) {
            const guardBar = document.getElementById('bar-guard');
            if (guardBar) {
                guardBar.style.height = (75 + Math.random() * 20) + '%';
            }
        }
    }, 200);  // Every 200ms
};
```

**Animation Details:**
- **Frequency:** 200ms = 5 cycles per second
- **Height Range:** 10% to 80% (randomized)
- **Opacity Range:** 0.3 to 0.8 (semi-transparent)
- **Guard Bar:** 15% chance to pulse between 75-95%
- **Exclusion:** Tuned frequency (bg-tertiary) not affected

**Visual Effect:**
```
Cycle 1: ▃ ▅ ▂ ▆ ▄ ▂ ▇ ▃ ▅
Cycle 2: ▂ ▄ ▅ ▃ ▆ ▅ ▂ ▆ ▄
Cycle 3: ▆ ▃ ▄ ▇ ▂ ▄ ▅ ▃ ▆
(continuous wave-like motion)
```

---

#### **1.5 loadAIThreatListener()**

```javascript
CommsManager.loadAIThreatListener = function() {
    // Prevent duplicate listeners
    if (this.aiThreatListenerLoaded) return;
    this.aiThreatListenerLoaded = true;
    
    window.addEventListener('ai-update', (e) => {
        // Check phase and threat score
        if (e.detail.phase === 'DETECT' && 
            window.AISystem?.state.threatScore > 50) {
            
            // Automatically show alert
            this.showQuickAlert();
        }
    });
};
```

**Trigger Conditions:**
- Event type: `ai-update`
- Event phase: `DETECT`
- Threat score: > 50 (on scale 0-100)

**Auto-Action:**
- When all conditions met → show Quick Alert modal

---

#### **1.6 loadAISigintListener()**

```javascript
CommsManager.loadAISigintListener = function() {
    // Prevent duplicate listeners
    if (this.aiSigintListenerLoaded) return;
    this.aiSigintListenerLoaded = true;
    
    window.addEventListener('ai-signal-analysis', (e) => {
        const detail = e.detail || {};
        
        // Add AI analysis to SIGINT table
        this.addSigintEntry({
            time: new Date().toUTCString().slice(17, 25),
            freq: detail.type || 'SIGINT',              // VOICE, SIGINT, IFF, INTENT
            bearing: `AI/${Math.round((detail.prob || 0.8) * 100)}%`,
            sigStrength: '-58 dBm',
            decode: detail.msg || 'AI analysis update',
            entity: 'AI_SIGINT'
        });
    });
};
```

**AI Data Processing:**
```
Raw AI Event:
{
    type: "VOICE",
    msg: "Voice stress detected...",
    prob: 0.95
}
    ↓
Transformed to SIGINT:
{
    time: "12:44:02",
    freq: "VOICE",           // From detail.type
    bearing: "AI/95%",       // From prob * 100
    sigStrength: "-58 dBm",  // Default
    decode: "Voice stress detected...",  // From detail.msg
    entity: "AI_SIGINT"      // Identifier
}
    ↓
Automatically added to SIGINT table
```

---

### **Section 2: Transmission Functions**

#### **2.1 transmitGuard()**

```javascript
CommsManager.transmitGuard = function() {
    // Get message from textarea
    const msg = document.getElementById('tx-message')?.value || '';
    
    // Validation: message must not be empty
    if (!msg.trim()) {
        window.SharedComponents?.showToast(
            'NO MESSAGE', 
            'Enter a message first', 
            'warning', 
            'warning'
        );
        return;  // Exit early if validation fails
    }
    
    // Show notification
    window.SharedComponents?.showToast(
        'TX: GUARD 121.5', 
        'Message transmitted', 
        'podcasts', 
        'error'
    );
    
    // Animate Guard Bar spike
    const guardBar = document.getElementById('bar-guard');
    if (guardBar) {
        guardBar.style.height = '98%';  // Spike to top
        setTimeout(() => {
            // Restore after 800ms
            guardBar.style.height = (75 + Math.random() * 20) + '%';
        }, 800);
    }
    
    // Get current time in Zulu format
    const now = new Date().toUTCString().slice(17, 25);
    
    // Add entry to SIGINT table
    this.addSigintEntry({
        time: now,
        freq: '121.500',
        bearing: 'BROADCAST',
        sigStrength: '-25 dBm',
        decode: 'WARNING BURST',
        entity: 'SWAF_GUARD_TX'
    });
    
    // Log transmission
    this.logTransmission({
        time: now,
        channel: '121.500 MHz',
        type: 'GUARD',
        message: msg,
        status: 'SENT'
    });
    
    // Reset template selector
    const sel = document.querySelector('select[onchange*="loadTemplate"]');
    if (sel) sel.value = '';
};
```

**Execution Flow:**
```
1. Get message (or empty string)
2. Validate non-empty
   ├─ If empty: Toast + return
   └─ If valid: Continue
3. Show TX toast
4. Guard Bar animation:
   ├─ Height → 98%
   ├─ Wait 800ms
   └─ Height → restore (75-95%)
5. Add SIGINT entry:
   ├─ time: current Zulu
   ├─ freq: 121.500
   ├─ decode: WARNING BURST
   └─ entity: SWAF_GUARD_TX
6. Log transmission:
   ├─ channel: "121.500 MHz"
   ├─ type: "GUARD"
   ├─ status: "SENT"
   └─ store in txLog array
7. Clear template selector
```

**Timing:**
```
T=0ms: Function called
T=10ms: Toast appears
T=50ms: Guard bar height = 98%
T=850ms: Guard bar height restored
T=860ms: SIGINT entry visible
T=870ms: TX log updated
T=900ms: Template cleared
```

---

#### **2.2 transmitL16()**

```javascript
CommsManager.transmitL16 = function() {
    const msg = document.getElementById('tx-message')?.value || '';
    
    // Validation
    if (!msg.trim()) {
        window.SharedComponents?.showToast(
            'NO MESSAGE', 
            'Enter a message first', 
            'warning', 
            'warning'
        );
        return;
    }
    
    // Show encrypted burst notification
    window.SharedComponents?.showToast(
        'TX: LINK 16', 
        'Encrypted burst sent', 
        'enhanced_encryption', 
        'primary'
    );
    
    // Simulate TDMA burst across spectrum
    // All bars (except Guard) have 40% chance to spike
    document.querySelectorAll('.spectrum-bar:not(#bar-guard)').forEach(bar => {
        // Skip if already tuned (tertiary)
        if (bar.classList.contains('bg-tertiary')) return;
        
        // 40% random chance per bar
        if (Math.random() > 0.4) {
            const origH = bar.style.height;  // Save original
            bar.style.height = (50 + Math.random() * 45) + '%';  // 50-95%
            
            // Restore after 600ms
            setTimeout(() => {
                bar.style.height = origH || (10 + Math.random() * 30) + '%';
            }, 600);
        }
    });
    
    // Get current time
    const now = new Date().toUTCString().slice(17, 25);
    
    // Add SIGINT entry
    this.addSigintEntry({
        time: now,
        freq: 'L16_DATA',
        bearing: 'TDMA_NET',
        sigStrength: '-40 dBm',
        decode: 'ENCRYPTED',
        entity: 'SWAF_AWACS'
    });
    
    // Log transmission
    this.logTransmission({
        time: now,
        channel: 'LINK 16',
        type: 'L16',
        message: msg,
        status: 'SENT'
    });
    
    // Clear template
    const sel = document.querySelector('select[onchange*="loadTemplate"]');
    if (sel) sel.value = '';
};
```

**Spectrum Burst Pattern:**
```
Before Transmission:
█ █ █ █ █ █ █ █ █ █ █ █

During Burst (random pattern):
█ ░ █ ░ █ █ ░ █ ░ █ █ ░
(40% of bars spike for 600ms)

After Burst:
█ █ █ █ █ █ █ █ █ █ █ █
(restored to original heights)
```

**Key Difference from Guard:**
- **Guard:** Single bar spike (Guard bar only)
- **L16:** Distributed TDMA burst (multiple bars)

---

#### **2.3 emergencyBroadcast()**

```javascript
CommsManager.emergencyBroadcast = function() {
    // Require user confirmation
    const confirmed = confirm(
        'CONFIRM DISTRESS BROADCAST - Will transmit on ALL channels. Continue?'
    );
    
    // Exit if not confirmed
    if (!confirmed) return;
    
    // Auto-load mayday message if empty
    const textarea = document.getElementById('tx-message');
    if (textarea && !textarea.value.trim()) {
        textarea.value = 'MAYDAY MAYDAY MAYDAY - SWAF DISTRESS RELAY ACTIVE - ' +
                        'ALL STATIONS MAINTAIN RADIO SILENCE AND STAND BY FOR TRAFFIC.';
    }
    
    // Show error-level toast (highest priority)
    window.SharedComponents?.showToast(
        'DISTRESS', 
        'Emergency broadcast on ALL channels', 
        'warning', 
        'error'
    );
    
    // Get time
    const now = new Date().toUTCString().slice(17, 25);
    
    // Log transmission with DISTRESS type
    this.logTransmission({
        time: now,
        channel: 'ALL CHANNELS',
        type: 'DISTRESS',
        message: textarea?.value || 'EMERGENCY BROADCAST',
        status: 'SENT'
    });
    
    // Add FIRST SIGINT entry (Guard frequency)
    this.addSigintEntry({
        time: now,
        freq: '121.500',
        bearing: 'BROADCAST',
        sigStrength: '-10 dBm',           // Much stronger than normal
        decode: 'DISTRESS BURST',
        entity: 'SWAF_DISTRESS_TX'
    });
    
    // Add SECOND SIGINT entry (L16 encrypted)
    this.addSigintEntry({
        time: now,
        freq: 'L16_DATA',
        bearing: 'TDMA_NET',
        sigStrength: '-10 dBm',
        decode: 'DISTRESS ENCRYPTED',
        entity: 'SWAF_DISTRESS_TX'
    });
    
    // Spike Guard bar dramatically
    const guardBar = document.getElementById('bar-guard');
    if (guardBar) {
        guardBar.style.height = '98%';
        setTimeout(() => {
            guardBar.style.height = (75 + Math.random() * 20) + '%';
        }, 1200);  // Longer spike (1.2s vs 0.8s)
    }
};
```

**Distress Flow:**
```
User clicks ⚠ DISTRESS
    ↓
Browser confirmation dialog:
"CONFIRM DISTRESS BROADCAST - Will transmit on ALL channels. Continue?"
    ├─ Click NO: Return early (no broadcast)
    └─ Click YES: Continue
    
1. Auto-load message if empty
2. Show error-level toast (red, loud)
3. Log transmission with type="DISTRESS"
4. Add TWO SIGINT entries:
   ├─ Guard 121.500 (DISTRESS BURST)
   └─ L16_DATA (DISTRESS ENCRYPTED)
5. Spike Guard bar for 1200ms (longer than normal)
6. Both channels show emergency broadcast
```

**Multi-Channel Effect:**
- Unlike Guard (121.5 only) or L16 (encrypted only)
- Distress broadcasts on ALL channels simultaneously
- Higher signal strength (-10 dBm vs -25/-40)
- Longer bar spike (1200ms vs 600-800ms)

---

### **Section 3: SIGINT Management**

#### **3.1 addSigintEntry()**

```javascript
CommsManager.addSigintEntry = function(data) {
    // Get reference to table body
    const tbody = document.getElementById('sigint-body');
    if (!tbody) return;
    
    // Prevent duplicates: check if entry already exists
    // (same time AND frequency)
    const duplicate = Array.from(tbody.querySelectorAll('tr')).find(tr =>
        tr.cells[0]?.textContent.trim() === data.time &&
        tr.cells[1]?.textContent.trim() === data.freq
    );
    if (duplicate) return;  // Skip if found
    
    // Create new table row
    const row = document.createElement('tr');
    row.className = 'bg-primary/10 border-l-2 border-l-primary ' +
                   'border-b border-outline-variant/30 ' +
                   'hover:bg-surface-container-high cursor-pointer transition-colors';
    
    // Fill row with data
    row.innerHTML = `
        <td class="py-2 px-4 text-primary font-bold">${data.time || '--'}</td>
        <td class="py-2 px-4 text-primary font-bold">${data.freq || '--'}</td>
        <td class="py-2 px-4">${data.bearing || '--'}</td>
        <td class="py-2 px-4">${data.sigStrength || '--'}</td>
        <td class="py-2 px-4 text-primary">${data.decode || '--'}</td>
        <td class="py-2 px-4 text-primary font-bold">${data.entity || '--'}</td>
    `;
    
    // Insert at top (newest first)
    if (tbody.firstChild) {
        tbody.insertBefore(row, tbody.firstChild);
    } else {
        tbody.appendChild(row);
    }
    
    // Limit to 50 rows max
    while (tbody.children.length > 50) {
        tbody.removeChild(tbody.lastChild);
    }
};
```

**Duplicate Prevention:**
```javascript
// Check: time AND freq must be unique
Existing: 12:44:02 | 118.250
New:      12:44:02 | 118.250
Result:   DUPLICATE → Skip

Existing: 12:44:02 | 118.250
New:      12:44:03 | 118.250
Result:   Different time → Allow

Existing: 12:44:02 | 118.250
New:      12:44:02 | 134.100
Result:   Different freq → Allow
```

**Row Ordering:**
```
Event Sequence:
1. addSigintEntry(entry1)
   └─ tbody: [entry1]

2. addSigintEntry(entry2)
   └─ tbody: [entry2, entry1]  ← Newest at top

3. addSigintEntry(entry3)
   └─ tbody: [entry3, entry2, entry1]  ← Always insert at top

(insertBefore(row, firstChild) places new row before existing first)
```

**Size Limit:**
```javascript
// Max 50 rows to prevent memory issues
if (tbody.children.length > 50) {
    // Delete oldest (last) row
    tbody.removeChild(tbody.lastChild);
}

// Example:
// Rows 1-50 in table
// New entry added → 51 rows
// Last row deleted → back to 50 rows
```

---

#### **3.2 showSigintDetail()**

```javascript
CommsManager.showSigintDetail = function(data) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    
    // Build HTML content
    modal.innerHTML = `
        <div class="bg-surface-container border border-outline-variant w-[450px] max-w-[90vw]">
            <!-- Header -->
            <div class="p-4 border-b border-outline-variant flex justify-between items-center 
                        bg-surface-variant/30">
                <h3 class="font-headline-md text-headline-md text-tertiary">SIGNAL DETAIL</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-outline hover:text-on-surface p-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <!-- Content -->
            <div class="p-4 space-y-3">
                <!-- Signal Details Grid -->
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <span class="text-[10px] text-outline">FREQUENCY</span>
                        <p class="text-on-surface font-bold">${data.freq}</p>
                    </div>
                    <div>
                        <span class="text-[10px] text-outline">BEARING</span>
                        <p class="text-on-surface">${data.bearing}</p>
                    </div>
                    <div>
                        <span class="text-[10px] text-outline">SIGNAL</span>
                        <p class="text-on-surface">${data.sigStr}</p>
                    </div>
                </div>
                
                <!-- Message/Decode -->
                <div class="border-t border-outline-variant pt-3">
                    <span class="text-[10px] text-outline">DECODED MESSAGE</span>
                    <p class="text-on-surface mt-1 font-data-mono">${data.decode}</p>
                </div>
                
                <!-- Entity & Time -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <span class="text-[10px] text-outline">DETECTED</span>
                        <p class="text-on-surface">${data.time}</p>
                    </div>
                    <div>
                        <span class="text-[10px] text-outline">ENTITY</span>
                        <p class="text-tertiary font-bold">${data.entity}</p>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="p-4 border-t border-outline-variant flex gap-2 justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-surface-variant border border-outline px-4 py-2 
                               text-[10px] font-bold uppercase">DISMISS</button>
                <button onclick="CommsManager.tuneToSignal('${data.freq}'); 
                                this.closest('.fixed').remove();" 
                        class="bg-tertiary text-black px-4 py-2 text-[10px] 
                               font-bold uppercase">TUNE TO SIGNAL</button>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(modal);
};
```

**Modal Structure:**
```
┌─────────────────────────────────────┐
│ SIGNAL DETAIL                   [X] │  ← Header
├─────────────────────────────────────┤
│ FREQUENCY   BEARING    SIGNAL       │
│ 118.250     184°/45NM  -65 dBm      │  ← Details Grid
│                                      │
│ DECODED MESSAGE                      │
│ CLEAR VOICE                         │  ← Decoded message
│                                      │
│ DETECTED        ENTITY              │
│ 12:44:02        CIV_ATC_STHLM       │  ← Time & source
├─────────────────────────────────────┤
│ [DISMISS]  [TUNE TO SIGNAL]         │  ← Footer buttons
└─────────────────────────────────────┘
```

---

#### **3.3 handleTableClick()**

```javascript
CommsManager.handleTableClick = function(e) {
    // Get the clicked row
    const row = e.target.closest('tr');
    
    // Validation: must be a data row (not header)
    if (!row || !row.cells || row.cells.length < 6) return;
    
    // Skip header rows
    if (row.closest('thead')) return;
    
    // Skip "awaiting" rows (empty signal)
    if (row.cells[1].textContent.trim() === '--') return;
    
    // Extract data from cells
    const data = {
        time: row.cells[0].textContent.trim(),
        freq: row.cells[1].textContent.trim(),
        bearing: row.cells[2].textContent.trim(),
        sigStr: row.cells[3].textContent.trim(),
        decode: row.cells[4].textContent.trim(),
        entity: row.cells[5].textContent.trim()
    };
    
    // Show detail modal
    this.showSigintDetail(data);
};
```

**Click Flow:**
```
User clicks SIGINT table row
    ↓
handleTableClick() triggered
    ├─ Event target: clicked cell
    ├─ Find closest 'tr' (row)
    ├─ Validate: 6 columns
    ├─ Skip if header or empty
    ├─ Extract: time, freq, bearing, sigStr, decode, entity
    └─ Call showSigintDetail(data)
        └─ Modal appears with full details
```

---

### **Section 4: Spectrum Control**

#### **4.1 tuneToSignal()**

```javascript
CommsManager.tuneToSignal = function(freq) {
    // Ignore if invalid frequency
    if (!freq || freq === '--') return;
    
    // Store current tuned frequency
    this.currentFreq = freq;
    
    // Clear previous tuning from all bars
    document.querySelectorAll('.spectrum-bar').forEach(bar => {
        bar.classList.remove('bg-tertiary');  // Remove highlight
        bar.style.opacity = '';               // Reset opacity
    });
    
    // Find and highlight bar matching frequency
    document.querySelectorAll('.spectrum-bar[onclick]').forEach(bar => {
        const onclick = bar.getAttribute('onclick') || '';
        
        // Check if bar's onclick contains this frequency
        if (onclick.includes(freq.replace(' MHz', '').trim())) {
            bar.classList.add('bg-tertiary');   // Highlight
            bar.style.height = '80%';           // Emphasize height
            bar.style.opacity = '1';            // Full opacity
        }
    });
    
    // Update display indicator
    const display = document.getElementById('tuned-freq-display');
    if (display) {
        display.textContent = `TUNED: ${freq}`;
        display.classList.remove('hidden');  // Show if hidden
    }
    
    // Show confirmation toast
    window.SharedComponents?.showToast(
        'TUNING', 
        `Locked to ${freq}`, 
        'graphic_eq', 
        'primary'
    );
};
```

**Tuning Process:**
```
User calls: tuneToSignal('121.500')
    ↓
1. Store: currentFreq = '121.500'
2. Clear all bar highlights:
   └─ Remove 'bg-tertiary' class from all bars
3. Find matching bar:
   └─ Search onclick attributes for '121.500'
4. Highlight matching bar:
   ├─ Add 'bg-tertiary' class (color)
   ├─ Set height to 80%
   └─ Set opacity to 1.0 (full)
5. Update display:
   └─ Set text "TUNED: 121.500"
   └─ Show indicator
6. Show toast confirmation
```

**Before Tuning:**
```
Spectrum: █ ▃ ░ █ ▄ ░ █ █ ▆ █ ░ █ ▃
Display:  TUNED: --
```

**After tuneToSignal('121.500'):**
```
Spectrum: █ ▃ ░ ▓ ▄ ░ █ █ ▆ █ ░ █ ▃
                 ↑ Guard bar (121.5) now highlighted
Display:  TUNED: 121.500
```

---

#### **4.2 toggleSweep()**

```javascript
CommsManager.toggleSweep = function() {
    // Get UI elements
    const btn = document.getElementById('sweep-status');
    const indicator = document.getElementById('sweep-indicator');
    
    // Check current state
    const isActive = indicator?.textContent === 'SWEEP: ACTIVE';
    
    if (isActive) {
        // STOP sweep
        if (btn) btn.textContent = 'START';
        
        if (indicator) {
            indicator.textContent = 'SWEEP: STOPPED';
            indicator.className = 'font-data-mono text-[10px] text-outline border border-outline px-1';
        }
        
        // Clear interval
        if (this.sweepTimer) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = null;
        }
        
        window.SharedComponents?.showToast('RADAR SWEEP', 'Stopped', 'radar', 'warning');
    } else {
        // START sweep
        if (btn) btn.textContent = 'STOP';
        
        if (indicator) {
            indicator.textContent = 'SWEEP: ACTIVE';
            indicator.className = 'font-data-mono text-[10px] text-tertiary border border-tertiary px-1';
        }
        
        // Restart animation
        this.startSweepAnimation();
        
        window.SharedComponents?.showToast('RADAR SWEEP', 'Active', 'radar', 'primary');
    }
};
```

**State Machine:**
```
Initial State: SWEEP: ACTIVE (running)
    ↓
User clicks [STOP]
    ├─ Clear interval
    ├─ Button text: "START"
    ├─ Indicator: "SWEEP: STOPPED" (gray)
    └─ Toast: "Stopped"

State: SWEEP: STOPPED
    ↓
User clicks [START]
    ├─ Restart interval
    ├─ Button text: "STOP"
    ├─ Indicator: "SWEEP: ACTIVE" (amber)
    └─ Toast: "Active"
```

---

### **Section 5: Real-time Updates**

#### **5.1 simulateSignalDetection()**

```javascript
CommsManager.simulateSignalDetection = function() {
    // Get all spectrum bars
    const bars = document.querySelectorAll('.spectrum-bar');
    if (!bars.length) return;
    
    // Pick random bar (exclude Guard and tuned bars)
    const randomBar = bars[Math.floor(Math.random() * bars.length)];
    
    // Skip if Guard bar or tuned frequency
    if (!randomBar || randomBar.classList.contains('bg-tertiary')) return;
    
    // Spike to 50-90%
    randomBar.style.height = (50 + Math.random() * 40) + '%';
    randomBar.classList.add('bg-tertiary');  // Highlight
    
    // Restore after 1500ms
    setTimeout(() => {
        randomBar.style.height = (10 + Math.random() * 30) + '%';
        randomBar.classList.remove('bg-tertiary');
    }, 1500);
};
```

**Animation Timeline:**
```
T=0ms:  Random bar selected (e.g., 118.250 MHz)
T=10ms: Height spike to 50-90%
T=20ms: Bar highlighted (bg-tertiary)

... (visible for 1500ms) ...

T=1510ms: Height reset to 10-40%
T=1520ms: Highlighting removed (bg-tertiary removed)
```

**Visual:**
```
Before: █ ░ █ ░ █ ▄ █ █ ▆ █ ░ █ ▃

Spike:  █ ░ █ ░ █ █ █ █ ▆ █ ░ █ ▃
                    ↑ Selected bar spikes

After:  █ ░ █ ░ █ ▂ █ █ ▆ █ ░ █ ▃
```

---

### **Section 6: Modal Dialogs**

#### **6.1 showGuardOptions()**

```javascript
CommsManager.showGuardOptions = function() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-surface-container border border-tertiary w-[350px] max-w-[90vw]">
            <!-- Header -->
            <div class="p-4 border-b border-tertiary flex justify-between items-center 
                        bg-tertiary/20">
                <h3 class="font-headline-md text-tertiary">GUARD 121.5 MHz</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-tertiary hover:text-on-surface">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <!-- Signal Info -->
            <div class="p-4 space-y-3">
                <div class="text-center mb-4">
                    <div class="text-[10px] text-outline">DETECTED SIGNAL</div>
                    <div class="text-2xl text-tertiary font-bold">-52 dBm</div>
                    <div class="text-tertiary text-[9px]">UNMODULATED CARRIER</div>
                </div>
                
                <!-- Action Buttons -->
                <button onclick="this.closest('.fixed').remove(); 
                                document.getElementById('tx-message').value = CommsManager.templates.fighter; 
                                CommsManager.transmitGuard();" 
                        class="w-full bg-tertiary text-black py-3 font-bold uppercase 
                               flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">podcasts</span>
                    TRANSMIT WARNING
                </button>
                
                <button onclick="this.closest('.fixed').remove(); 
                                CommsManager.tuneToSignal('121.500');" 
                        class="w-full border border-primary text-primary py-3 font-bold uppercase 
                               flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">graphic_eq</span>
                    TUNE TO FREQUENCY
                </button>
                
                <button onclick="this.closest('.fixed').remove(); 
                                var t=document.getElementById('tx-message'); 
                                if(t)t.value='MAYDAY MAYDAY MAYDAY - '+CommsManager.templates.mayday; 
                                CommsManager.transmitGuard();" 
                        class="w-full border border-error text-error py-3 font-bold uppercase 
                               flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">warning</span>
                    SEND DISTRESS
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};
```

**Three Action Paths:**

**Path 1: TRANSMIT WARNING**
```
User clicks button
    ↓
1. Close modal
2. Load fighter template → textarea
3. Call transmitGuard()
    └─ Full transmission workflow
```

**Path 2: TUNE TO FREQUENCY**
```
User clicks button
    ↓
1. Close modal
2. Call tuneToSignal('121.500')
    └─ Highlight Guard bar
    └─ Update display
```

**Path 3: SEND DISTRESS**
```
User clicks button
    ↓
1. Close modal
2. Prepend "MAYDAY MAYDAY MAYDAY - " to mayday template
3. Fill textarea
4. Call transmitGuard()
    └─ Transmit as normal guard message (but with mayday text)
```

---

#### **6.2 showQuickAlert()**

```javascript
CommsManager.showQuickAlert = function() {
    // Don't show duplicate
    const existing = document.getElementById('quick-alert');
    if (existing) return;
    
    // Get threat level
    const threat = window.AISystem?.state.threatScore || 0;
    
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.id = 'quick-alert';
    alertEl.className = 'fixed top-20 left-1/2 -translate-x-1/2 w-96 ' +
                       'bg-error-container border-2 border-error z-[100] p-4 animate-pulse';
    
    alertEl.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-error">warning</span>
            <span class="text-error font-bold uppercase">THREAT DETECTED</span>
        </div>
        
        <p class="text-on-surface text-sm mb-3">
            AI Threat Score: ${threat}% - Quick broadcast available
        </p>
        
        <button onclick="CommsManager.quickAlert()" 
                class="w-full bg-error text-white py-2 font-bold uppercase 
                       flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[16px]">podcasts</span>
            TRANSMIT WARNING
        </button>
        
        <button onclick="document.getElementById('quick-alert').remove()" 
                class="text-on-surface text-xs mt-2 w-full text-center">DISMISS</button>
    `;
    
    document.body.appendChild(alertEl);
};
```

**Alert Behavior:**
```
AI threat score > 50
    ↓
showQuickAlert() automatically called
    ↓
Modal appears at top-center of page
├─ Red border (error color)
├─ Pulsing animation
├─ Shows threat score
├─ Two buttons:
│  ├─ TRANSMIT WARNING → quickAlert()
│  └─ DISMISS → Remove modal
```

---

## 📈 Performance Considerations

### **Timer Overhead**
```
Concurrent Timers:
1. Zulu Clock:          every 1000ms
2. Live Updates:        every 5000ms
3. Sweep Animation:     every 200ms

Total: ~5 timer callbacks per second
Memory: ~15-20 array entries kept
Impact: Minimal on modern hardware
```

### **DOM Operations**
```
High-frequency updates:
- Spectrum bar heights (every 200ms)
- Opacity changes (every 200ms)

Medium-frequency updates:
- Table row addition (every 5s, ~20% probability)
- Zulu time update (every 1s)

Low-frequency updates:
- Modal creation (on user click)
- Transmission logging (on user action)
```

---

**Last Updated:** 2026-04-24
**Document Version:** 2.0 (Deep Dive)

/**
 * SensorDataEngine — Simulates live multi-domain sensor feeds for the C2 dashboard.
 * Dispatches 'sensor-update' CustomEvents on window every tick (~1.5s).
 *
 * Consumed by: Sensor-Fusion.html, sensor_map.html
 */

const SensorDataEngine = {
    /** Runtime state — restored from sessionStorage if available */
    state: {
        running: false,
        intervalId: null,
        tickCount: 0,

        // Multiple targets support
        targets: [
            {
                id: 'BOGEY_GOLF_42',
                callsign: 'BOGEY_GOLF_42',
                classId: 'SU-27 FLANKER',
                status: 'HOSTILE',
                lat: 57.30,
                lon: 19.05,
                heading: 285,
                speed: 0.85,
                speedKts: 520,
                altitude: 32000,
                altitudeTrend: 'DESCENDING',
                closureRate: -450,
                range: 12.4,
                squawk: 'NONE',
                transponder: false,
            },
            {
                id: 'TANGO_ALPHA_7',
                callsign: 'TANGO_ALPHA_7',
                classId: 'TU-95 BEAR',
                status: 'UNKNOWN',
                lat: 56.85,
                lon: 20.15,
                heading: 220,
                speed: 0.65,
                speedKts: 400,
                altitude: 28000,
                altitudeTrend: 'LEVEL',
                closureRate: -200,
                range: 45.0,
                squawk: 'NONE',
                transponder: false,
            },
            {
                id: 'NATO_1',
                callsign: 'NATO_1',
                classId: 'F-16C FALCON',
                status: 'FRIENDLY',
                lat: 58.10,
                lon: 17.80,
                heading: 90,
                speed: 0.95,
                speedKts: 580,
                altitude: 30000,
                altitudeTrend: 'LEVEL',
                closureRate: 0,
                range: 18.0,
                squawk: '4271',
                transponder: true,
            }
        ],

        // Active target index for sidebar detail
        activeTargetIndex: 0,

        // Sensor confidence (aggregated across all targets)
        sensors: {
            radar: { active: true, confidence: 96 },
            esm: { active: true, confidence: 88, signature: 'FLANKER-H' },
            satellite: { active: true, confidence: 72, source: 'ICEYE-X1' },
            iff: { active: true, confidence: 0 },
        },
        fusedConfidence: 94.2,

        // Interceptor (Gripen-1)
        interceptor: {
            callsign: 'GRIPEN-1',
            lat: 57.15,              // Starting lat (south of bogey)
            lon: 18.90,              // Starting lon (west of bogey)
            heading: 45,
            speed: 1.25,
            altitude: 28500,
            weaponStatus: 'ARM',
            weaponQty: 4,
        },

        // Phase management
        phase: 3,
        threatScore: 85,

        // Historical data for charts (last 60 ticks)
        history: [],

        // Audio alert settings
        audioEnabled: false,
    },

    /** Comms log messages to cycle through */
    _commsPool: [
        { src: 'ATC', msg: 'NEGATIVE RADIO CONTACT WITH UNKNOWN TRAFFIC.' },
        { src: 'GRIPEN-1', msg: 'MAINTAINING VISUAL. TARGET STABLE HEADING 274.' },
        { src: 'C2 HQ', msg: 'COPY GRIPEN-1. HOLD POSITION. RULES WEAPONS TIGHT.' },
        { src: 'GRIPEN-1', msg: 'TARGET ALTITUDE CHANGE DETECTED. NOW FL310.' },
        { src: 'ESM', msg: 'EMITTER SCAN: N001VE PULSE DOPPLER DETECTED.' },
        { src: 'GRIPEN-1', msg: 'BOGEY BANKING LEFT. NEW HEADING 260.' },
        { src: 'C2 HQ', msg: 'GRIPEN-1, CLOSE TO 5NM FOR VISUAL CONFIRMATION.' },
        { src: 'AWACS', msg: 'ADDITIONAL CONTACT DETECTED BEARING 095. EVALUATING.' },
        { src: 'GRIPEN-1', msg: 'NO EXTERNAL STORES ON TARGET. CLEAN CONFIGURATION.' },
        { src: 'C2 HQ', msg: 'ACKNOWLEDGED. CONTINUE SHADOWING. DO NOT ENGAGE.' },
        { src: 'ESM', msg: 'TARGET RADAR EMISSION CEASED. PASSIVE MODE.' },
        { src: 'GRIPEN-1', msg: 'TARGET DESCENDING THROUGH FL280. SPEED INCREASING.' },
        { src: 'ATC', msg: 'CIVILIAN TRAFFIC REROUTED CLEAR OF SECTOR 7.' },
        { src: 'C2 HQ', msg: 'PREPARE GUARD FREQUENCY WARNING TRANSMISSION.' },
        { src: 'GRIPEN-1', msg: 'ROGER. STANDING BY FOR AUTHORIZATION.' },
    ],
    _commsIndex: 0,

    /** Cross-tab sync via BroadcastChannel */
    _channel: null,
    _isLeader: false,

    /** Start the simulation loop */
    start() {
        if (this.state.running) return;

        // Try to restore state from sessionStorage
        this._restoreState();

        // --- Cross-tab leader election ---
        try {
            this._channel = new BroadcastChannel('sensor-data-sync');
            this._channel.onmessage = (e) => this._onChannelMessage(e.data);
        } catch (e) {
            // BroadcastChannel not supported, run as standalone leader
            this._channel = null;
        }

        // Check if another tab is already leading
        const leaderTS = parseInt(localStorage.getItem('sensorLeaderTS') || '0');
        const now = Date.now();

        if (now - leaderTS < 3000) {
            // Another tab is actively leading — become a follower
            this._isLeader = false;
            this.state.running = true;
            console.log('[SensorDataEngine] Started as FOLLOWER (syncing from leader tab)');
        } else {
            // No active leader — become the leader
            this._isLeader = true;
            localStorage.setItem('sensorLeaderTS', String(now));
            this.state.running = true;
            this.state.intervalId = setInterval(() => this._tick(), 1500);
            this._tick(); // Immediate first tick
            // Heartbeat to maintain leadership
            this._heartbeatId = setInterval(() => {
                localStorage.setItem('sensorLeaderTS', String(Date.now()));
            }, 1000);
            console.log('[SensorDataEngine] Started as LEADER');
        }

        // Leader failover: periodically check if leader is alive
        if (!this._isLeader) {
            this._failoverId = setInterval(() => {
                const ts = parseInt(localStorage.getItem('sensorLeaderTS') || '0');
                if (Date.now() - ts > 4000) {
                    // Leader is dead — take over
                    console.log('[SensorDataEngine] Leader failover — becoming LEADER');
                    this._isLeader = true;
                    localStorage.setItem('sensorLeaderTS', String(Date.now()));
                    clearInterval(this._failoverId);
                    this.state.intervalId = setInterval(() => this._tick(), 1500);
                    this._heartbeatId = setInterval(() => {
                        localStorage.setItem('sensorLeaderTS', String(Date.now()));
                    }, 1000);
                    this._tick();
                }
            }, 2000);
        }
    },

/** Handle messages from other tabs */
    _onChannelMessage(data) {
        if (data.type === 'tick' && !this._isLeader) {
            // Follower: apply the leader's state snapshot
            const p = data.payload;
            this.state.targets = p.targets;
            this.state.activeTargetIndex = p.activeTargetIndex;
            Object.assign(this.state.interceptor, p.interceptor);
            this.state.sensors.radar = { ...p.sensors.radar };
            this.state.sensors.esm = { ...p.sensors.esm };
            this.state.sensors.satellite = { ...p.sensors.satellite };
            this.state.fusedConfidence = p.fusedConfidence;
            this.state.phase = p.phase;
            this.state.tickCount = p.tick;
            this.state.threatScore = p.threatScore;
            this.state.history = p.history || [];
            // Dispatch local event so UI listeners update
            window.dispatchEvent(new CustomEvent('sensor-update', { detail: p }));
        } else if (data.type === 'phase') {
            this.state.phase = this._clamp(data.phase, 1, 5);
        } else if (data.type === 'activeTarget') {
            this.state.activeTargetIndex = data.index;
        } else if (data.type === 'audioToggle') {
            this.state.audioEnabled = data.enabled;
        }
    },

    /** Stop the simulation */
    stop() {
        if (!this.state.running) return;
        clearInterval(this.state.intervalId);
        clearInterval(this._heartbeatId);
        clearInterval(this._failoverId);
        this.state.running = false;
        if (this._isLeader) {
            localStorage.removeItem('sensorLeaderTS');
        }
        this._saveState();
        console.log('[SensorDataEngine] Stopped');
    },

    /** Single simulation tick (only executed by leader) */
    _tick() {
        this.state.tickCount++;
        const targets = this.state.targets;
        const i = this.state.interceptor;
        const s = this.state.sensors;

        // --- Update each target ---
        targets.forEach((t, idx) => {
            // Drift heading slightly
            t.heading = this._clampDeg(t.heading + this._jitter(0, 1.5));
            // Move position based on heading
            const rad = (t.heading * Math.PI) / 180;
            const speedFactor = t.id === 'NATO_1' ? 0.0006 : 0.0008;
            t.lat += Math.cos(rad) * speedFactor + this._jitter(0, 0.0001);
            t.lon += Math.sin(rad) * speedFactor * 1.5 + this._jitter(0, 0.0002);

            // Speed fluctuation
            t.speed = this._clamp(t.speed + this._jitter(0, 0.01), 0.60, 1.10);
            t.speedKts = Math.round(t.speed * 611);

            // Altitude drift
            const altBias = t.status === 'HOSTILE' ? -80 : 0;
            const altDelta = this._jitter(altBias, 50);
            t.altitude = this._clamp(Math.round(t.altitude + altDelta), 15000, 40000);
            t.altitudeTrend = altDelta < -20 ? 'DESCENDING' : altDelta > 20 ? 'CLIMBING' : 'LEVEL';

// Closure rate
            t.closureRate = this._clamp(Math.round(t.closureRate + this._jitter(0, 15)), -700, 100);
            t.range = this._clamp(+(t.range + t.closureRate / 3600 * 1.5).toFixed(1), 1.0, 80.0);
        });
        const activeTarget = targets[this.state.activeTargetIndex];

        // --- Interceptor ---
        i.heading = this._clampDeg(i.heading + this._jitter(0, 1));
        i.speed = this._clamp(+(i.speed + this._jitter(0, 0.005)).toFixed(2), 0.90, 1.60);
        i.altitude = this._clamp(Math.round(i.altitude + this._jitter(-30, 30)), 20000, 35000);

        // Move interceptor position based on heading
        const iRad = (i.heading * Math.PI) / 180;
        i.lat += Math.cos(iRad) * 0.001 + this._jitter(0, 0.0001);
        i.lon += Math.sin(iRad) * 0.0018 + this._jitter(0, 0.0002);

        // --- Sensor confidence jitter ---
        s.radar.confidence = this._clamp(Math.round(s.radar.confidence + this._jitter(0, 2)), 75, 99);
        s.esm.confidence = this._clamp(Math.round(s.esm.confidence + this._jitter(0, 3)), 60, 95);
        s.satellite.confidence = this._clamp(Math.round(s.satellite.confidence + this._jitter(0, 4)), 40, 90);
        this.state.fusedConfidence = this._clamp(
            +((s.radar.confidence * 0.5 + s.esm.confidence * 0.3 + s.satellite.confidence * 0.2) / 1).toFixed(1),
            70, 99
        );

        // --- Threat Score (dynamic) ---
        const rangeScore = this._clamp(100 - (activeTarget.range * 2), 0, 100);
        const closureScore = this._clamp(Math.abs(activeTarget.closureRate) / 7, 0, 100);
        const speedScore = this._clamp((activeTarget.speed - 0.5) * 100, 0, 100);
        this.state.threatScore = Math.round(rangeScore * 0.5 + closureScore * 0.3 + speedScore * 0.2);

        // --- Timestamp ---
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const zuluTime = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;

        // --- Generate comms message every 4 ticks ---
        let newComm = null;
        if (this.state.tickCount % 4 === 0) {
            const pool = this._commsPool;
            newComm = {
                time: zuluTime,
                src: pool[this._commsIndex % pool.length].src,
                msg: pool[this._commsIndex % pool.length].msg,
            };
            this._commsIndex++;
        }

        // --- Build history record ---
        const historyRecord = {
            tick: this.state.tickCount,
            zuluTime,
            targets: JSON.parse(JSON.stringify(targets)),
            activeTarget: targets[this.state.activeTargetIndex],
            interceptor: { ...i },
            sensors: JSON.parse(JSON.stringify(s)),
            fusedConfidence: this.state.fusedConfidence,
            phase: this.state.phase,
            threatScore: this.state.threatScore,
        };

        // Add to history (keep last 60 ticks)
        this.state.history.push(historyRecord);
        if (this.state.history.length > 60) {
            this.state.history.shift();
        }

        // --- Audio alert for hostile approach ---
        if (this.state.audioEnabled && activeTarget && activeTarget.status === 'HOSTILE' && activeTarget.range < 8) {
            this._playAlertSound();
        }

        // --- Dispatch event ---
        const payload = {
            tick: this.state.tickCount,
            zuluTime,
            targets: JSON.parse(JSON.stringify(targets)),
            activeTarget: activeTarget,
            activeTargetIndex: this.state.activeTargetIndex,
            interceptor: { ...i },
            sensors: JSON.parse(JSON.stringify(s)),
            fusedConfidence: this.state.fusedConfidence,
            threatScore: this.state.threatScore,
            phase: this.state.phase,
            newComm,
            history: JSON.parse(JSON.stringify(this.state.history)),
        };

        window.dispatchEvent(new CustomEvent('sensor-update', { detail: payload }));

        // Broadcast to follower tabs
        if (this._channel && this._isLeader) {
            try { this._channel.postMessage({ type: 'tick', payload }); } catch (e) { }
        }

        // Persist periodically
        if (this.state.tickCount % 10 === 0) this._saveState();
    },

    /** Set phase (called externally by phase progression buttons) */
    setPhase(phaseNumber) {
        this.state.phase = this._clamp(phaseNumber, 1, 5);
        this._saveState();
        if (this._channel) {
            try { this._channel.postMessage({ type: 'phase', phase: this.state.phase }); } catch (e) { }
        }
    },

    /** Set active target index */
    setActiveTarget(index) {
        if (index >= 0 && index < this.state.targets.length) {
            this.state.activeTargetIndex = index;
            this._saveState();
            if (this._channel) {
                try { this._channel.postMessage({ type: 'activeTarget', index }); } catch (e) { }
            }
        }
    },

    /** Enable/disable audio alerts */
    setAudio(enabled) {
        this.state.audioEnabled = enabled;
        if (this._channel) {
            try { this._channel.postMessage({ type: 'audioToggle', enabled }); } catch (e) { }
        }
    },

    /** Play alert sound */
    _playAlertSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) { }
    },

    /** Export data to JSON */
    exportData() {
        const data = {
            exportTime: new Date().toISOString(),
            tick: this.state.tickCount,
            phase: this.state.phase,
            threatScore: this.state.threatScore,
            targets: this.state.targets,
            interceptor: this.state.interceptor,
            sensors: this.state.sensors,
            fusedConfidence: this.state.fusedConfidence,
            history: this.state.history,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sensor_data_${this.state.tickCount}_${new Date().toISOString().slice(0,19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /** Export data to CSV */
    exportCSV() {
        const rows = [['tick', 'zuluTime', 'callsign', 'status', 'lat', 'lon', 'heading', 'speed', 'altitude', 'altitudeTrend', 'range']];
        this.state.history.forEach(h => {
            h.targets.forEach(t => {
                rows.push([
                    h.tick, h.zuluTime, t.callsign, t.status,
                    t.lat.toFixed(4), t.lon.toFixed(4), Math.round(t.heading),
                    t.speed.toFixed(2), t.altitude, t.altitudeTrend, t.range.toFixed(1)
                ]);
            });
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sensor_data_${this.state.tickCount}_${new Date().toISOString().slice(0,19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // --- Utilities ---
    _jitter(bias, amplitude) {
        return bias + (Math.random() - 0.5) * 2 * amplitude;
    },
    _clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },
    _clampDeg(deg) {
        return ((deg % 360) + 360) % 360;
    },

    _saveState() {
        try {
            const s = {
                ...this.state,
                running: false,
                intervalId: null,
                targets: this.state.targets,
                activeTargetIndex: this.state.activeTargetIndex,
                history: this.state.history,
                audioEnabled: this.state.audioEnabled,
            };
            sessionStorage.setItem('sensorDataState', JSON.stringify(s));
        } catch (e) { }
    },
    _restoreState() {
        try {
            const raw = sessionStorage.getItem('sensorDataState');
            if (!raw) return;
            const saved = JSON.parse(raw);
            this.state.targets = saved.targets || this.state.targets;
            this.state.activeTargetIndex = saved.activeTargetIndex ?? 0;
            Object.assign(this.state.interceptor, saved.interceptor || {});
            Object.assign(this.state.sensors, saved.sensors || {});
            this.state.fusedConfidence = saved.fusedConfidence ?? this.state.fusedConfidence;
            this.state.phase = saved.phase ?? this.state.phase;
            this.state.tickCount = saved.tickCount ?? 0;
            this.state.history = saved.history || [];
            this.state.audioEnabled = saved.audioEnabled ?? false;
            this._commsIndex = saved._commsIndex ?? 0;
            console.log('[SensorDataEngine] Restored state from session');
        } catch (e) { }
    },
};

window.SensorDataEngine = SensorDataEngine;

// Auto-start when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    SensorDataEngine.start();
});

// Cleanup on tab close — release leadership
window.addEventListener('beforeunload', () => {
    if (SensorDataEngine._isLeader) {
        localStorage.removeItem('sensorLeaderTS');
    }
});

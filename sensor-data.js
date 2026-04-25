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

        // Target kinematics
        target: {
            callsign: 'BOGEY_GOLF_42',
            classId: 'SU-27 FLANKER',
            lat: 57.30,               // Starting lat (near Gotland)
            lon: 19.05,               // Starting lon
            heading: 285,             // Degrees, WNW toward Gotland
            speed: 0.85,              // Mach
            speedKts: 520,            // Knots ground speed
            altitude: 32000,          // Feet
            altitudeTrend: 'DESCENDING',
            closureRate: -450,        // KTS (negative = closing)
            range: 12.4,              // NM from interceptor
            squawk: 'NONE',
            transponder: false,
        },

        // Sensor confidence
        sensors: {
            radar: { active: true, confidence: 96 },
            esm: { active: true, confidence: 88, signature: 'FLANKER-H' },
            satellite: { active: true, confidence: 72, source: 'ICEYE-X1' },
            iff: { active: true, confidence: 0 },   // No IFF response
        },
        fusedConfidence: 94.2,

        // Interceptor (Gripen-1)
        interceptor: {
            callsign: 'GRIPEN-1',
            heading: 45,
            speed: 1.25,             // Mach
            altitude: 28500,
            weaponStatus: 'ARM',
            weaponQty: 4,
        },

        // Phase management
        phase: 3,                    // 1-5 (Detection, Scramble, Visual ID, Warning, Escort)
        threatScore: 85,
    },

    /** Comms log messages to cycle through */
    _commsPool: [
        { src: 'ATC', msg: 'NEGATIVE RADIO CONTACT WITH UNKNOWN TRAFFIC.' },
        { src: 'GRIPEN-1', msg: 'MAINTAINING VISUAL. TARGET STABLE HEADING 285.' },
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
            Object.assign(this.state.target, p.target);
            Object.assign(this.state.interceptor, p.interceptor);
            this.state.sensors.radar = { ...p.sensors.radar };
            this.state.sensors.esm = { ...p.sensors.esm };
            this.state.sensors.satellite = { ...p.sensors.satellite };
            this.state.fusedConfidence = p.fusedConfidence;
            this.state.phase = p.phase;
            this.state.tickCount = p.tick;
            this.state.threatScore = p.threatScore;
            // Dispatch local event so UI listeners update
            window.dispatchEvent(new CustomEvent('sensor-update', { detail: p }));
        } else if (data.type === 'phase') {
            // Phase changed on another tab
            this.state.phase = this._clamp(data.phase, 1, 5);
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
        const t = this.state.target;
        const i = this.state.interceptor;
        const s = this.state.sensors;

        // --- Target kinematics ---
        // Drift heading slightly (±2°)
        t.heading = this._clampDeg(t.heading + this._jitter(0, 1.5));
        // Move position based on heading (simplified: ~0.001° per tick at ~520kts)
        const rad = (t.heading * Math.PI) / 180;
        t.lat += Math.cos(rad) * 0.0008 + this._jitter(0, 0.0001);
        t.lon += Math.sin(rad) * 0.0015 + this._jitter(0, 0.0002);

        // Speed fluctuation
        t.speed = this._clamp(t.speed + this._jitter(0, 0.01), 0.70, 1.10);
        t.speedKts = Math.round(t.speed * 611);

        // Altitude drift (descending bias)
        const altDelta = this._jitter(-80, 50);
        t.altitude = this._clamp(Math.round(t.altitude + altDelta), 15000, 38000);
        t.altitudeTrend = altDelta < -20 ? 'DESCENDING' : altDelta > 20 ? 'CLIMBING' : 'LEVEL';

        // Closure rate
        t.closureRate = this._clamp(Math.round(t.closureRate + this._jitter(0, 15)), -700, -100);
        t.range = this._clamp(+(t.range + t.closureRate / 3600 * 1.5).toFixed(1), 1.0, 50.0);

        // --- Interceptor ---
        i.heading = this._clampDeg(i.heading + this._jitter(0, 1));
        i.speed = this._clamp(+(i.speed + this._jitter(0, 0.005)).toFixed(2), 0.90, 1.60);
        i.altitude = this._clamp(Math.round(i.altitude + this._jitter(-30, 30)), 20000, 35000);

        // --- Sensor confidence jitter ---
        s.radar.confidence = this._clamp(Math.round(s.radar.confidence + this._jitter(0, 2)), 75, 99);
        s.esm.confidence = this._clamp(Math.round(s.esm.confidence + this._jitter(0, 3)), 60, 95);
        s.satellite.confidence = this._clamp(Math.round(s.satellite.confidence + this._jitter(0, 4)), 40, 90);
        this.state.fusedConfidence = this._clamp(
            +((s.radar.confidence * 0.5 + s.esm.confidence * 0.3 + s.satellite.confidence * 0.2) / 1).toFixed(1),
            70, 99
        );

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

        // --- Dispatch event ---
        const payload = {
            tick: this.state.tickCount,
            zuluTime,
            target: { ...t },
            interceptor: { ...i },
            sensors: JSON.parse(JSON.stringify(s)),
            fusedConfidence: this.state.fusedConfidence,
            threatScore: this.state.threatScore,
            phase: this.state.phase,
            newComm,
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
        // Broadcast phase change to other tabs
        if (this._channel) {
            try { this._channel.postMessage({ type: 'phase', phase: this.state.phase }); } catch (e) { }
        }
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
            const s = { ...this.state, running: false, intervalId: null };
            sessionStorage.setItem('sensorDataState', JSON.stringify(s));
        } catch (e) { /* quota or private mode */ }
    },
    _restoreState() {
        try {
            const raw = sessionStorage.getItem('sensorDataState');
            if (!raw) return;
            const saved = JSON.parse(raw);
            // Merge saved state, preserving methods-only fields
            Object.assign(this.state.target, saved.target || {});
            Object.assign(this.state.interceptor, saved.interceptor || {});
            Object.assign(this.state.sensors, saved.sensors || {});
            this.state.fusedConfidence = saved.fusedConfidence ?? this.state.fusedConfidence;
            this.state.phase = saved.phase ?? this.state.phase;
            this.state.tickCount = saved.tickCount ?? 0;
            this._commsIndex = saved._commsIndex ?? 0;
            console.log('[SensorDataEngine] Restored state from session');
        } catch (e) { /* corrupted data, start fresh */ }
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

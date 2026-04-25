/**
 * AI System Engine - SAAB C2 Tactical Overwatch
 * Manages the Scan-Detect-Protect-Suggest-Report pipeline with HITL.
 */

const MissionLogStore = (() => {
    const storageKey = "c2_mission_log_records_v1";
    const state = {
        records: [],
        activeMissionId: null,
        listenersBound: false
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function load() {
        if (state.records.length > 0) return;
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            state.records = parsed;
        } catch (error) {
            console.warn("MissionLogStore.load failed:", error);
        }
    }

    function save() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(state.records));
        } catch (error) {
            console.warn("MissionLogStore.save failed:", error);
        }
    }

    function emit(reason, record = null) {
        dispatchEvent(new CustomEvent("mission-log-updated", {
            detail: {
                reason,
                record: record ? clone(record) : null,
                activeMissionId: state.activeMissionId
            }
        }));
    }

    function utcStamp(date = new Date()) {
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}Z`;
    }

    function timeStamp(date = new Date()) {
        const pad = (value) => String(value).padStart(2, "0");
        return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
    }

    function inferTargetClass(data) {
        if (data.targetClass) return data.targetClass;
        if (data.speed >= 1100) return "SU-27 Flanker";
        if (data.speed >= 850) return "IL-20 Coot";
        if (data.speed >= 500) return "Unknown Fast Mover";
        return "Reconnaissance Drone";
    }

    function inferSector(data) {
        return data.sector || "Baltic Sea";
    }

    function inferDesignation(data) {
        if (data.designation) return data.designation;
        const suffix = Date.now().toString().slice(-6);
        return `AUTO_TRACK_${suffix}`;
    }

    function inferTelemetry(data) {
        const speedMach = typeof data.speed === "number" ? (data.speed / 661).toFixed(1) : "0.8";
        const distance = typeof data.distance === "number" ? data.distance : 50;
        const speedPct = `${Math.max(15, Math.min(100, Math.round((Number(speedMach) / 2) * 100)))}%`;
        const altitude = data.altitude || (data.speed > 900 ? "350" : "240");
        const altitudePct = `${Math.max(20, Math.min(100, Math.round((Number(altitude) / 450) * 100)))}%`;
        const bearing = String(data.bearing || 270).padStart(3, "0");
        const exitBearing = String(data.exitBearing || 90).padStart(3, "0");

        return {
            speed: `${speedMach}M`,
            speedPct,
            altitude: String(altitude),
            altitudePct,
            bearing,
            exitBearing,
            distanceKm: distance
        };
    }

    function createMissionRecord(data) {
        const now = new Date();
        const record = {
            id: `ML-${now.getTime()}`,
            date: utcStamp(now),
            designation: inferDesignation(data),
            targetClass: inferTargetClass(data),
            sector: inferSector(data),
            outcome: "Tracking",
            outcomeColor: "amber-400",
            summary: "Mission record created from AI threat scan. Monitoring for additional classification and commander actions.",
            timeline: [
                { time: timeStamp(now), msg: `Mission record opened from AI scan. Speed ${data.speed}kts, distance ${data.distance}km, IFF ${data.iff ? "friendly" : "unknown"}.` }
            ],
            telemetry: inferTelemetry(data),
            images: [],
            auditEntries: [],
            source: data.source || "AI Scan"
        };
        state.records.unshift(record);
        state.activeMissionId = record.id;
        save();
        emit("created", record);
        return record;
    }

    function getActiveRecord() {
        load();
        if (!state.activeMissionId) return null;
        return state.records.find((record) => record.id === state.activeMissionId) || null;
    }

    function upsert(record) {
        load();
        const index = state.records.findIndex((item) => item.id === record.id);
        if (index === -1) state.records.unshift(record);
        else state.records[index] = record;
        save();
        emit("upserted", record);
        return record;
    }

    function updateActive(updater) {
        load();
        const record = getActiveRecord();
        if (!record) return null;
        updater(record);
        return upsert(record);
    }

    function appendTimeline(message) {
        return updateActive((record) => {
            record.timeline.push({ time: timeStamp(), msg: message });
            record.summary = message;
        });
    }

    function appendAudit(entry) {
        return updateActive((record) => {
            record.auditEntries = record.auditEntries || [];
            record.auditEntries.push({
                timestamp: entry.timestamp,
                phase: entry.phase,
                message: entry.message
            });
        });
    }

    function setOutcome(outcome, color, summary) {
        return updateActive((record) => {
            record.outcome = outcome;
            record.outcomeColor = color;
            if (summary) record.summary = summary;
        });
    }

    function registerScan(data) {
        load();
        const active = getActiveRecord();
        if (!active || active.outcome !== "Tracking") {
            return createMissionRecord(data);
        }
        return updateActive((record) => {
            record.timeline.push({ time: timeStamp(), msg: `Additional AI scan received. Speed ${data.speed}kts, distance ${data.distance}km.` });
            record.telemetry = inferTelemetry(data);
        });
    }

    function bindGlobalListeners() {
        if (state.listenersBound) return;
        state.listenersBound = true;

        addEventListener("ai-update", (event) => {
            appendAudit(event.detail);

            const { phase, message } = event.detail;
            if (phase === "DETECT") appendTimeline(message);
            if (phase === "SUGGEST") setOutcome("Investigating", "amber-400", message);
            if (phase === "PROTECT") {
                const approved = message.includes("APPROVED");
                setOutcome(approved ? "Escorted" : "Monitoring", approved ? "tertiary" : "slate-400", message);
            }
            if (phase === "REPORT") {
                const intercepted = message.includes("CRITICAL");
                setOutcome(intercepted ? "Intercepted" : "Resolved", intercepted ? "error" : "slate-400", message);
                state.activeMissionId = null;
                save();
                emit("closed");
            }
        });

        addEventListener("ai-effector-recommendation", (event) => {
            const { label, reason, type } = event.detail;
            updateActive((record) => {
                record.timeline.push({ time: timeStamp(), msg: `Effector recommended: ${label}. ${reason}` });
                record.summary = `AI recommended ${label}. ${reason}`;
                if (type === "GBAD") record.outcomeColor = "error";
                else if (type === "DRONE") record.outcomeColor = "amber-400";
                else record.outcomeColor = "tertiary";
            });
        });

        addEventListener("ai-signal-analysis", (event) => {
            const { type, msg } = event.detail;
            appendTimeline(`SIGINT ${type}: ${msg}`);
        });

        addEventListener("ai-predictive-alert", (event) => {
            const { message } = event.detail;
            updateActive((record) => {
                record.timeline.push({ time: timeStamp(), msg: `Predictive logistics alert: ${message}` });
                record.summary = message;
                record.outcome = "Support Required";
                record.outcomeColor = "amber-400";
            });
        });
    }

    load();
    bindGlobalListeners();

    return {
        storageKey,
        getRecords: () => {
            load();
            return state.records;
        },
        getActiveMissionId: () => state.activeMissionId,
        registerScan,
        upsert,
        bindGlobalListeners
    };
})();

const AISystem = {
    state: {
        currentPhase: "SCAN",
        threatScore: 0,
        confidence: 0,
        logs: [],
        suggestions: [],
        hitlPending: false,
        apiKey: globalThis.OPENROUTER_API_KEY || ""
    },

    /**
     * Call OpenRouter LLM for real tactical analysis
     */
    callOpenRouter: async (prompt) => {
        if (!AISystem.state.apiKey) return null;
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${AISystem.state.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [
                        { role: "system", content: "You are a SAAB C2 Tactical Overwatch AI. Provide concise, professional military-style tactical analysis and suggestions." },
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content ?? null;
        } catch (error) {
            console.error("OpenRouter Error:", error);
            return null;
        }
    },

    /**
     * Phase 1: SCAN - Simulate raw sensor data ingestion
     */
    scan: async (data) => {
        console.log("[AI:SCAN] Ingesting sensor data...", data);
        MissionLogStore.registerScan(data);
        AISystem.log("SCAN", "Ingested sensor data from Radar/ADS-B");
        return await AISystem.detect(data);
    },

    /**
     * Phase 2: DETECT - Calculate threat score
     */
    detect: async (data) => {
        AISystem.state.currentPhase = "DETECT";
        let score = 0;
        if (data.speed > 800) score += 30;
        if (data.distance < 50) score += 40;
        if (!data.iff) score += 30;

        AISystem.state.threatScore = score;
        AISystem.state.confidence = 92;
        AISystem.log("DETECT", `Threat detected. Score: ${score}, Confidence: 92%`);

        if (score > 70) {
            AISystem.state.hitlPending = true;
            return await AISystem.suggest(data);
        }
        return score;
    },

    /**
     * Effector Classification determines optimal countermeasure type.
     */
    classifyEffector: (data) => {
        if (data.speed <= 500) {
            return {
                type: "DRONE",
                label: "Drone Reconnaissance Intercept",
                icon: "flight_class",
                reason: "Low-speed recon profile detected. Deploy UAV for intercept and identification.",
                color: "amber"
            };
        }
        if (data.speed > 500 && data.distance < 80) {
            return {
                type: "GBAD",
                label: "Ground-Based Air Defense",
                icon: "rocket_launch",
                reason: "High-speed target close to defended assets. Activate GBAD coverage.",
                color: "error"
            };
        }
        return {
            type: "INTERCEPTOR",
            label: "Gripen Interceptor",
            icon: "flight_takeoff",
            reason: "Unknown airborne threat at range. Scramble interceptor flight.",
            color: "primary"
        };
    },

    /**
     * Phase 3: SUGGEST - Generate recommendations with effector classification
     */
    suggest: async (data) => {
        AISystem.state.currentPhase = "SUGGEST";
        AISystem.log("SUGGEST", "AI Generating tactical suggestions...");

        const effector = AISystem.classifyEffector(data);
        AISystem.state.lastEffector = effector;
        AISystem.log("SUGGEST", `[EFFECTOR] Classified: ${effector.label} - ${effector.reason}`);
        dispatchEvent(new CustomEvent("ai-effector-recommendation", { detail: effector }));

        const fallbackActions = {
            DRONE: "Deploy UAV Reconnaissance Drone to intercept and identify target",
            GBAD: "Activate Ground-Based Air Defense battery and prepare engagement envelope",
            INTERCEPTOR: "Scramble Gripen Interceptor for airborne intercept"
        };
        const fallbackAction = fallbackActions[effector.type] || "Scramble Gripen 01";

        if (AISystem.state.apiKey) {
            const prompt = `Analyze this threat data: Speed ${data.speed}kts, Distance ${data.distance}km, IFF ${data.iff ? "Friendly" : "Unknown"}.
The AI has classified the optimal effector as: ${effector.label}.
Reason: ${effector.reason}
Provide a 2-sentence tactical recommendation for the C2 Commander. First sentence: confirm the effector choice. Second sentence: specific operational directive. Be professional, decisive, and reference the effector by name.`;

            const aiResponse = await AISystem.callOpenRouter(prompt);
            if (aiResponse) {
                const recommendations = [
                    { id: "ai-scramble", action: aiResponse, priority: "CRITICAL", effector },
                    { id: "warn", action: "Issue Radio Warning (Standard)", priority: "MEDIUM" }
                ];
                AISystem.state.suggestions = recommendations;
                AISystem.log("SUGGEST", `AI Effector Selection: ${aiResponse}`);
                return recommendations;
            }
        }

        const recommendations = [
            { id: "scramble", action: fallbackAction, priority: "HIGH", effector },
            { id: "warn", action: "Issue Radio Warning", priority: "MEDIUM" }
        ];
        AISystem.state.suggestions = recommendations;
        AISystem.log("SUGGEST", `AI suggested fallback effector: ${effector.label}`);
        return recommendations;
    },

    /**
     * Phase 4: PROTECT - ROE Validation (Human in the loop)
     */
    approveAction: (actionId) => {
        AISystem.state.hitlPending = false;
        AISystem.state.currentPhase = "PROTECT";
        const action = AISystem.state.suggestions.find((suggestion) => suggestion.id === actionId);
        if (!action) return;
        AISystem.log("PROTECT", `HUMAN APPROVED: ${action.action}`);
        AISystem.generateReport();

        if (actionId.includes("scramble") || actionId.includes("ai-scramble")) {
            setTimeout(() => {
                AISystem.predictiveLogistics("Baltic Sea", [
                    { base: "F17 Kallinge", count: 6 }
                ]);
            }, 1500);
        }
    },

    /**
     * Asset Optimization Logic supports INTERCEPTOR, GBAD, and DRONE types.
     */
    recommendAsset: (incidentSector, effectorType) => {
        AISystem.log("SUGGEST", `Optimizing asset allocation for sector: ${incidentSector}${effectorType ? ` [${effectorType}]` : ""}`);

        const baseToSector = {
            "F7 Satenas": "North Sea",
            "F17 Kallinge": "Baltic Sea",
            "F21 Lulea": "Barents Sea"
        };
        const resolvedSector = baseToSector[incidentSector] || incidentSector;

        const allAssets = [
            { name: "F7 Satenas", type: "INTERCEPTOR", readiness: 75, distance: 350, sector: "North Sea" },
            { name: "F17 Kallinge", type: "INTERCEPTOR", readiness: 87, distance: 120, sector: "Baltic Sea" },
            { name: "F21 Lulea", type: "INTERCEPTOR", readiness: 44, distance: 800, sector: "Barents Sea" },
            { name: "GBAD Gotland", type: "GBAD", readiness: 92, distance: 40, sector: "Baltic Sea" },
            { name: "GBAD Blekinge", type: "GBAD", readiness: 85, distance: 90, sector: "Baltic Sea" },
            { name: "UAV Visby", type: "DRONE", readiness: 90, distance: 60, sector: "Baltic Sea" },
            { name: "UAV Halmstad", type: "DRONE", readiness: 78, distance: 200, sector: "North Sea" }
        ];

        const resolvedType = effectorType || AISystem.state.lastEffector?.type || null;
        const assets = resolvedType ? allAssets.filter((asset) => asset.type === resolvedType) : allAssets;
        const scoredAssets = assets.map((asset) => ({
            ...asset,
            totalScore: asset.readiness + (asset.sector === resolvedSector ? 50 : 0)
        }));

        const best = scoredAssets.toSorted((a, b) => b.totalScore - a.totalScore)[0];
        if (!best) {
            AISystem.log("SUGGEST", `No matching assets found for type: ${resolvedType}`);
            return null;
        }

        AISystem.log("SUGGEST", `AI Optimized: ${best.name} [${best.type}] recommended (Score: ${best.totalScore})`);
        dispatchEvent(new CustomEvent("ai-asset-recommendation", {
            detail: { baseName: best.name, score: best.totalScore, type: best.type }
        }));
        return best;
    },

    /**
     * Predictive Logistics detects base depletion and suggests preemptive transfers.
     */
    predictiveLogistics: (currentSector, deployedAssets) => {
        AISystem.log("SUGGEST", "[PREDICTIVE] Analyzing resource distribution across bases...");

        const baseInventory = {
            "F7 Satenas": { total: 24, ready: 18, scrambled: 0, sector: "North Sea", lat: 58.43, lng: 12.71 },
            "F17 Kallinge": { total: 16, ready: 14, scrambled: 0, sector: "Baltic Sea", lat: 56.26, lng: 15.26 },
            "F21 Lulea": { total: 18, ready: 8, scrambled: 0, sector: "Barents Sea", lat: 65.58, lng: 22.16 }
        };

        deployedAssets.forEach((deployment) => {
            if (!baseInventory[deployment.base]) return;
            baseInventory[deployment.base].ready = Math.max(0, baseInventory[deployment.base].ready - deployment.count);
            baseInventory[deployment.base].scrambled += deployment.count;
        });

        const alerts = [];
        Object.entries(baseInventory).forEach(([name, inventory]) => {
            const readinessRatio = inventory.ready / inventory.total;
            if (readinessRatio >= 0.60) return;

            const donors = Object.entries(baseInventory)
                .filter(([candidate]) => candidate !== name)
                .sort((a, b) => (b[1].ready / b[1].total) - (a[1].ready / a[1].total));

            if (donors.length === 0) return;
            const [donorName, donorInventory] = donors[0];
            const transferCount = Math.min(4, Math.floor(donorInventory.ready * 0.25));
            if (transferCount <= 0) return;

            alerts.push({
                type: "PREDICTIVE_REPOSITION",
                severity: readinessRatio < 0.20 ? "CRITICAL" : "WARNING",
                depletedBase: name,
                depletedReadiness: Math.round(readinessRatio * 100),
                depletedLat: inventory.lat,
                depletedLng: inventory.lng,
                donorBase: donorName,
                donorReadiness: Math.round((donorInventory.ready / donorInventory.total) * 100),
                donorLat: donorInventory.lat,
                donorLng: donorInventory.lng,
                suggestedTransfer: transferCount,
                message: `${name} readiness at ${Math.round(readinessRatio * 100)}%. Recommend transferring ${transferCount} aircraft from ${donorName} (${Math.round((donorInventory.ready / donorInventory.total) * 100)}% ready) to ensure continued capability.`
            });
        });

        alerts.forEach((alert) => {
            AISystem.log("SUGGEST", `[PREDICTIVE] ${alert.message}`);
            dispatchEvent(new CustomEvent("ai-predictive-alert", { detail: alert }));
        });

        return alerts;
    },

    /**
     * Signal Intelligence (SIGINT) Analysis
     */
    analyzeSignal: async () => {
        AISystem.log("DETECT", "SIGINT Analysis starting...");

        if (AISystem.state.apiKey) {
            const aiResponse = await AISystem.callOpenRouter("Provide 2 brief SIGINT analysis findings for an unknown Su-27 approaching sovereign airspace. If you include intercepted speech, provide a translation in parentheses. Format: TYPE: [Intercepted Text] (Translation). Types: VOICE, SIGINT, IFF, INTENT.");
            if (aiResponse) {
                const lines = aiResponse.split("\n").filter((line) => line.trim().length > 5);
                lines.forEach((line) => {
                    const parts = line.split(":");
                    const type = parts[0].replace(/[^A-Z]/g, "") || "SIGINT";
                    const msg = parts.slice(1).join(":") || line;
                    dispatchEvent(new CustomEvent("ai-signal-analysis", {
                        detail: { type, msg: msg.trim(), prob: 0.95 }
                    }));
                });
                return;
            }
        }

        const analyses = [
            { type: "VOICE", msg: "Voice stress detected in target pilot. High adrenaline signature.", prob: 0.82 },
            { type: "SIGINT", msg: "Encrypted datalink burst detected. Potential wingman coordination.", prob: 0.91 },
            { type: "IFF", msg: "Transponder bypass attempt detected. Manual override confirmed.", prob: 0.75 },
            { type: "INTENT", msg: "Flight path deviation suggests intentional airspace violation.", prob: 0.88 }
        ];

        const selected = analyses.toSorted(() => 0.5 - Math.random()).slice(0, 2);
        AISystem.log("DETECT", "SIGINT Analysis completed.");
        selected.forEach((analysis) => {
            dispatchEvent(new CustomEvent("ai-signal-analysis", { detail: analysis }));
        });
    },

    rejectAction: (actionId) => {
        AISystem.state.hitlPending = false;
        AISystem.state.currentPhase = "SCAN";
        const action = AISystem.state.suggestions.find((suggestion) => suggestion.id === actionId);
        if (!action) return;
        AISystem.log("PROTECT", `HUMAN REJECTED: ${action.action}`);
    },

    /**
     * Phase 5: REPORT - Generate mission summary
     */
    generateReport: () => {
        AISystem.state.currentPhase = "REPORT";
        const report = {
            timestamp: new Date().toISOString(),
            events: AISystem.state.logs,
            finalThreatLevel: AISystem.state.threatScore > 70 ? "CRITICAL" : "STABLE"
        };
        AISystem.log("REPORT", `Mission report generated - Threat: ${report.finalThreatLevel}`);
        return report;
    },

    log: (phase, message) => {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            phase,
            message
        };
        AISystem.state.logs.push(entry);
        dispatchEvent(new CustomEvent("ai-update", { detail: entry }));
    }
};

window.MissionLogStore = MissionLogStore;
window.AISystem = AISystem;

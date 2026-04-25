/**
 * AI System Engine - SAAB C2 Tactical Overwatch
 * Manages the Scan-Detect-Protect-Suggest-Report pipeline with HITL.
 */

const AISystem = {
    state: {
        currentPhase: 'SCAN', // SCAN, DETECT, PROTECT, SUGGEST, REPORT
        threatScore: 0,
        confidence: 0,
        logs: [],
        suggestions: [],
        hitlPending: false,
        apiKey: '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'
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
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        { "role": "system", "content": "You are a SAAB C2 Tactical Overwatch AI. Provide concise, professional military-style tactical analysis and suggestions." },
                        { "role": "user", "content": prompt }
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
        AISystem.log('SCAN', 'Ingested sensor data from Radar/ADS-B');
        return await AISystem.detect(data);
    },

    /**
     * Phase 2: DETECT - Calculate threat score
     */
    detect: async (data) => {
        AISystem.state.currentPhase = 'DETECT';
        // Simulation logic for threat scoring
        let score = 0;
        if (data.speed > 800) score += 30; // High speed
        if (data.distance < 50) score += 40; // Close to border
        if (!data.iff) score += 30; // Unknown IFF

        AISystem.state.threatScore = score;
        AISystem.state.confidence = 92; // Simulated confidence
        
        AISystem.log('DETECT', `Threat detected. Score: ${score}, Confidence: 92%`);
        
        if (score > 70) {
            AISystem.state.hitlPending = true;
            return await AISystem.suggest(data);
        }
        return score;
    },

    /**
     * Effector Classification — determines optimal countermeasure type
     * based on threat speed, distance, and IFF profile.
     */
    classifyEffector: (data) => {
        // data: { speed (kts), distance (km), iff (bool) }
        if (data.speed <= 500) {
            return {
                type: 'DRONE',
                label: 'Drönare (Reconnaissance Drone)',
                icon: 'flight_class',
                reason: 'Low-speed / recon profile — deploy drone for intercept & identification.',
                color: 'amber'
            };
        }
        if (data.speed > 500 && data.distance < 80) {
            return {
                type: 'GBAD',
                label: 'Luftvärn (Ground-Based Air Defense)',
                icon: 'rocket_launch',
                reason: 'High-speed target close to high-value assets — activate GBAD system.',
                color: 'error'
            };
        }
        return {
            type: 'INTERCEPTOR',
            label: 'Gripen Interceptor',
            icon: 'flight_takeoff',
            reason: 'Distant / unknown threat — scramble fighter interceptor.',
            color: 'primary'
        };
    },

    /**
     * Phase 3: SUGGEST - Generate recommendations with effector classification
     */
    suggest: async (data) => {
        AISystem.state.currentPhase = 'SUGGEST';
        AISystem.log('SUGGEST', "AI Generating tactical suggestions...");

        // Classify the optimal effector type
        const effector = AISystem.classifyEffector(data);
        AISystem.state.lastEffector = effector;
        AISystem.log('SUGGEST', `[EFFECTOR] Classified: ${effector.label} — ${effector.reason}`);

        // Dispatch effector recommendation event for UI
        dispatchEvent(new CustomEvent('ai-effector-recommendation', { detail: effector }));

        // Build effector-specific fallback action
        const fallbackActions = {
            'DRONE':       `Deploy UAV Reconnaissance Drone to intercept & identify target`,
            'GBAD':        `Activate Luftvärn GBAD Battery — engage with surface-to-air missile`,
            'INTERCEPTOR': `Scramble Gripen Interceptor for airborne intercept`
        };
        const fallbackAction = fallbackActions[effector.type] || 'Scramble Gripen 01';

        if (AISystem.state.apiKey) {
            const prompt = `Analyze this threat data: Speed ${data.speed}kts, Distance ${data.distance}km, IFF ${data.iff ? 'Friendly' : 'Unknown'}.
The AI has classified the optimal effector as: ${effector.label}.
Reason: ${effector.reason}
Provide a 2-sentence tactical recommendation for the C2 Commander. First sentence: confirm the effector choice. Second sentence: specific operational directive. Be professional, decisive, and reference the effector by name.`;

            const aiResponse = await AISystem.callOpenRouter(prompt);
            if (aiResponse) {
                const recommendations = [
                    { id: 'ai-scramble', action: aiResponse, priority: 'CRITICAL', effector },
                    { id: 'warn', action: 'Issue Radio Warning (Standard)', priority: 'MEDIUM' }
                ];
                AISystem.state.suggestions = recommendations;
                AISystem.log('SUGGEST', `AI Effector Selection: ${aiResponse}`);
                return recommendations;
            }
        }

        const recommendations = [
            { id: 'scramble', action: fallbackAction, priority: 'HIGH', effector },
            { id: 'warn', action: 'Issue Radio Warning', priority: 'MEDIUM' }
        ];
        AISystem.state.suggestions = recommendations;
        AISystem.log('SUGGEST', `AI suggested fallback effector: ${suggestedEffector}`);
        return recommendations;
    },

    /**
     * Phase 4: PROTECT - ROE Validation (Human in the loop)
     */
    approveAction: (actionId) => {
        AISystem.state.hitlPending = false;
        AISystem.state.currentPhase = 'PROTECT';
        const action = AISystem.state.suggestions.find(s => s.id === actionId);
        if (!action) return;
        AISystem.log('PROTECT', `HUMAN APPROVED: ${action.action}`);
        AISystem.generateReport();

        // Trigger predictive logistics after a scramble/deploy action
        if (actionId.includes('scramble') || actionId.includes('ai-scramble')) {
            setTimeout(() => {
                AISystem.predictiveLogistics('Baltic Sea', [
                    { base: 'F17 Kallinge', count: 6 }
                ]);
            }, 1500);
        }
    },

    /**
     * Asset Optimization Logic — supports INTERCEPTOR, GBAD, and DRONE types
     */
    recommendAsset: (incidentSector, effectorType) => {
        AISystem.log('SUGGEST', `Optimizing asset allocation for sector: ${incidentSector}${effectorType ? ` [${effectorType}]` : ''}`);

        // Map base names → sector names so callers can pass either
        const baseToSector = {
            'F7 Såtenäs':   'North Sea',
            'F17 Kallinge': 'Baltic Sea',
            'F21 Luleå':    'Barents Sea'
        };
        const resolvedSector = baseToSector[incidentSector] || incidentSector;

        // Full multi-domain asset data
        const allAssets = [
            // Fighter bases
            { name: 'F7 Såtenäs',   type: 'INTERCEPTOR', readiness: 75, distance: 350, sector: 'North Sea' },
            { name: 'F17 Kallinge',  type: 'INTERCEPTOR', readiness: 87, distance: 120, sector: 'Baltic Sea' },
            { name: 'F21 Luleå',     type: 'INTERCEPTOR', readiness: 44, distance: 800, sector: 'Barents Sea' },
            // GBAD batteries
            { name: 'GBAD Gotland',  type: 'GBAD', readiness: 92, distance: 40,  sector: 'Baltic Sea' },
            { name: 'GBAD Blekinge', type: 'GBAD', readiness: 85, distance: 90,  sector: 'Baltic Sea' },
            // Drone stations
            { name: 'UAV Visby',     type: 'DRONE', readiness: 90, distance: 60,  sector: 'Baltic Sea' },
            { name: 'UAV Halmstad',  type: 'DRONE', readiness: 78, distance: 200, sector: 'North Sea' },
        ];

        // Filter by effector type if specified, otherwise use all
        const resolvedType = effectorType || AISystem.state.lastEffector?.type || null;
        const assets = resolvedType
            ? allAssets.filter(a => a.type === resolvedType)
            : allAssets;

        // Scoring: Higher readiness is good, sector match gets proximity bonus
        const scoredAssets = assets.map(b => {
            let score = b.readiness;
            if (b.sector === resolvedSector) score += 50;
            return { ...b, totalScore: score };
        });

        const best = scoredAssets.toSorted((a, b) => b.totalScore - a.totalScore)[0];

        if (!best) {
            AISystem.log('SUGGEST', `No matching assets found for type: ${resolvedType}`);
            return null;
        }

        AISystem.log('SUGGEST', `AI Optimized: ${best.name} [${best.type}] recommended (Score: ${best.totalScore})`);

        dispatchEvent(new CustomEvent('ai-asset-recommendation', {
            detail: { baseName: best.name, score: best.totalScore, type: best.type }
        }));

        return best;
    },

    /**
     * Predictive Logistics — detects base depletion and suggests preemptive transfers
     * Answers: "Hur säkerställs fortsatt förmåga när resurser förbrukas?"
     */
    predictiveLogistics: (currentSector, deployedAssets) => {
        AISystem.log('SUGGEST', '[PREDICTIVE] Analyzing resource distribution across bases...');

        // Simulated per-base inventory
        const baseInventory = {
            'F7 Såtenäs':   { total: 24, ready: 18, scrambled: 0, sector: 'North Sea',    lat: 58.43, lng: 12.71 },
            'F17 Kallinge':  { total: 16, ready: 14, scrambled: 0, sector: 'Baltic Sea',   lat: 56.26, lng: 15.26 },
            'F21 Luleå':     { total: 18, ready: 8,  scrambled: 0, sector: 'Barents Sea',  lat: 65.58, lng: 22.16 },
        };

        // Apply current deployments
        deployedAssets.forEach(dep => {
            if (baseInventory[dep.base]) {
                baseInventory[dep.base].ready = Math.max(0, baseInventory[dep.base].ready - dep.count);
                baseInventory[dep.base].scrambled += dep.count;
            }
        });

        // Find depleted bases (ready < 30% of total)
        const alerts = [];
        Object.entries(baseInventory).forEach(([name, inv]) => {
            const readinessRatio = inv.ready / inv.total;
            if (readinessRatio < 0.60) {
                // Find the safest donor base (highest readiness ratio NOT in threatened sector)
                const donors = Object.entries(baseInventory)
                    .filter(([n]) => n !== name)
                    .map(([n, d]) => [n, d])
                    .sort((a, b) => (b[1].ready / b[1].total) - (a[1].ready / a[1].total));

                if (donors.length > 0) {
                    const [donorName, donorInv] = donors[0];
                    const transferCount = Math.min(4, Math.floor(donorInv.ready * 0.25));
                    if (transferCount > 0) {
                        const alert = {
                            type: 'PREDICTIVE_REPOSITION',
                            severity: readinessRatio < 0.20 ? 'CRITICAL' : 'WARNING',
                            depletedBase: name,
                            depletedReadiness: Math.round(readinessRatio * 100),
                            depletedLat: inv.lat,
                            depletedLng: inv.lng,
                            donorBase: donorName,
                            donorReadiness: Math.round((donorInv.ready / donorInv.total) * 100),
                            donorLat: donorInv.lat,
                            donorLng: donorInv.lng,
                            suggestedTransfer: transferCount,
                            message: `${name} readiness at ${Math.round(readinessRatio * 100)}%. Recommend transferring ${transferCount} aircraft from ${donorName} (${Math.round((donorInv.ready / donorInv.total) * 100)}% ready) to ensure continued capability.`
                        };
                        alerts.push(alert);
                    }
                }
            }
        });

        // Dispatch alerts
        alerts.forEach(alert => {
            AISystem.log('SUGGEST', `[PREDICTIVE] ${alert.message}`);
            dispatchEvent(new CustomEvent('ai-predictive-alert', { detail: alert }));
        });

        return alerts;
    },

    /**
     * Signal Intelligence (SIGINT) Analysis
     */
    analyzeSignal: async () => {
        AISystem.log('DETECT', "SIGINT Analysis starting...");

        if (AISystem.state.apiKey) {
            const aiResponse = await AISystem.callOpenRouter("Provide 2 brief SIGINT analysis findings for an unknown Su-27 approaching sovereign airspace. If you include Russian intercepted speech, ALWAYS provide a translation in parentheses. Format: TYPE: [Intercepted Text] (Translation). Types: VOICE, SIGINT, IFF, INTENT.");
            if (aiResponse) {
                const lines = aiResponse.split('\n').filter(l => l.trim().length > 5);
                lines.forEach(line => {
                    const parts = line.split(':');
                    const type = parts[0].replace(/[^A-Z]/g, '') || 'SIGINT';
                    const msg = parts.slice(1).join(':') || line;
                    dispatchEvent(new CustomEvent('ai-signal-analysis', {
                        detail: { type: type, msg: msg.trim(), prob: 0.95 }
                    }));
                });
                return;
            }
        }

        // Fallback to simulated data...
        const analyses = [
            { type: 'VOICE', msg: "Voice stress detected in target pilot. High adrenaline signature.", prob: 0.82 },
            { type: 'SIGINT', msg: "Encrypted datalink burst detected. Potential wingman coordination.", prob: 0.91 },
            { type: 'IFF', msg: "Transponder bypass attempt detected. Manual override confirmed.", prob: 0.75 },
            { type: 'INTENT', msg: "Flight path deviation suggests intentional airspace violation.", prob: 0.88 }
        ];

        // Pick 2 random analyses
        const selected = analyses.toSorted(() => 0.5 - Math.random()).slice(0, 2);
        
        AISystem.log('DETECT', "SIGINT Analysis completed.");
        
        selected.forEach(a => {
            dispatchEvent(new CustomEvent('ai-signal-analysis', { detail: a }));
        });
    },

    rejectAction: (actionId) => {
        AISystem.state.hitlPending = false;
        AISystem.state.currentPhase = 'SCAN';
        const action = AISystem.state.suggestions.find(s => s.id === actionId);
        if (!action) return;
        AISystem.log('PROTECT', `HUMAN REJECTED: ${action.action}`);
    },

    /**
     * Phase 5: REPORT - Generate mission summary
     */
    generateReport: () => {
        AISystem.state.currentPhase = 'REPORT';
        const report = {
            timestamp: new Date().toISOString(),
            events: AISystem.state.logs,
            finalThreatLevel: AISystem.state.threatScore > 70 ? 'CRITICAL' : 'STABLE'
        };
        AISystem.log('REPORT', `Mission report generated — Threat: ${report.finalThreatLevel}`);
        return report;
    },

    log: (phase, message) => {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            phase,
            message
        };
        AISystem.state.logs.push(entry);
        // Dispatch event for UI updates
        dispatchEvent(new CustomEvent('ai-update', { detail: entry }));
    }
};

window.AISystem = AISystem;

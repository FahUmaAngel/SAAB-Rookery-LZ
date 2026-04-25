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
     * Phase 3: SUGGEST - Generate recommendations
     */
    suggest: async (data) => {
        AISystem.state.currentPhase = 'SUGGEST';
        AISystem.log('SUGGEST', "AI Evaluating optimal effector (Drönare, Luftvärn, Gripen)...");
        
        // Basic heuristic for effector selection
        let suggestedEffector = 'Gripen Interceptor';
        let actionStr = 'Scramble Gripen 01';
        if (data.speed < 400 && data.distance < 80) {
            suggestedEffector = 'Drönare (Recon Drone)';
            actionStr = 'Deploy Recon Drone for visual ID';
        } else if (data.speed > 1000 && data.distance < 40) {
            suggestedEffector = 'Luftvärn (GBAD)';
            actionStr = 'Activate Patriot/BAMSE Air Defense';
        }

        if (AISystem.state.apiKey) {
            const prompt = `Analyze this threat: Speed ${data.speed}kts, Distance ${data.distance}km, IFF ${data.iff ? 'Friendly' : 'Unknown'}. 
            CRITICAL: You MUST choose exactly ONE optimal effector from this list: 1) 'Luftvärn' (Ground-based Air Defense) for close/fast threats, 2) 'Drönare' (Drone) for slow/recon threats, or 3) 'Gripen' (Fighter) for distant/unknown interception. 
            Provide a 1-sentence tactical recommendation starting with the chosen effector.`;
            
            const aiResponse = await AISystem.callOpenRouter(prompt);
            if (aiResponse) {
                const recommendations = [
                    { id: 'ai-effector', action: aiResponse, priority: 'CRITICAL' },
                    { id: 'warn', action: 'Issue Radio/Flare Warning', priority: 'MEDIUM' }
                ];
                AISystem.state.suggestions = recommendations;
                AISystem.log('SUGGEST', `AI Effector Selection: ${aiResponse}`);
                return recommendations;
            }
        }

        const recommendations = [
            { id: 'effector', action: actionStr, priority: 'HIGH' },
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
    },

    /**
     * Asset Optimization Logic
     */
    recommendAsset: (incidentSector) => {
        AISystem.log('SUGGEST', `Optimizing asset allocation for sector: ${incidentSector}`);

        // Map base names → sector names so callers can pass either
        const baseToSector = {
            'F7 Såtenäs':   'North Sea',
            'F17 Kallinge': 'Baltic Sea',
            'F21 Luleå':    'Barents Sea'
        };
        const resolvedSector = baseToSector[incidentSector] || incidentSector;

        // Simulated airbase data
        const bases = [
            { name: 'F7 Såtenäs',  readiness: 75, distance: 350, sector: 'North Sea' },
            { name: 'F17 Kallinge', readiness: 87, distance: 120, sector: 'Baltic Sea' },
            { name: 'F21 Luleå',    readiness: 44, distance: 800, sector: 'Barents Sea' }
        ];

        // Scoring: Higher readiness is good, sector match gets proximity bonus
        const scoredBases = bases.map(b => {
            let score = b.readiness;
            if (b.sector === resolvedSector) score += 50;
            return { ...b, totalScore: score };
        });

        const best = scoredBases.toSorted((a, b) => b.totalScore - a.totalScore)[0];

        AISystem.log('SUGGEST', `AI Optimized: ${best.name} is recommended (Score: ${best.totalScore})`);

        dispatchEvent(new CustomEvent('ai-asset-recommendation', {
            detail: { baseName: best.name, score: best.totalScore }
        }));

        return best;
    },

    /**
     * Predictive Logistics & Resource Relocation
     * Anticipates future shortfalls based on current consumption and recommends strategic asset transfers.
     */
    predictiveLogistics: (deployedFromBase) => {
        AISystem.log('PROTECT', `Analyzing strategic resource impact of deploying from ${deployedFromBase}...`);
        
        // Simulated readiness levels
        const bases = {
            'F7 Såtenäs': { ready: 8, reserve: 4 },
            'F17 Kallinge': { ready: 2, reserve: 0 }, // Low readiness
            'F21 Luleå': { ready: 10, reserve: 6 }    // High readiness
        };

        // Simulate deployment impact
        if (bases[deployedFromBase]) {
            bases[deployedFromBase].ready -= 2;
        }

        let alertTriggered = false;
        let suggestion = null;

        // Check for vulnerabilities (e.g., F17 is highly vulnerable if readiness drops)
        if (bases['F17 Kallinge'].ready <= 2) {
            alertTriggered = true;
            suggestion = {
                type: 'STRATEGIC_RELOCATION',
                source: 'F21 Luleå',
                destination: 'F17 Kallinge',
                asset: '4x JAS 39 Gripen',
                reason: 'F17 operational readiness below critical threshold. Anticipated escalation in Baltic sector requires preemptive reinforcement.'
            };
            AISystem.log('REPORT', `PREDICTIVE ALERT: Suggesting relocation of ${suggestion.asset} from ${suggestion.source} to ${suggestion.destination}.`);
            
            // Dispatch event to UI
            dispatchEvent(new CustomEvent('ai-predictive-alert', { detail: suggestion }));
        }

        return suggestion;
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

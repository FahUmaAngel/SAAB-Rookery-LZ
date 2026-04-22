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
        hitlPending: false
    },

    /**
     * Phase 1: SCAN - Simulate raw sensor data ingestion
     */
    scan: (data) => {
        console.log("[AI:SCAN] Ingesting sensor data...", data);
        AISystem.log('SCAN', 'Ingested sensor data from Radar/ADS-B');
        return AISystem.detect(data);
    },

    /**
     * Phase 2: DETECT - Calculate threat score
     */
    detect: (data) => {
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
            return AISystem.suggest(data);
        }
        return score;
    },

    /**
     * Phase 3: SUGGEST - Generate recommendations
     */
    suggest: (data) => {
        const recommendations = [
            { id: 'scramble', action: 'Scramble Gripen 01', priority: 'HIGH' },
            { id: 'warn', action: 'Issue Radio Warning', priority: 'MEDIUM' }
        ];
        AISystem.state.suggestions = recommendations;
        AISystem.log('SUGGEST', `AI suggested: ${recommendations[0].action}`);
        return recommendations;
    },

    /**
     * Phase 4: PROTECT - ROE Validation (Human in the loop)
     */
    approveAction: (actionId) => {
        AISystem.state.hitlPending = false;
        const action = AISystem.state.suggestions.find(s => s.id === actionId);
        AISystem.log('PROTECT', `HUMAN APPROVED: ${action.action}`);
        // Proceed to execution simulation...
    },

    rejectAction: (actionId) => {
        AISystem.state.hitlPending = false;
        const action = AISystem.state.suggestions.find(s => s.id === actionId);
        AISystem.log('PROTECT', `HUMAN REJECTED: ${action.action}`);
    },

    /**
     * Phase 5: REPORT - Generate mission summary
     */
    generateReport: () => {
        const report = {
            timestamp: new Date().toISOString(),
            events: AISystem.state.logs,
            finalThreatLevel: AISystem.state.threatScore > 70 ? 'CRITICAL' : 'STABLE'
        };
        AISystem.log('REPORT', 'Mission report generated');
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
        window.dispatchEvent(new CustomEvent('ai-update', { detail: entry }));
    }
};

window.AISystem = AISystem;

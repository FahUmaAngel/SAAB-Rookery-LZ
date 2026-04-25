# SAAB Smart Stridsledning Hackathon - Alignment & Implementation Plan

This document analyzes the current state of the `SAAB-Rookery-LZ` project against the requirements of the [SAAB Smart Stridsledning Hackathon](https://2hero.dev/hackathons/saab-smart-stridsledning-hackathon) and proposes technical adjustments to maximize the project's impact and alignment with the hackathon's core challenges.

## 1. Current Alignment (What's Working Well)

The current project has a very strong foundation and aligns perfectly with the overarching theme: **"Bygg en prototyp av ett ledningssystem för framtidens luftförsvar" (Build a prototype of a command and control system for future air defense).**

- ✅ **Detection & Real-time Tracking:** Implemented via `Sensor-Fusion.html` and `tactical-map.html` (Interactive Leaflet map with QRA layers).
- ✅ **Intelligent Decision Support:** Implemented via `ai-system.js` which evaluates threats and suggests actions (e.g., Scramble Gripen).
- ✅ **Resource Tracking:** Extensive UI for tracking assets, personnel, maintenance, and logistics (`asset-tracking.html`, `logistics.html`, etc.).
- ✅ **Modern & Banbrytande (Groundbreaking):** The UI is futuristic, and the use of LLMs for dynamic tactical analysis fits the "banbrytande mjukvaruteknik" criteria perfectly.

## 2. Identified Gaps (What Needs Adjustment)

Based on a deep dive into the hackathon brief, the judges are looking for two specific capabilities that are currently underrepresented in the codebase:

### Gap A: Effector Selection (Vilken effektor är rätt?)
The brief asks: *"Vilken effektor är rätt - robot, luftvärn eller drönare?"* (Which effector is right - missile, air defense, or drone?). 
Currently, `ai-system.js` defaults heavily to scrambling Gripens. The system needs logic to choose between different countermeasures based on the threat profile.

### Gap B: Predictive Resource Management (Tänka flera steg framåt)
The brief asks: *"Hur säkerställs fortsatt förmåga när resurser förbrukas... Systemet ska tänka flera steg framåt och säkerställa att rätt resurser finns på rätt plats om läget eskalerar."* (How is continued capability ensured as resources are consumed... The system must think several steps ahead to ensure resources are in the right place if it escalates). 
The current system tracks current state, but doesn't **predict** future shortages or suggest strategic repositioning of assets between bases.

---

## 3. Implementation Plan (Proposed Changes)

To fully answer the hackathon challenge, the following technical implementations are planned:

### Phase 1: Enhance AI Effector Logic (`ai-system.js`)
Modify the `suggest` and `recommendAsset` functions to evaluate and recommend multiple effector types, not just aircraft.

- **Implementation Details:**
  - Add threat-profile matching logic:
    - If threat is slow/recon -> Recommend deploying **Drone (Drönare)** for interception/identification.
    - If threat is fast/close to high-value targets -> Recommend activating **GBAD / Luftvärn (Air Defense Missile)**.
    - If threat is distant/unknown -> Scramble **Interceptor (Gripen)**.
  - Update the OpenRouter LLM prompt to explicitly require the AI to choose and justify one of these specific effectors.

### Phase 2: Implement Predictive Resource Relocation (`ai-system.js` & UI)
Add a new subsystem that predicts base depletion and suggests preemptive asset transfers.

- **Implementation Details:**
  - Create a `predictiveLogistics(currentSector, deployedAssets)` function inside `ai-system.js`.
  - **Scenario Logic:** If F17 (Baltic Sea) scrambles a large portion of its ready jets, the system predicts a vulnerability. It will then automatically suggest moving reserve jets from a safer base (e.g., F21 in Barents Sea) to F17 to "ensure continued capability".
  - **UI Integration:** Add a "STRATEGIC ALERT" or "PREDICTIVE LOGISTICS" notification to `Sensor-Fusion.html` and `tactical-map.html` when an imbalance is detected, prompting the commander to approve the asset transfer.

### Phase 3: Update Presentation/Demo Scripts
- Update the demo flow to explicitly highlight these two new features when presenting to the Saab jury, proving that the prototype directly answers the hardest questions in the brief.

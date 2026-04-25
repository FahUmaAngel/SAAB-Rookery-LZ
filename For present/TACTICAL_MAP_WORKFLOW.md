# Tactical Map Workflow and Functionality Explanation (`tactical-map.html`)

The `tactical-map.html` page acts as the Command Center, focusing on advanced visualizations beyond standard mapping. Its standout features include **Layer Toggling** and **Dynamic Intercept Calculation**.

---

## 1. Layout & Structure

This page shares a similar structure with `map-view.html` but includes more profound tools and control dials:

1.  **Main Map Canvas:**
    *   Features **Toggle Controls** at the bottom (RADAR, SAT, BNDRY, QRA) to switch map layers on and off.
    *   Includes a **Legend** window explaining tactical symbols.
    *   Features a hidden **AI Geofencing Alert Zone** (a CSS Overlay) that pops up to warn when a target breaches the perimeter.
2.  **Right Sidebar (In-depth Target Telemetry):**
    *   Displays specific **Target Details** (e.g., SU-27 Flanker, 94% profile match).
    *   Features a **Telemetry Grid** indicating speed (M 1.2), altitude (32k ft), and bearing (274° TRUE).
    *   **Action Buttons:** Command buttons like "AI Tactical Scan", "Designate Target", and "Scramble Intercept".

---

## 2. Workflow

### Step 1: Load Structure and CSS Animations
*   Utilizes Tailwind CSS and Custom CSS to create specific point animations, such as:
    *   `radarSweep`: A sweeping radar effect.
    *   `friendlyChevron`: A flashing effect for friendly aircraft symbols (chevron shape).
    *   `airbaseTriangle`: A glowing effect for airbase symbols (triangle shape).

### Step 2: Initialize Leaflet Map and Layer Groups
The `initTacticalMap()` function is called to build the map:
1.  Loads the base map (Dark theme).
2.  Prepares multiple `L.layerGroup` instances to support toggling, including:
    *   `radarCoverageGroup` and `radarSweepGroup` for radar signals.
    *   `boundaryGroup` for boundary lines.
    *   `qraGroup` for airbases and interceptor aircraft.
    *   `tracksGroup` for targets (always visible).

### Step 3: Draw Tactical Layers

1.  **Radar Nodes:** Draws 5 radar stations with sweeping effects and binds operational radius data to popups.
2.  **Sweden Boundary:** Draws a polygon using coordinates to delineate national and maritime boundaries.
3.  **Hostile Track (TRK-842):** Draws the enemy target symbol (a red diamond) along with a predictive trajectory line.

### Step 4: Dynamic QRA & Interceptor Calculation (Key Highlight!)
Here, the system does not hardcode the origin of friendly aircraft. Instead, mathematical logic is applied:
1.  **Distance Calculation (Haversine Distance):** The system calculates the distance between the hostile target and all 3 airbases (F16, F17, F21) to find the **Closest Base**.
2.  **Spawn Friendly Interceptor (INT-01):** Once the closest base is determined, the system draws a friendly aircraft (blue chevron) taking off from that base.
3.  **Calculate Intercept Point:** The system calculates vectors to find the midpoint where friendly aircraft will intercept the target along the enemy's flight path, drawing a dashed line to that rendezvous point.

### Step 5: Layer Toggling System
*   When a user clicks the bottom buttons (e.g., RADAR, SAT), the `toggleLayer()` function executes.
*   The system checks if the layer is already added. If not, it runs `map.addLayer()`; if it is, it runs `map.removeLayer()`. This ensures smooth rendering without refreshing the page.

### Step 6: AI Integration
*   **Initiating a Scan:** Clicking "AI Tactical Scan" on the right calls the `window.AISystem.scan()` function in `ai-system.js`.
*   **Event Listener (`tacticalMapAIListener`):** The map listens for events from the AI.
    *   If the AI transitions to the `SUGGEST` phase -> The red target icon glows brightly for 3 seconds.
    *   If the AI transitions to the `PROTECT` phase -> The **AI Geofence Zone** popup (a red box warning of area violation) immediately appears in the center of the screen.

---

## 3. Technical Significance Summary

*   **Dynamic Algorithms:** Using the Haversine formula to find the closest airbase makes the map intelligent and responsive to real-world scenarios.
*   **Layer Management:** Grouping markers into `L.layerGroup` allows for excellent management of dense map data and optimizes browser performance.
*   **Event-Driven UI:** Updating the screen via Event Listeners (listening for `ai-update`) prevents tight coupling between the Map View and the AI system, facilitating future scalability.

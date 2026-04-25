# Map View Workflow and Functionality Explanation (`map-view.html`)

This document explains the structure, workflow, and in-depth functionality of the **Tactical Map View** screen, which is the core component for displaying Situational Awareness within the C2 system.

---

## 1. Layout & Structure

The `map-view.html` page is designed as a full-screen Web Application, with its main structure divided into 3 parts:

1.  **Navigation:**
    *   Loads the Top Navbar and Side Navbar via JavaScript (`shared-components.js`) to function as a Single Page Application (SPA).
2.  **Main Canvas (Center Map Area):**
    *   The area displaying the interactive Leaflet.js map.
    *   Features a HUD Overlay on top to display status text (e.g., DATALINK SYNCED) and a Legend (explaining map symbols).
3.  **Right Telemetry Sidebar:**
    *   Displays real-time (simulated) decision support data, including:
        *   **System Status:** Current threat level (THREAT LEVEL: ALPHA).
        *   **Asset Readiness:** Operational readiness status of fighter squadrons across various bases (F7, F17, F21).
        *   **Sensor Health:** Operational status of radars, ICEYE satellites, and ESM.
        *   **Incident Log:** A history of recent events (e.g., scrambling aircraft orders).

---

## 2. Workflow Upon Screen Load

When a user opens the `map-view.html` page, the system executes the following workflow:

### Step 1: Load CSS and Configure Animations
*   Loads Tailwind CSS for layout structuring.
*   Loads `<style>` tags within the file, containing crucial **CSS Animations** to make the UI dynamic, such as:
    *   `radarSweep`: A circular sweeping radar light effect.
    *   `nodePulse` / `friendlyPulse`: Blinking light effects for friendly targets or radar stations.
    *   `hostilePulse`: A red flashing warning effect for enemy targets.

### Step 2: Load Layout and Sidebar
*   The browser immediately renders the DOM elements of the right Telemetry panel with static data (simulated UI scenario).

### Step 3: Initialize Leaflet Map (via IIFE `initMapView`)
*   The `initMapView()` function executes immediately, responsible for:
    1.  **Dependency Check:** Verifying if the Leaflet.js library is present. If not, it dynamically creates `<link>` and `<script>` tags to load them asynchronously from a CDN.
    2.  **Map Instantiation:** Once Leaflet loads, it creates the map inside `<div id="map-view-container">`, centering it on the Baltic Sea `[60.0, 19.0]`.
    3.  **Tile Layer:** Loads a dark-themed base map without text labels (`dark_nolabels` from CartoDB) to suit the Tactical UI.

### Step 4: Draw Tactical Overlays on the Map
The system draws various layers on top of the map sequentially (from bottom to top) as follows:

1.  **Radar Nodes & Sweep:**
    *   Draws coverage radius circles (`L.circle`) for major radar stations (Visby, Uppsala, etc.).
    *   Places an `L.divIcon` containing the `radarSweep` CSS Animation in the center to create the sweeping radar effect.
2.  **Sovereign Boundary (12 Nautical Miles):**
    *   Uses `L.polyline` to draw faint red dashed lines along the Swedish coast and around Gotland island to designate restricted zones.
3.  **ICEYE Satellite Swath:**
    *   Uses `L.polygon` to draw a semi-transparent, slanted rectangular area, simulating the region currently being scanned by the SAR satellite.
4.  **Air Bases:**
    *   Places Markers for bases F7, F17, and F21.
    *   Base F17 has a `highlight: true` status, causing it to flash red to indicate that aircraft are currently being scrambled from this location.
5.  **Hostile Track - TRK-U99:**
    *   Creates a flashing red diamond marker (`hostile-diamond`) placed in the middle of the sea.
    *   Binds a Popup to display data upon clicking (e.g., Speed, Altitude, Transponder status).
6.  **AI Probability Cone:**
    *   Draws an `L.polygon` forming a cone expanding in front of TRK-U99, illustrating the direction the AI predicts the target will fly in the next 10 minutes.
7.  **Friendly Track - BLU-01 (Interceptor Aircraft):**
    *   Creates a flashing blue marker representing a JAS 39 Gripen taking off from F17.
    *   Draws a dashed `L.polyline` showing the flight trajectory aimed to intercept the TRK-U99 target.

---

## 3. Technical Significance Summary

*   **Custom HTML Markers (`L.divIcon`):** This screen does not use standard Leaflet pin markers; instead, it embeds raw HTML and CSS directly into the map. This allows for complex animations (flashing, rotating) and 100% customization as a Tactical HUD.
*   **SPA Compatibility:** The map loading function includes cleanup logic (`window.mapViewInstance.remove()`) to support navigating between pages without causing Memory Leaks.
*   **Decoupled UI:** The structure is clearly divided between the "Map Canvas" and the "Telemetry Sidebar". This ensures that in the future, backend API data can be easily integrated into the Sidebar without affecting the map's rendering logic.

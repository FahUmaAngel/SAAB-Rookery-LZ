# Logistics Workflow and Functionality Explanation (`logistics.html`)

The `logistics.html` page (or Operations Dashboard) serves as the central hub for military resource management and supply chain logistics. It focuses on dashboard-style data visualization, allowing the commander to quickly grasp the overall status of supplies, munitions, fuel, and transport routes.

---

## 1. Layout & Structure

This screen utilizes a three-column layout when viewed on large screens:

1.  **Global Sidebar (Far Left):** The main system menu (loaded via `shared-components.js`).
2.  **Subsidebar - Strategic Ops (Second Column):** A sub-menu specifically for logistics (Dashboard, Supply Chain, Maintenance, Personnel) for quick navigation.
3.  **Main Content Canvas (Right Area):** The dashboard display area, dividing data into distinct boxes (Bento Box Design) for easy reading.

---

## 2. Workflow & Features

Upon loading, the system displays simulated data, divided into the following key sections:

### Step 1: Critical Shortages Alert
*   **Function:** A red banner at the top immediately draws attention to resources that have fallen below their Minimum Operational Threshold.
*   **Example:** An alert showing that "ROTOR HUB" is down to 2 units (minimum requirement: 5) and "METEOR" missiles are down to 14 (minimum requirement: 20), prompting immediate action from the commander.

### Step 2: Main Resource Overview (Top Bento Box Grid)
Displays the current status gauges of 3 essential combat resources:
1.  **Fuel Reserves (JP-8):** Shows aviation fuel volume, alongside a graphical bar indicating capacity (78%) and the depletion rate (12kL/HR).
2.  **Munitions Stockpile:** Shows the quantities of missiles (IRIS-T, METEOR, GBU-39) using a linear Progress Bar. If levels are critical, the bar turns red.
3.  **Spare Parts Availability:** Displays the readiness percentage of spare parts via a Circular Indicator.

### Step 3: Supply Chain Route Visualization
*   **Function:** Presents logistics routes as visual graphics rather than mundane text tables.
*   **Techniques Used:** Employs CSS Animations (`dashFlow`) to animate connecting lines, simulating the movement of a Truck Convoy, a C-130H cargo plane, and a train (RAIL-09) from Origin to Destination.

### Step 4: AI Consumption Forecast (72H)
*   **Function:** A Bar Chart simulating predictive resource usage for the next 72 hours (from T+12H to T+72H).
*   **Key Features:** Includes fixed threshold lines indicating danger zones (WARN 60%, CRIT 30%) and an **AI ASSESSMENT** summarizing the situation clearly, e.g., "Fuel reserves become CRITICAL at T+60H without resupply. Recommend initiating emergency resupply via C-130H airlift NLT T+36H" (aligning with the Hackathon's requirement for forward-thinking predictive systems).

### Step 5: Depot Inventory Check
*   **Function:** An Accordion-style UI (click to expand) displaying data for individual warehouses (e.g., Depot Alpha, Depot Bravo).
*   **Details:** When expanded, it reveals sub-status bars for various categories (Ordnance, Fuel, Spares, Rations, Medical).

### Step 6: Inbound/Outbound and Resource Allocation Tables (Lower Section)
The bottom section tracks specific details:
1.  **Inbound / Outbound Pipeline:** Tables listing incoming and outgoing shipments, specifying time (ETA/ETD) and status (e.g., EN ROUTE, LOADING).
2.  **Resource Allocation:** Graphical representations showing available Hangar Bays and the deployment percentage of the Ground Crew.
3.  **Quick Actions:** Buttons for immediate commands, such as "Request Resupply" or "Cross-Depot Transfer".

---

## 3. Technical and UX/UI Significance Summary

*   **Bento Box UI:** The Bento box layout allows a massive amount of data to be packed into a single screen without making the user feel overwhelmed.
*   **Micro-interactions:** The inclusion of hover effects, tooltips (when hovering over graphs), and animations transforms static statistical data into an interface that feels alive and constantly updating in real-time.
*   **Information Hierarchy:** The prioritization of data is excellent. Critical information is placed at the top with flashing red indicators, while general data is placed lower down using standard tables.

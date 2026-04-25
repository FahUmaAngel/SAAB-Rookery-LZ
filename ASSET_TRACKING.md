# Asset Tracking

## Purpose

`Asset Tracking` is the resource overview page under `Logs & Intel`.

Its purpose is to help the operator quickly understand:

- which assets are available
- which assets are airborne, on ground, in hangar, or under repair
- how much fuel each asset has
- where assets are located in the operational area
- which asset is currently selected for closer inspection

This page supports Command and Control decision-making in a QRA / incidentberedskap scenario by focusing on asset readiness rather than full tactical command.

## What The Page Shows

### 1. KPI Cards

The top cards give a quick operational summary:

- `Alert Level`
- `Ready in 15`
- `Airborne`
- `Maintenance`
- `In Hangar`
- `On Field`
- `Average Fuel`

These are meant to answer the first question an operator has:

> What is our readiness right now?

### 2. Asset Overview Table

The table is the main list of resources.

It shows:

- asset name
- home base
- current state
- fuel level
- sector / location

The user can filter the table by:

- `All`
- `Airborne`
- `Ready`
- `Repair`

### 3. Asset Position Map

This map gives geographical context for the assets.

It shows:

- air bases
- airborne assets
- on-ground assets
- assets in hangar
- assets under repair

The map is there for position awareness, not full tactical planning.

### 4. Selected Asset Panel

When an asset is selected, the right-side panel shows:

- asset type
- current state
- exact coordinates
- fuel
- mission clock
- data link status
- ROE state
- commander notes

If the user clicks empty space on the map, the selected asset is cleared and the panel switches to a neutral `No Asset Selected` state.

### 5. Simple Status Guide

This section explains the main asset states in a simple way:

- `Airborne`
- `On Field / Ready`
- `Repair`

It is mainly there to make the page easier to explain during a presentation.

## Main Workflow

The page workflow is intentionally simple:

1. The operator opens the page and reads the KPI cards.
2. The operator checks the `Asset Overview` table.
3. The operator filters the list if needed.
4. The operator clicks an asset in the table or on the map.
5. The `Selected Asset` panel updates with more detail.
6. If the operator clicks empty map space, the selected asset is cleared.

This makes the page easy to navigate in a short demo.

## Live Telemetry Behavior

The page includes simulated live updates to make the dashboard feel active.

These updates are front-end only and are meant for presentation/demo purposes.

The live behavior includes:

- airborne assets slowly changing position on the map
- fuel values updating over time
- `Mission Clock` increasing for airborne assets
- `Ready in` countdown decreasing for assets on ground or in hangar
- KPI cards updating automatically as values change

This gives the impression of a live C2 dashboard without needing a backend.

## Asset States

The main asset states used on the page are:

- `Airborne`
  The asset is currently in flight and active.

- `On Field`
  The asset is on the ground and available for rapid launch or tasking.

- `Hangar`
  The asset is inside a hangar and not immediately active, but can still be part of the readiness picture.

- `Repair`
  The asset is unavailable and should not be selected for operational use.

## Data Link Meanings

The page uses a simplified set of data link statuses:

- `Connected`
  The asset is connected to the C2 system and can exchange information in real time.

- `Standby`
  The asset is not currently active in the network, but can connect quickly.

- `Command Node`
  The asset acts as a central coordination or battle-management node in the network.

- `Offline`
  No active connection is available.

These terms were simplified on purpose so they are easier to explain and defend in a presentation.

## Why This Page Exists

`Asset Tracking` does not replace the full tactical pages.

It complements pages such as:

- `Map View`
- `Sensor Fusion`
- `Comms`
- `Mission Logs`

Those pages focus on the larger incident picture.

`Asset Tracking` focuses only on one question:

> Which resources do we have, where are they, and how ready are they?

## Example Use Case

Example:

1. An unknown aircraft is detected in the Baltic region.
2. The operator opens `Asset Tracking`.
3. The operator checks which assets are airborne and which are ready to launch.
4. The operator reviews fuel and readiness values.
5. The operator selects a specific aircraft to inspect its detail panel.
6. The map is used to understand where that resource is positioned.

This helps the operator understand available resources before or during an intercept response.

## Short Presentation Version

You can explain the page like this:

> Asset Tracking is the resource overview page. It shows which aircraft and support assets are available, where they are located, how much fuel they have, and whether they are active, ready, or under repair. The operator can select one asset for more detail, and the page also includes simulated live updates to make the status picture feel real-time.

## Technical Note

The page is implemented in:

- `asset-tracking.html`

Navigation to the page is enabled through:

- `shared-components.js`

The page uses static front-end data with JavaScript-driven interaction and simulated live telemetry updates.

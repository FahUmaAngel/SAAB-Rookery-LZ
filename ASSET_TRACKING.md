# Asset Tracking

## Purpose

`Asset Tracking` is a sub-page under `Logs & Intel`.

The purpose of this page is to give the operator a simple overview of:

- which assets are available
- which assets are airborne, on the field, in hangar, or under repair
- how much fuel each asset has
- where active assets are located on the map
- which asset is currently selected for closer inspection

This page is meant to support Command and Control decision-making during a QRA / incidentberedskap scenario.

## Why This Page Exists

In a QRA workflow, the control center must quickly understand which aircraft or support assets can be used.

This page helps answer practical questions such as:

- Do we have aircraft ready to launch?
- Which assets are already airborne?
- Which assets are unavailable because of maintenance?
- How much fuel does each active asset have?
- Where are the currently active assets positioned in the operational area?

Instead of showing the full tactical decision flow, this page focuses specifically on resource awareness.

## Main Workflow

The workflow on this page is intentionally simple:

1. The operator enters the page and gets a quick readiness overview from the KPI cards at the top.
2. The operator checks the `Asset Overview` table to see all major assets and their status.
3. The operator can filter the list by `All`, `Airborne`, `Ready`, or `Repair`.
4. The operator selects an asset from the table or from the map.
5. The selected asset is shown in the `Selected Asset` panel with more detail.
6. The map helps the operator understand where active resources are positioned in the Baltic operational area.

## Page Structure

### 1. Top KPI Cards

These cards provide a fast summary of the situation:

- `Alert Level`
- `Ready in 15`
- `Airborne`
- `Maintenance`

This gives the operator an immediate understanding of the current readiness state.

### 2. Asset Overview

This is the main table on the page.

It shows:

- asset name
- home base
- state
- fuel level
- location / sector

This is the main operational entry point for selecting and reviewing assets.

### 3. Theater Position Plot

This section shows the asset picture on a Baltic-area map.

It includes:

- air bases
- airborne asset markers
- selected asset label
- geographic context such as Sweden, Finland, Gotland, and Kaliningrad

The map is there to support situational awareness, not full tactical map control.

### 4. Selected Asset

When the user clicks an asset in the table or on the map, the right-side detail panel updates.

It displays:

- asset type
- current state
- fuel
- mission clock
- datalink status
- ROE state
- short commander note

This makes it easier to understand the operational value of one specific resource.

### 5. Simple Status Guide

This block explains the meaning of the main status categories:

- `Airborne`
- `On Field / Ready`
- `Repair`

The goal is to make the page easier to understand for both users and presentation audiences.

## Example Operational Use

Example:

1. An unknown aircraft is detected over the Baltic region.
2. The operator opens `Asset Tracking`.
3. The operator checks which Gripen aircraft are already airborne and which are ready for launch.
4. The operator reviews fuel levels and status of active aircraft.
5. The operator selects a specific aircraft to inspect its detail panel.
6. The map is used to understand where that resource is located relative to the operational area.

This supports resource selection before or during interception.

## Design Choice

The page was simplified on purpose.

Instead of showing too many panels, the page focuses on four core ideas:

- readiness
- status
- fuel
- position

This makes it easier to explain and easier to use during a short demonstration.

## What This Page Does Not Try To Do

`Asset Tracking` is not the full tactical command page.

It does not replace:

- `Map View`
- `Sensor Fusion`
- `Comms`
- `Mission Logs`

Instead, it complements them by focusing only on fleet/resource awareness.

## Short Presentation Version

You can explain the page like this:

> Asset Tracking is the resource overview page. It shows which aircraft and support assets are available, which ones are active, how much fuel they have, where they are located, and whether they are ready or under repair. The operator can quickly select one asset and inspect its status in more detail.

## Technical Note

The page is implemented in:

- `asset-tracking.html`

Navigation to this page is enabled through:

- `shared-components.js`

The page uses a lightweight front-end approach with static data and interactive selection through JavaScript.

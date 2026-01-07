# Daggerheart: Fear Tracker

Adds a GM-controlled, animated slider bar for tracking Fear tokens in the Daggerheart system on Foundry VTT. This module is designed to integrate seamlessly with the game system, providing visual feedback for players and GMs alike.

<video src="https://github.com/user-attachments/assets/8adcbf9a-2e8b-4f2c-a36f-bafd2f457316" 
       controls 
       width="720"
       autoplay 
       loop 
       muted></video>

## Features

- **Automatic Sync:** The tracker automatically syncs with the Daggerheart system's Fear resource. Changes in the character sheet update the tracker, and changes in the tracker update the sheet.
- **Visual Effects:**
  - **Glow & Breath:** Active fear tokens pulse and breathe to draw attention.
  - **Tremor:** The bar shakes briefly when Fear increases, adding impact to the moment.
- **Customizable:**
  - **Themes:** Choose from various styles like **Nuclear**, **Ghost**, Skull, Blood Drop, Stone, and more.
  - **Button Styles:** Select specific designs for control buttons (Standard, Round, Squared) or match the main theme.
  - **Size & Width:** Easily switch between **Small**, **Normal**, and **Large** sizes and adjust the width to fit your screen.
  - **Tinting:** Apply color tints to active pips to match specific aesthetics using blend modes.
- **Drag & Drop:** Place the tracker anywhere on your screen. Positions are saved per user.
- **Visibility Modes:** Choose how the tracker is displayed: always visible, manually toggled via a button, or automatically hidden after inactivity.

## Configuration

Go to the **"Configure Settings"** menu in Foundry VTT -> **"Module Settings"** tab.

* **Theme:** Choose how the tracker looks. Includes **Nuclear**, **Ghost**, **Stone**, and more.
* **Buttons Theme:** Choose a specific style for the +/- buttons (e.g., Round, Squared) or use Custom images defined by the GM.
* **Visibility Behavior:** Select the visibility logic:
  * **None:** Always visible.
  * **Toggle Button:** Shows an eye icon to manually toggle visibility.
  * **Auto-Hide:** Automatically reduces visibility after 10 seconds of inactivity.
* **Tracker Size:** Select **Small**, **Normal**, or **Large**. (Recommended: Normal).
* **Tracker Bar Width:** Adjust the width in pixels.
* **Pulse/Breathing Effects:** Enable or disable animations.
* **Pulse Glow Color:** Pick a custom color for the glowing effect (outer glow).
* **Active Pip Tint Color:** Apply a color tint to the active tokens (e.g., `red`, `#00ff00`). Uses multiply blending to dye the texture naturally.
* **Custom Images:** If using the "Custom" theme, you can upload your own images here.
* **Hide System Bar:** Automatically sets the Daggerheart system's Fear bar setting to 'hide' to avoid visual clutter and duplication.

<p align="center">
  <img width="500" src="docs/settings.webp">
</p>

## Macro: Reset Position

If you lost the tracker off-screen or want to center it perfectly at the top of your window, you don't need a complex script anymore.

Simply create a new Script Macro with this single command:

```javascript
// Resets the tracker to the top-center of your screen
FearTracker.Reset();
```

You can also specify coordinates if you prefer a specific spot (X, Y):

```javascript
// Moves tracker to 100px from left and 100px from top
FearTracker.Reset(100, 100);
```

## Manual Installation

1. Copy this link: `https://raw.githubusercontent.com/brunocalado/daggerheart-fear-tracker/main/module.json`
2. Open Foundry VTT.
3. Go to the **"Add-on Modules"** tab and click **"Install Module"**.
4. Paste the link into the **"Manifest URL"** box and click Install.

## 📜 Changelog

You can read the full history of changes in the [CHANGELOG](CHANGELOG.md).

---

## ⚖️ Credits and License
This is a Fork from: [Fear Tracker for Foundry](https://github.com/andrewbrick/Fear-Tracker-for-Foundry)

**Disclaimer:** This module is an independent creation and is not affiliated with Darrington Press.

# 🧰 My Daggerheart Modules

| Module | Description |
| :--- | :--- |
| 💀 [**Adversary Manager**](https://github.com/brunocalado/daggerheart-advmanager) | Scale adversaries instantly and build balanced encounters in Foundry VTT. |
| ☠️ [**Death Moves**](https://github.com/brunocalado/daggerheart-death-moves) | Enhances the Death Move moment with immersive audio and visual effects. |
| 📏 [**Distances**](https://github.com/brunocalado/daggerheart-distances) | Visualizes combat ranges with customizable rings and hover calculations. |
| 🤖 [**Fear Macros**](https://github.com/brunocalado/daggerheart-fear-macros) | Automatically executes macros when the Fear resource is changed. |
| 😱 [**Fear Tracker**](https://github.com/brunocalado/daggerheart-fear-tracker) | Adds an animated slider bar with configurable fear tokens to the UI. |
| 🛒 [**Store**](https://github.com/brunocalado/daggerheart-store) | A dynamic, interactive, and fully configurable store for Foundry VTT. |
| 📦 [**Extra Content**](https://github.com/brunocalado/daggerheart-extra-content) | Additional resources and materials for Daggerheart. |
| 📜 [**Quick Rules**](https://github.com/brunocalado/daggerheart-quickrules) | Fast and accessible reference guide for the core rules. |

# 🗺️ Adventures

| Adventure | Description |
| :--- | :--- |
| ✨ [**I Wish**](https://github.com/brunocalado/i-wish-daggerheart-adventure) | A wealthy merchant is cursed; one final expedition may be the only hope. |
| 💣 [**Suicide Squad**](https://github.com/brunocalado/suicide-squad-daggerheart-adventure) | Criminals forced to serve a ruthless master in a land on the brink of war. |

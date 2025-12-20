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
  - **Size:** Easily switch between **Small**, **Normal**, and **Large** sizes to fit your screen.
  - **Width:** Adjust how wide the bar is.
- **Drag & Drop:** Place the tracker anywhere on your screen. Positions are saved per user.
- **Visibility Control:** The GM can toggle visibility for everyone. Players can also hide it locally for themselves if needed.

## Configuration

Go to the **"Configure Settings"** menu in Foundry VTT -> **"Module Settings"** tab.

* **Theme:** Choose how the tracker looks. Now includes **Nuclear** and **Ghost** themes!
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

# 🗡️ My Daggerheart Modules

### 📦 [daggerheart-extra-content](https://github.com/brunocalado/daggerheart-extra-content)
> Resources for Daggerheart

### 📏 [daggerheart-distances](https://github.com/brunocalado/daggerheart-distances)
> Visualizes Daggerheart combat ranges with customizable rings and hover distance calculations.

### 🛒 [daggerheart-store](https://github.com/brunocalado/daggerheart-store)
> A dynamic, interactive, and fully configurable store for the Daggerheart system in Foundry VTT. Allow your players to purchase weapons, armor, potions, and miscellaneous items directly from an elegant visual interface, while the GM maintains full control over prices and what is displayed.

### 😱 [daggerheart-fear-tracker](https://github.com/brunocalado/daggerheart-fear-tracker)
> Adds an animated slider bar with configurable fear tokens to the UI. Includes sync with Daggerheart system resources.

### 💀 [daggerheart-death-moves](https://github.com/brunocalado/daggerheart-death-moves)
> Enhances the Death Move moment with immersive audio, visual effects, and a dramatic interface for choosing between Avoid Death, Blaze of Glory, or Risk it All.

### 🤖 [daggerheart-fear-macros](https://github.com/brunocalado/daggerheart-fear-macros)
> Automatically executes macros when the Daggerheart system Fear resource is changed.

## 🗺️ Adventures

### 💣 [suicide-squad-daggerheart-adventure](https://github.com/brunocalado/suicide-squad-daggerheart-adventure)
> Torn from your past lives, you are a squad of criminals forced to serve a ruthless master. A deadly curse ensures your obedience, turning you into disposable pawns for an impossible mission. You are tasked with hunting a target of unimaginable importance in a land on the brink of war. Operating in the shadows where every step is watched, you must fight for survival and decide whether to obey your orders or risk everything to change your fate.

### ✨ [i-wish-daggerheart-adventure](https://github.com/brunocalado/i-wish-daggerheart-adventure)
> A wealthy merchant has been cursed and is doomed to die within a few weeks. The only hope of breaking the curse lies in a legendary artifact said to rest deep within a mountain. With time running out, the merchant is organizing one final expedition to retrieve the item—or die trying. He has summoned a group of remarkable individuals to undertake this perilous mission.


## 📜 Changelog

You can read the full history of changes in the [CHANGELOG](CHANGELOG.md).

---

## ⚖️ Credits and License
This is a Fork from: [Fear Tracker for Foundry](https://github.com/andrewbrick/Fear-Tracker-for-Foundry)

**Disclaimer:** This module is an independent creation and is not affiliated with Darrington Press.

# Daggerheart: Fear Tracker

Adds a GM-controlled, animated slider bar for tracking Fear tokens in the Daggerheart system on Foundry VTT. This module is designed to integrate seamlessly with the game system, providing visual feedback for players and GMs alike.

<video src="https://github.com/user-attachments/assets/e81c608f-982a-4c8d-8093-0d4c9576c966" 
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
  - **Themes:** Choose from various styles like Skull, Blood Drop, Stone, and more.
  - **Size:** Easily switch between **Small**, **Normal**, and **Large** sizes to fit your screen.
  - **Width:** Adjust how wide the bar is.
- **Drag & Drop:** Place the tracker anywhere on your screen. Positions are saved per user.
- **Visibility Control:** The GM can toggle visibility for everyone. Players can also hide it locally for themselves if needed.

## Configuration

Go to the **"Configure Settings"** menu in Foundry VTT -> **"Module Settings"** tab.

* **Theme:** Choose how the tracker looks.
* **Tracker Size:** Select **Small**, **Normal**, or **Large**. (Recommended: Normal).
* **Tracker Bar Width:** Adjust the width in pixels.
* **Pulse/Breathing Effects:** Enable or disable animations.
* **Pulse Glow Color:** Pick a custom color for the glowing effect.
* **Custom Images:** If using the "Custom" theme, you can upload your own images here.

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

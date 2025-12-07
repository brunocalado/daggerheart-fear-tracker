# Daggerheart: Fear Tracker

Adds a GM-controlled, animated slider bar for tracking Fear tokens in the Daggerheart system on Foundry VTT. This module is designed to integrate seamlessly with the game system, providing visual feedback for players and GMs alike.

## Features

- **Automatic Sync:** The tracker automatically syncs with the Daggerheart system's Fear resource and Homebrew configuration (Max Fear tokens). Changes in the character sheet update the tracker, and changes in the tracker update the sheet.
- **Multiple Themes:** Choose from a variety of visual styles including Skull, Stone, Capybara, Demon, Bones, Blood Drop, and Stone Red.
- **Visual Effects:** Active fear tokens feature a customizable pulsing glow animation.
- **Customizable:** - Adjust the visual scale of the tracker.
  - Choose the color of the pulse effect.
  - Use your own custom images for the slider, pips, and buttons.
- **Drag & Drop:** Place the tracker anywhere on your screen. Positions are saved per user.
- **Visibility Control:** The GM can toggle the visibility of the tracker for players. When hidden, it remains visible to the GM at reduced opacity.

## Configuration

You can access the module settings in the Foundry VTT "Configure Settings" menu under the "Module Settings" tab.

* **Theme:** Select the visual theme for the tracker.
* **Hide System Fear Bar:** Option to hide the native Daggerheart system fear bar.
* **Pulse Effect:** Enable or disable the glowing pulse animation for active tokens.
* **Pulse Glow Color:** Choose the color of the glow effect.
* **Tracker Scale:** Resize the tracker (0.5x to 2.0x).
* **Tracker Bar Width:** Adjust the width of the tracker bar.
* **Custom Images:** If the "Custom" theme is selected, you can provide file paths for the Slider, Active Pip, Inactive Pip, Plus Button, and Minus Button.

## Macro: Reset Position

If you accidentally drag the Fear Tracker off-screen or lose it, don't worry! This module comes with a built-in Macro to reset its position.

1. Open the **Compendium Packs** tab in Foundry.
2. Look for the **"Fear Tracker Macros"** compendium.
3. Drag the **"Reset Fear Tracker Position"** macro to your hotbar.
4. Click it to reset the tracker to the default position (100px, 100px).

## Manual Installation

To install this module manually, use the following manifest URL in the "Install Module" dialog within Foundry VTT:

`https://raw.githubusercontent.com/brunocalado/daggerheart-fear-tracker/main/module.json`

## 📜 Changelog

You can read the full history of changes in the [CHANGELOG](CHANGELOG.md).

---

## ⚖️ Credits and License
This is a Fork from: [Fear Tracker for Foundry](https://github.com/andrewbrick/Fear-Tracker-for-Foundry)

**Disclaimer:** This module is an independent creation and is not affiliated with Darrington Press.

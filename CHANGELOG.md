# 1.2.4

- [Added] New "Custom Images" settings menu, opened via a button in the module's settings, with a "Use Custom Images" toggle and Slider Bar / Activated Pip / Inactive Pip image pickers, each with a thumbnail preview and a larger hover preview
- [Changed] "Theme" setting no longer offers a "Custom" choice — overriding the theme's images is now done via the "Use Custom Images" toggle in the new Custom Images menu
- [Changed] GM custom Slider/Pip image settings moved out of the main settings list into the new Custom Images menu; they're empty by default and, left empty, fall back to the selected theme's image
- [Fixed] Existing worlds with the old "Custom" theme selected are automatically migrated to the "Use Custom Images" toggle so their configured images keep working

# 1.2.3

- [Changed] The +/- buttons are now built with plain HTML/CSS/JS instead of image assets — square, beveled, gold on the left (-) and purple on the right (+)
- [Changed] "Buttons Theme" setting (image skins: Standard, Round, Squared, Custom) replaced with a simple "Show +/- Buttons" toggle
- [Removed] GM custom Plus/Minus Button Image settings — no longer needed since the buttons aren't image-based

# 1.2.2

- [Added] New "Visual Effects" settings menu, opened via a button in the module's settings, grouping Pulse Effect, Pulse Glow Color, Breathing Effect, and Active Pip Tint Color into one dialog
- [Changed] Pulse Effect (Glow), Pulse Glow Color, Breathing Effect (Scale), and Active Pip Tint Color no longer appear in the main settings list — moved into the new Visual Effects menu
- [Changed] Pulse Glow Color and Active Pip Tint Color now use a color picker (swatch + text field) instead of a plain text input
- [Changed] Boolean toggles in the Visual Effects menu now render as switches instead of checkboxes

# 1.2.1

- [Fixed] Custom pip/slider/button images (set via the FilePicker settings) now update the Fear Tracker immediately instead of requiring a client reload

# 1.2.0

- v14 only
- [Changed] Split monolithic `scripts/main.js` into 7 focused ESM modules: `constants.js`, `helpers.js`, `sync.js`, `controls.js`, `renderer.js`, `settings.js`, `main.js`
- [Changed] Converted from classic script to ES module (`esmodules` in `module.json`)
- [Fixed] Fear Tracker can no longer be dragged outside the visible viewport — movement is now clamped to safe bounds

# 1.1.0

- You don't need +/- buttons. Just click the pips

# 1.0.9
- set to hide is done right now

# 1.0.8
- Use also CSS to remove the system bar 

# 1.0.7
- Should fix: https://github.com/brunocalado/daggerheart-fear-tracker/issues/3

# 1.0.6
- new buttons
- new setting for visibility: always visible; old behavior; auto hide

# 1.0.5
- NUCLEAR and ghost options
- You can change the color of the pips in settings.
- system is set to hide without hack thing (safer). Should solve https://github.com/brunocalado/daggerheart-fear-tracker/issues/2
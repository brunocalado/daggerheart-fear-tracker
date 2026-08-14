import { MODULE_ID, VISIBILITY_SETTING } from "./constants.js";
import { applyPulseColor, checkAndHideSystemBar } from "./helpers.js";
import { reRender } from "./renderer.js";
import { EffectsSettingsApp } from "./apps/effects-settings-app.js";

/**
 * Registers all module settings with Foundry's settings API.
 * Called from the init hook before the game is ready.
 */
export function registerSettings() {
    game.settings.register(MODULE_ID, "theme", {
        name: "Theme",
        hint: "Choose the visual theme.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "custom": "Custom",
            "stone": "Stone",
            "stone-red": "Stone Red"
        },
        default: "stone",
        onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "buttonTheme", {
        name: "Buttons Theme",
        hint: "Choose a specific style for the +/- buttons, or match the main theme. 'None' hides the buttons entirely.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "none": "None",
            "match-theme": "Match Main Theme",
            "custom": "Custom (Use GM Images)",
            "standard": "Standard",
            "round-yp": "Round",
            "round-yp-white": "Round (White)",
            "squared-yp": "Squared",
            "squared-yp-white": "Squared (White)"
        },
        default: "none",
        onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "visibilityMode", {
        name: "Visibility Behavior",
        hint: "Select how the tracker visibility is handled. 'None': Always visible (default). 'Button': Toggle visibility manually. 'Auto': Hides after 10s of inactivity.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "none": "None (Always Visible)",
            "button": "Toggle Button",
            "auto": "Auto-Hide (10s)"
        },
        default: "none",
        onChange: () => reRender()
    });

    game.settings.registerMenu(MODULE_ID, "effectsMenu", {
        name: "Visual Effects",
        label: "Configure Effects",
        hint: "Configure the pulse glow, breathing animation, and pip tint color for active fear tokens.",
        icon: "fa-solid fa-sparkles",
        type: EffectsSettingsApp,
        restricted: true
    });

    game.settings.register(MODULE_ID, "enablePulse", {
        name: "Pulse Effect (Glow)", hint: "Enable glowing animation for active fear tokens.",
        scope: "world", config: false, type: Boolean, default: true, onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "pulseColor", {
        name: "Pulse Glow Color", hint: "Enter CSS color (e.g. #6a0dad, red, rgba(100,0,0,0.5)). Controls the outer glow.",
        scope: "world", config: false, type: String, default: "#6a0dad", onChange: () => applyPulseColor()
    });

    game.settings.register(MODULE_ID, "pipTintColor", {
        name: "Active Pip Tint Color", hint: "Enter CSS color (e.g. red, #ff0000). Adds a color tint layer over the image.",
        scope: "world", config: false, type: String, default: "", onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "enableScaleAnimation", {
        name: "Breathing Effect (Scale)", hint: "Enable the growing/shrinking animation for active fear tokens.",
        scope: "world", config: false, type: Boolean, default: true, onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "trackerSize", {
        name: "Tracker Size", hint: "Select the size of the Fear Tracker bar locally.",
        scope: "client", config: true, type: String,
        choices: { "small": "Small", "normal": "Normal", "large": "Large" },
        default: "normal", onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "trackerWidth", {
        name: "Tracker Bar Width", hint: "Adjust the width of the bar in pixels locally to fit your screen.",
        scope: "client", config: true, type: Number,
        range: { min: 400, max: 2000, step: 10 }, default: 700, onChange: () => reRender()
    });

    const imageSettings = [
        { key: "sliderImage", name: "Slider Bar Image", default: "slider.png" },
        { key: "pipActiveImage", name: "Activated Pip Image", default: "pip-active.png" },
        { key: "pipInactiveImage", name: "Inactive Pip Image", default: "pip-inactive.png" },
        { key: "plusImage", name: "Plus Button Image", default: "plus.png" },
        { key: "minusImage", name: "Minus Button Image", default: "minus.png" }
    ];

    imageSettings.forEach(s => {
        game.settings.register(MODULE_ID, s.key, {
            name: `GM (Custom): ${s.name}`, scope: "world", config: true, type: String, filePicker: "image",
            default: `modules/${MODULE_ID}/images/stone/${s.default}`,
            onChange: () => reRender()
        });
    });

    game.settings.register(MODULE_ID, "hideTrackerClient", {
        name: "Hide Fear Tracker (Local)", hint: "Hides the Fear Tracker module bar only for you.",
        scope: "client", config: true, type: Boolean, default: false, onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "hideSystemBar", {
        name: "Hide System Bar", hint: "Automatically sets the Daggerheart system's Fear bar setting to 'hide'.",
        scope: "client", config: true, type: Boolean, default: true, onChange: () => checkAndHideSystemBar()
    });

    game.settings.register(MODULE_ID, "leftSideCount", {
        name: "Pip Count Left Side (Internal)", scope: "world", config: false, type: Number, default: 12
    });

    game.settings.register(MODULE_ID, "activeFear", { scope: "world", config: false, type: Number, default: 0 });
    game.settings.register(MODULE_ID, VISIBILITY_SETTING, { scope: "world", config: false, type: Boolean, default: true });
    game.settings.register(MODULE_ID, "largeTrackerPosition", { scope: "client", config: false, type: Object, default: { top: "100px", left: "100px" } });
}

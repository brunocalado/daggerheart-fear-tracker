import { MODULE_ID, SYSTEM_ID, SYSTEM_HOMEBREW_SETTING } from "./constants.js";

// Owned exclusively by refreshAutoVisibility; not exported.
let _autoHideTimer = null;

/**
 * Reads the system's Homebrew setting to determine the configured max fear tokens.
 * Falls back to 12 if the setting is absent or unparseable.
 * @returns {number}
 */
export function getMaxFearTokens() {
    const DEFAULT_MAX = 12;
    try {
        if (!game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_HOMEBREW_SETTING}`)) return DEFAULT_MAX;
        const homebrewSetting = game.settings.get(SYSTEM_ID, SYSTEM_HOMEBREW_SETTING);
        if (!homebrewSetting) return DEFAULT_MAX;

        let configData = homebrewSetting;
        if (typeof homebrewSetting === "string") {
            try { configData = JSON.parse(homebrewSetting); } catch (e) { return DEFAULT_MAX; }
        }
        if (configData && typeof configData === "object" && "maxFear" in configData) {
            return Number(configData.maxFear) || DEFAULT_MAX;
        }
        return DEFAULT_MAX;
    } catch (err) {
        return DEFAULT_MAX;
    }
}

/**
 * Resolves the filesystem path for a tracker asset based on the current theme setting.
 * @param {string} type - "slider" | "pipActive" | "pipInactive"
 * @returns {string}
 */
export function getThemeAsset(type) {
    const theme = game.settings.get(MODULE_ID, "theme");
    const fileMap = {
        slider: "slider.png", pipActive: "pip-active.png", pipInactive: "pip-inactive.png"
    };
    const customSettingMap = {
        slider: "sliderImage", pipActive: "pipActiveImage", pipInactive: "pipInactiveImage"
    };

    if (theme === "custom") {
        if (customSettingMap[type]) return game.settings.get(MODULE_ID, customSettingMap[type]);
        return `modules/${MODULE_ID}/images/stone/${fileMap[type]}`;
    }
    return `modules/${MODULE_ID}/images/${theme}/${fileMap[type]}`;
}

/**
 * Writes the pulse glow color from settings into the CSS custom property.
 */
export function applyPulseColor() {
    const color = game.settings.get(MODULE_ID, "pulseColor");
    document.documentElement.style.setProperty("--fear-glow-color", color);
}

/**
 * Shows the tracker immediately and schedules it to fade after 10 seconds of inactivity.
 * No-op when visibilityMode is not "auto".
 */
export function refreshAutoVisibility() {
    const mode = game.settings.get(MODULE_ID, "visibilityMode");
    if (mode !== "auto") return;
    const el = document.getElementById("fear-tracker-container");
    if (!el) return;

    el.style.opacity = "1";
    if (_autoHideTimer) clearTimeout(_autoHideTimer);
    _autoHideTimer = setTimeout(() => {
        el.style.opacity = "0.5";
    }, 10000);
}

/**
 * Applies the CSS class that hides the system fear bar and enforces the system setting when applicable.
 * Runs for all clients so players benefit visually even without world-write permission.
 * @returns {Promise<void>}
 */
export async function checkAndHideSystemBar() {
    const shouldHide = game.settings.get(MODULE_ID, "hideSystemBar");

    if (shouldHide) {
        document.body.classList.add("dh-ft-hide-system-bar");
    } else {
        document.body.classList.remove("dh-ft-hide-system-bar");
        return;
    }

    if (!CONFIG.DH) return;

    try {
        const key = CONFIG.DH.SETTINGS.gameSettings.appearance;
        const rawSettings = game.settings.get(CONFIG.DH.id, key);

        // toObject handles Foundry v14 DataModel instances gracefully
        const currentSettings = (typeof rawSettings.toObject === "function")
            ? rawSettings.toObject()
            : { ...rawSettings };

        if (currentSettings.displayFear !== "hide") {
            await game.settings.set(CONFIG.DH.id, key, { ...currentSettings, displayFear: "hide" });
            console.log("Daggerheart Fear Tracker | System Fear Bar setting forced to 'hide'.");
        }
    } catch (err) {
        console.warn("Daggerheart Fear Tracker | Failed to enforce system hide setting:", err);
    }
}

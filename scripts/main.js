import { MODULE_ID, SYSTEM_ID, SYSTEM_FEAR_SETTING, VISIBILITY_SETTING } from "./constants.js";
import { applyPulseColor, checkAndHideSystemBar, getMaxFearTokens } from "./helpers.js";
import { registerSettings } from "./settings.js";
import { syncTrackerFromSystem, syncSystemFromTracker } from "./sync.js";
import { toggleVisibilityUI } from "./controls.js";
import { updatePips, reRender, initializeTracker } from "./renderer.js";

Hooks.once("init", () => {
    registerSettings();
});

Hooks.once("ready", async () => {
    try {
        applyPulseColor();

        if (game.user.isGM) {
            const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
            if (isVisible === undefined) {
                await game.settings.set(MODULE_ID, VISIBILITY_SETTING, true);
            }

            // Migration: the "custom" theme choice was replaced by the "Use Custom Images"
            // toggle. Worlds still storing the old value need to be moved onto the new scheme.
            if (game.settings.get(MODULE_ID, "theme") === "custom") {
                await game.settings.set(MODULE_ID, "useCustomImages", true);
                await game.settings.set(MODULE_ID, "theme", "stone");
            }
        }

        initializeTracker();
        checkAndHideSystemBar();

        window.FearTracker = {
            /**
             * Repositions the tracker. Omit x/y to reset to top center.
             * @param {number|string|null} x
             * @param {number|string|null} y
             * @returns {Promise<void>}
             */
            Reset: async (x = null, y = null) => {
                const el = document.getElementById("fear-tracker-container");
                if (!el) return;

                const sizeSetting = game.settings.get(MODULE_ID, "trackerSize");
                const sizeMap = { small: 0.6, normal: 1.0, large: 1.4 };
                const scale = sizeMap[sizeSetting] || 1.0;
                const visualWidth = el.offsetWidth * scale;

                const leftVal = x !== null ? (typeof x === "number" ? `${x}px` : x) : `${Math.max(0, (window.innerWidth / 2) - (visualWidth / 2))}px`;
                const topVal = y !== null ? (typeof y === "number" ? `${y}px` : y) : "100px";

                const newPos = { left: leftVal, top: topVal };
                await game.settings.set(MODULE_ID, "largeTrackerPosition", newPos);
                el.style.left = newPos.left;
                el.style.top = newPos.top;
                ui.notifications.info("Daggerheart Fear Tracker: Reset to Top Center.");
            }
        };
    } catch (err) {
        console.error("Daggerheart Fear Tracker | Initialization Error:", err);
    }
});

Hooks.on("updateSetting", (setting, change, options, userId) => {
    if (setting.key === `${MODULE_ID}.leftSideCount`) {
        const newValue = (change && typeof change.value !== "undefined") ? change.value : game.settings.get(MODULE_ID, "leftSideCount");
        updatePips(newValue);
        if (game.user.isGM) {
            syncSystemFromTracker(getMaxFearTokens() - newValue);
        }
    }

    if (setting.key === `${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`) {
        let fearValue = (change && typeof change.value !== "undefined") ? change.value : game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        if (typeof fearValue === "object" && fearValue !== null && "value" in fearValue) {
            fearValue = fearValue.value;
        }
        const numericValue = Number(fearValue);
        if (!isNaN(numericValue)) syncTrackerFromSystem(numericValue);
    }

    if (setting.key === `${MODULE_ID}.${VISIBILITY_SETTING}`) {
        toggleVisibilityUI();
    }

    if (setting.key.startsWith(MODULE_ID)) {
        if (setting.key.includes("pulseColor")) {
            applyPulseColor();
        } else if (
            setting.key.includes("pipTintColor") ||
            setting.key.includes("enablePulse") ||
            setting.key.includes("enableScaleAnimation") ||
            setting.key.includes("trackerSize") ||
            setting.key.includes("theme") ||
            setting.key.includes("showControlButtons") ||
            setting.key.includes("visibilityMode")
        ) {
            reRender();
        } else if (setting.key.includes("hideSystemBar")) {
            checkAndHideSystemBar();
        }
    }
});

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (document.getElementById("slider-bar")) reRender();
    }, 200);
});

import { MODULE_ID, SYSTEM_ID, SYSTEM_FEAR_SETTING } from "./constants.js";
import { getMaxFearTokens } from "./helpers.js";

/**
 * Updates the module's leftSideCount when the system Fear resource changes.
 * Only the GM writes the setting; all clients receive the update via the updateSetting hook.
 * @param {number} systemFearValue
 * @returns {Promise<void>}
 */
export async function syncTrackerFromSystem(systemFearValue) {
    const maxTokens = getMaxFearTokens();
    const safeFear = Math.max(0, Math.min(systemFearValue, maxTokens));
    const newLeftSide = maxTokens - safeFear;

    const currentLeftSide = game.settings.get(MODULE_ID, "leftSideCount");
    if (newLeftSide !== currentLeftSide && game.user.isGM) {
        await game.settings.set(MODULE_ID, "leftSideCount", newLeftSide);
    }
}

/**
 * Pushes the module's current fear value back to the system's Fear resource.
 * No-op for non-GM clients; only one write occurs when the value has actually changed.
 * @param {number} activeFearValue
 * @returns {Promise<void>}
 */
export async function syncSystemFromTracker(activeFearValue) {
    if (!game.user.isGM) return;
    if (!game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) return;

    const currentSetting = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
    const currentValue = (typeof currentSetting === "object" && currentSetting !== null && "value" in currentSetting)
        ? currentSetting.value
        : currentSetting;

    if (Number(currentValue) === activeFearValue) return;

    // Preserve the object wrapper if the system uses one, to avoid schema mismatches
    let valueToSave = activeFearValue;
    if (typeof currentSetting === "object" && currentSetting !== null && "value" in currentSetting) {
        valueToSave = foundry.utils.deepClone(currentSetting);
        valueToSave.value = activeFearValue;
    }

    await game.settings.set(SYSTEM_ID, SYSTEM_FEAR_SETTING, valueToSave);
}

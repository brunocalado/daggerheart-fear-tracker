import { MODULE_ID, VISIBILITY_SETTING } from "./constants.js";
import { getMaxFearTokens, getThemeAsset } from "./helpers.js";

/**
 * Increments or decrements leftSideCount by delta, clamped to [0, maxFear].
 * No-op for non-GM clients.
 * @param {number} delta
 * @returns {Promise<void>}
 */
export async function modifyCount(delta) {
    if (!game.user.isGM) return;
    const current = game.settings.get(MODULE_ID, "leftSideCount");
    const max = getMaxFearTokens();

    let next = current + delta;
    if (next < 0) next = 0;
    if (next > max) next = max;

    if (next !== current) {
        // Setting change triggers the updateSetting hook which drives UI and system sync
        await game.settings.set(MODULE_ID, "leftSideCount", next);
    }
}

/**
 * Creates a +/- control button image element.
 * stopPropagation on mousedown prevents the parent drag handler from stealing the click.
 * @param {string} type - "plus" or "minus"
 * @param {Function} onClick
 * @param {string} [sizeClass]
 * @returns {HTMLImageElement}
 */
export function createControlBtn(type, onClick, sizeClass = "") {
    const img = document.createElement("img");
    img.src = getThemeAsset(type);
    img.className = `control-btn ${sizeClass}`;

    img.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
    });

    img.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
    });

    return img;
}

/**
 * Creates the eye-icon button that toggles tracker visibility.
 * @param {string} [sizeClass]
 * @returns {HTMLElement}
 */
export function createVisibilityBtn(sizeClass = "") {
    const eye = document.createElement("i");
    const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    eye.className = `${isVisible ? "fas fa-eye" : "fas fa-eye-slash"} visibility-icon ${sizeClass}`;

    eye.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
    });

    eye.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!game.user.isGM) return;
        const newState = !game.settings.get(MODULE_ID, VISIBILITY_SETTING);
        await game.settings.set(MODULE_ID, VISIBILITY_SETTING, newState);
    });

    return eye;
}

/**
 * Updates tracker opacity and the eye-icon class when the visibility setting changes.
 * No-op when visibilityMode is not "button".
 */
export function toggleVisibilityUI() {
    const mode = game.settings.get(MODULE_ID, "visibilityMode");
    if (mode !== "button") return;

    const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    const opacity = visible ? "1" : (game.user.isGM ? "0.5" : "0");
    const iconClass = visible ? "fas fa-eye" : "fas fa-eye-slash";

    const el = document.getElementById("fear-tracker-container");
    if (el) el.style.opacity = opacity;

    document.querySelectorAll(".visibility-icon").forEach(icon => {
        icon.className = `${iconClass} visibility-icon ${icon.classList.contains("small") ? "small" : ""}`;
    });
}

/**
 * Attaches drag-and-drop positioning to a tracker element.
 * Position is persisted to a client-scoped setting on mouseup.
 * @param {HTMLElement} tracker
 * @param {string} settingKey
 */
export function setupDrag(tracker, settingKey) {
    let offset = { x: 0, y: 0 };
    let isDragging = false;

    function onMouseMove(event) {
        if (!isDragging) return;
        event.preventDefault();
        const maxLeft = window.innerWidth * 0.5;
        const maxTop = window.innerHeight - tracker.offsetHeight;
        const newLeft = Math.max(-maxLeft, Math.min(event.clientX - offset.x, maxLeft));
        const newTop = Math.max(0, Math.min(event.clientY - offset.y, maxTop));
        tracker.style.left = `${newLeft}px`;
        tracker.style.top = `${newTop}px`;
    }

    function onMouseUp(event) {
        if (!isDragging) return;
        event.preventDefault();
        isDragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        game.settings.set(MODULE_ID, settingKey, {
            top: tracker.style.top,
            left: tracker.style.left
        });
    }

    tracker.addEventListener("mousedown", (event) => {
        // Buttons and pips handle their own stopPropagation, but guard here too
        if (event.target.closest(".control-btn") || event.target.closest(".visibility-icon") || event.target.closest(".pip-wrapper")) return;
        event.preventDefault();
        isDragging = true;
        offset = {
            x: event.clientX - tracker.offsetLeft,
            y: event.clientY - tracker.offsetTop
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
}

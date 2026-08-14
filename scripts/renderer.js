import { MODULE_ID, VISIBILITY_SETTING } from "./constants.js";
import { getMaxFearTokens, getThemeAsset, refreshAutoVisibility } from "./helpers.js";
import { modifyCount, createControlBtn, createVisibilityBtn, setupDrag } from "./controls.js";

/**
 * Updates pip positions and opacity without rebuilding the DOM.
 * @param {number} leftSideCount
 */
export function updatePips(leftSideCount) {
    if (leftSideCount === undefined || leftSideCount === null || isNaN(leftSideCount)) return;
    const totalPips = getMaxFearTokens();
    updateUI(leftSideCount, totalPips);
    refreshAutoVisibility();
}

/**
 * Animates each pip wrapper to its correct position and opacity.
 * Falls back to reRender when the DOM pip count doesn't match totalPips (e.g. maxFear changed).
 * @param {number} leftSideCount
 * @param {number} totalPips
 */
export function updateUI(leftSideCount, totalPips) {
    const slider = document.getElementById("slider-bar");
    if (!slider) return;

    const currentPipsDom = document.querySelectorAll(".pip-wrapper");
    if (currentPipsDom.length !== totalPips) {
        reRender();
        return;
    }

    const activeCount = totalPips - leftSideCount;
    const sliderWidth = slider.clientWidth;

    for (let i = 0; i < totalPips; i++) {
        const wrapper = currentPipsDom[i];
        if (!wrapper) continue;

        const inactiveImg = wrapper.querySelector(".pip-inactive");
        const activeEl = wrapper.querySelector(".pip-active");
        const isActive = i >= leftSideCount;
        let targetLeft;

        if (isActive) {
            const activeIndex = i - leftSideCount;
            // Right-side pips pack from the right edge: total width minus space for all active pips minus padding
            const startX = sliderWidth - (activeCount * 28) - 15;
            targetLeft = startX + (activeIndex * 28);
        } else {
            targetLeft = i * 28 + 15;
        }

        if (isNaN(targetLeft)) targetLeft = 0;

        wrapper.style.left = `${targetLeft}px`;
        if (inactiveImg) inactiveImg.style.opacity = isActive ? "0" : "1";
        if (activeEl) activeEl.style.opacity = isActive ? "1" : "0";
    }
}

/**
 * Destroys and recreates the tracker DOM element.
 */
export function reRender() {
    const el = document.getElementById("fear-tracker-container");
    if (el) el.remove();
    renderLargeTracker();
}

/**
 * Builds and injects the full tracker DOM into document.body.
 * No-op when hideTrackerClient is enabled for this client.
 */
export function renderLargeTracker() {
    if (game.settings.get(MODULE_ID, "hideTrackerClient")) return;

    const isGM = game.user.isGM;
    const pos = game.settings.get(MODULE_ID, "largeTrackerPosition");
    const sizeSetting = game.settings.get(MODULE_ID, "trackerSize");
    const sizeMap = { small: 0.6, normal: 1.0, large: 1.4 };
    const scale = sizeMap[sizeSetting] || 1.0;
    const pipTintColor = game.settings.get(MODULE_ID, "pipTintColor");
    const visibilityMode = game.settings.get(MODULE_ID, "visibilityMode");

    const pipOffsets = { small: "-1px", normal: "-2px", large: "-1px" };
    const pipMarginTop = pipOffsets[sizeSetting] || "4px";

    const preferredWidth = game.settings.get(MODULE_ID, "trackerWidth");
    const maxAllowedWidth = (window.innerWidth / scale) - 40;
    const finalWidth = Math.min(preferredWidth, maxAllowedWidth);

    const container = document.createElement("div");
    container.id = "fear-tracker-container";
    container.style.left = pos.left || "100px";
    container.style.top = pos.top || "100px";
    if (scale !== 1.0) container.style.transform = `scale(${scale})`;

    if (visibilityMode === "none" || visibilityMode === "auto") {
        container.style.opacity = "1";
    } else {
        const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
        container.style.opacity = visible ? "1" : (isGM ? "0.5" : "0");
    }

    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "fear-slider-wrapper";

    const slider = document.createElement("div");
    slider.id = "slider-bar";
    slider.style.width = `${finalWidth}px`;
    slider.style.backgroundImage = `url(${getThemeAsset("slider")})`;

    const totalPips = getMaxFearTokens();
    let leftSideCount = game.settings.get(MODULE_ID, "leftSideCount");
    if (leftSideCount > totalPips) leftSideCount = totalPips;

    const pipContainer = document.createElement("div");
    pipContainer.className = "pip-container";

    const inactiveSrc = getThemeAsset("pipInactive");
    const activeSrc = getThemeAsset("pipActive");
    const enablePulse = game.settings.get(MODULE_ID, "enablePulse");
    const enableScaleAnim = game.settings.get(MODULE_ID, "enableScaleAnimation");

    for (let i = 0; i < totalPips; i++) {
        const pipWrapper = document.createElement("div");
        pipWrapper.className = "pip-wrapper";
        pipWrapper.style.marginTop = pipMarginTop;

        const inactiveImg = document.createElement("img");
        inactiveImg.src = inactiveSrc;
        inactiveImg.className = "pip-img pip-inactive";

        let activeElement;
        if (pipTintColor && pipTintColor.trim() !== "") {
            activeElement = document.createElement("div");
            activeElement.className = "pip-active-group pip-active";
            const baseImg = document.createElement("img");
            baseImg.src = activeSrc;
            baseImg.className = "pip-img pip-active-base";
            const tintLayer = document.createElement("div");
            tintLayer.className = "pip-tint-layer";
            tintLayer.style.backgroundColor = pipTintColor;
            tintLayer.style.maskImage = `url(${activeSrc})`;
            tintLayer.style.webkitMaskImage = `url(${activeSrc})`;
            tintLayer.style.maskSize = "contain";
            tintLayer.style.webkitMaskSize = "contain";
            tintLayer.style.maskRepeat = "no-repeat";
            tintLayer.style.webkitMaskRepeat = "no-repeat";
            tintLayer.style.maskPosition = "center";
            tintLayer.style.webkitMaskPosition = "center";
            activeElement.appendChild(baseImg);
            activeElement.appendChild(tintLayer);
        } else {
            activeElement = document.createElement("img");
            activeElement.src = activeSrc;
            activeElement.className = "pip-img pip-active";
        }

        if (enablePulse) activeElement.classList.add("pulse");
        if (enableScaleAnim) activeElement.classList.add("breathing");
        activeElement.style.opacity = "0";

        pipWrapper.appendChild(inactiveImg);
        pipWrapper.appendChild(activeElement);

        if (isGM) {
            pipWrapper.classList.add("clickable");
            pipWrapper.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                e.preventDefault();
            });
            const pipIndex = i;
            pipWrapper.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                const currentLeftSide = game.settings.get(MODULE_ID, "leftSideCount");
                // Active pip (right side) removes fear; inactive pip (left side) adds it
                modifyCount(pipIndex >= currentLeftSide ? 1 : -1);
            });
        }

        pipContainer.appendChild(pipWrapper);
    }
    slider.appendChild(pipContainer);

    if (isGM) {
        const showButtons = game.settings.get(MODULE_ID, "showControlButtons");
        if (showButtons) {
            const minus = createControlBtn("minus", () => modifyCount(1));
            const plus = createControlBtn("plus", () => modifyCount(-1));
            sliderWrapper.appendChild(minus);
            sliderWrapper.appendChild(slider);
            sliderWrapper.appendChild(plus);
        } else {
            sliderWrapper.appendChild(slider);
        }
        if (visibilityMode === "button") {
            sliderWrapper.appendChild(createVisibilityBtn());
        }
    } else {
        sliderWrapper.appendChild(slider);
    }

    container.appendChild(sliderWrapper);
    setupDrag(container, "largeTrackerPosition");
    document.body.appendChild(container);

    if (visibilityMode === "auto") {
        container.addEventListener("mouseenter", refreshAutoVisibility);
        container.addEventListener("mousemove", refreshAutoVisibility);
        container.addEventListener("click", refreshAutoVisibility);
        refreshAutoVisibility();
    }

    updateUI(leftSideCount, totalPips);
}

/**
 * Performs the initial render. Called once from the ready hook.
 */
export function initializeTracker() {
    reRender();
}

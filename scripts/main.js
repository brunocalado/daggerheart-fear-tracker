/**
 * Module: Daggerheart: Fear Tracker
 * Compatible with: Foundry VTT v13
 */

const MODULE_ID = "daggerheart-fear-tracker";
const SYSTEM_ID = "daggerheart";
const SYSTEM_FEAR_SETTING = "ResourcesFear";
const SYSTEM_HOMEBREW_SETTING = "Homebrew";

const VISIBILITY_SETTING = "trackerVisible_v3"; 

// Global timer for Auto-Hide mode
let _autoHideTimer = null;

/* -------------------------------------------- */
/* Hooks & Initialization                      */
/* -------------------------------------------- */

Hooks.once("init", () => {
    registerSettings();
});

Hooks.once("ready", async () => {
    try {
        applyPulseColor();
        
        // Ensure initial visibility for GM if using button mode
        if (game.user.isGM) {
            const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
            // If undefined or false, force true for safety on first load logic
            if (isVisible === undefined) {
                await game.settings.set(MODULE_ID, VISIBILITY_SETTING, true);
            }
        }

        // Initialize bar
        initializeTracker();

        // Check system bar hiding - Optimized Pattern
        checkAndHideSystemBar();

        // --- EXPOSE API ---
        window.FearTracker = {
            Reset: async (x = null, y = null) => {
                const el = document.getElementById("fear-tracker-container");
                if (!el) return;
                
                // Defaults
                const sizeSetting = game.settings.get(MODULE_ID, "trackerSize");
                const sizeMap = { small: 0.6, normal: 1.0, large: 1.4 };
                const scale = sizeMap[sizeSetting] || 1.0;
                const visualWidth = el.offsetWidth * scale;

                let leftVal = x !== null ? (typeof x === "number" ? `${x}px` : x) : `${Math.max(0, (window.innerWidth / 2) - (visualWidth / 2))}px`;
                let topVal = y !== null ? (typeof y === "number" ? `${y}px` : y) : "100px";

                const newPos = { left: leftVal, top: topVal };
                await game.settings.set(MODULE_ID, "largeTrackerPosition", newPos);
                
                el.style.left = newPos.left;
                el.style.top = newPos.top;
                ui.notifications.info(`Daggerheart Fear Tracker: Reset to Top Center.`);
            }
        };
        
    } catch (err) {
        console.error("Daggerheart Fear Tracker | Initialization Error:", err);
    }
});

/* -------------------------------------------- */
/* Settings Sync Logic (The Brain)             */
/* -------------------------------------------- */

Hooks.on("updateSetting", (setting, change, options, userId) => {
    // 1. Module Internal Count Changed -> Update UI for everyone
    if (setting.key === `${MODULE_ID}.leftSideCount`) {
        const newValue = (change && typeof change.value !== 'undefined') ? change.value : game.settings.get(MODULE_ID, "leftSideCount");
        
        // Update the visual UI
        updatePips(newValue);

        // If I am the GM, I must ensure the System stays in sync with this module change
        if (game.user.isGM) {
            const totalPips = getMaxFearTokens();
            const activeFear = totalPips - newValue;
            syncSystemFromTracker(activeFear);
        }
    }

    // 2. System Fear Resource Changed -> Update Module Internal Count
    if (setting.key === `${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`) {
        // Handle both object {value: x} and direct number formats
        let fearValue = (change && typeof change.value !== 'undefined') ? change.value : game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        
        if (typeof fearValue === 'object' && fearValue !== null && 'value' in fearValue) {
            fearValue = fearValue.value;
        }

        const numericValue = Number(fearValue);
        if (!isNaN(numericValue)) {
            syncTrackerFromSystem(numericValue);
        }
    }

    // 3. Visibility Toggled
    if (setting.key === `${MODULE_ID}.${VISIBILITY_SETTING}`) {
        toggleVisibilityUI();
    }

    // 4. Other Visual Settings
    if (setting.key.startsWith(MODULE_ID)) {
        if (setting.key.includes("pulseColor")) applyPulseColor();
        else if (setting.key.includes("pipTintColor") || 
                 setting.key.includes("enablePulse") || 
                 setting.key.includes("enableScaleAnimation") || 
                 setting.key.includes("trackerSize") || 
                 setting.key.includes("theme") || 
                 setting.key.includes("buttonTheme") || 
                 setting.key.includes("visibilityMode")) {
            reRender();
        }
        else if (setting.key.includes("hideSystemBar")) {
            checkAndHideSystemBar();
        }
    }
});

// Resize listener
let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (document.getElementById("slider-bar")) reRender();
    }, 200);
});

/* -------------------------------------------- */
/* Logic: Sync Functions                       */
/* -------------------------------------------- */

// Called when System Setting changes. Updates Module Setting.
async function syncTrackerFromSystem(systemFearValue) {
    const maxTokens = getMaxFearTokens();
    const safeFear = Math.max(0, Math.min(systemFearValue, maxTokens));
    const newLeftSide = maxTokens - safeFear;
    
    // Check current value to avoid infinite loops
    const currentLeftSide = game.settings.get(MODULE_ID, "leftSideCount");

    if (newLeftSide !== currentLeftSide) {
        // Only GM needs to write the setting to the DB. 
        // Players will receive the update via Hook when GM writes it.
        // However, if we want the UI to be responsive for players even if GM is offline (rare for system sync), 
        // we usually rely on GM. For safety, we only set if GM.
        if (game.user.isGM) {
             await game.settings.set(MODULE_ID, "leftSideCount", newLeftSide);
        } 
        // Note: We do NOT call updatePips here directly for players. 
        // We wait for the 'updateSetting' hook of 'leftSideCount' to trigger.
    }
}

// Called when Module Setting changes. Updates System Setting.
async function syncSystemFromTracker(activeFearValue) {
    if (!game.user.isGM) return; // Only GM writes to System

    if (game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) {
        const currentSetting = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        
        let currentValue;
        if (typeof currentSetting === 'object' && currentSetting !== null && 'value' in currentSetting) {
            currentValue = currentSetting.value;
        } else {
            currentValue = currentSetting;
        }

        // Only update if different to prevent loops
        if (Number(currentValue) !== activeFearValue) {
            let valueToSave = activeFearValue;
            
            // Preserve object structure if system uses it
            if (typeof currentSetting === 'object' && currentSetting !== null && 'value' in currentSetting) {
                valueToSave = foundry.utils.deepClone(currentSetting);
                valueToSave.value = activeFearValue;
            }

            await game.settings.set(SYSTEM_ID, SYSTEM_FEAR_SETTING, valueToSave);
        }
    }
}

/* -------------------------------------------- */
/* Logic: Rendering & UI Updates               */
/* -------------------------------------------- */

function updatePips(leftSideCount) {
    // Robust safety check
    if (leftSideCount === undefined || leftSideCount === null || isNaN(leftSideCount)) return;

    const totalPips = getMaxFearTokens();
    const activeCount = totalPips - leftSideCount;

    updateUI(leftSideCount, totalPips);
    refreshAutoVisibility();
}

function updateUI(leftSideCount, totalPips) {
    const slider = document.getElementById("slider-bar");
    if (!slider) return;

    const currentPipsDom = document.querySelectorAll(".pip-wrapper");
    // If pip count mismatch (e.g. max fear changed), full re-render
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
            // Right Side (Active) logic
            const activeIndex = i - leftSideCount;
            // Calculation: (Total Width) - (Space for all active pips) - Padding
            const startX = sliderWidth - (activeCount * 28) - 15;
            targetLeft = startX + (activeIndex * 28);
        } else {
            // Left Side (Inactive) logic
            targetLeft = i * 28 + 15;
        }

        // Safety against NaN
        if (isNaN(targetLeft)) targetLeft = 0;

        wrapper.style.left = `${targetLeft}px`;
        
        if (inactiveImg) inactiveImg.style.opacity = isActive ? "0" : "1";
        if (activeEl) activeEl.style.opacity = isActive ? "1" : "0";
    }
}

function reRender() {
    const el = document.getElementById("fear-tracker-container");
    if (el) el.remove();
    renderLargeTracker();
}

function renderLargeTracker() {
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

    // --- Container ---
    const container = document.createElement("div");
    container.id = "fear-tracker-container";
    container.style.left = pos.left || "100px";
    container.style.top = pos.top || "100px";
    if (scale !== 1.0) container.style.transform = `scale(${scale})`;
    
    // Visibility Init
    if (visibilityMode === "none" || visibilityMode === "auto") {
        container.style.opacity = "1";
    } else {
        const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
        container.style.opacity = visible ? "1" : (isGM ? "0.5" : "0");
    }

    // --- Wrapper & Bar ---
    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "fear-slider-wrapper";

    const slider = document.createElement("div");
    slider.id = "slider-bar";
    slider.style.width = `${finalWidth}px`;
    slider.style.backgroundImage = `url(${getThemeAsset('slider')})`;

    // --- Pips Generation ---
    const totalPips = getMaxFearTokens();
    let leftSideCount = game.settings.get(MODULE_ID, "leftSideCount");
    if (leftSideCount > totalPips) leftSideCount = totalPips;

    const pipContainer = document.createElement("div");
    pipContainer.className = "pip-container";
    
    const inactiveSrc = getThemeAsset('pipInactive');
    const activeSrc = getThemeAsset('pipActive');
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
        // Tint Logic
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
        pipContainer.appendChild(pipWrapper);
    }
    slider.appendChild(pipContainer);

    // --- Controls ---
    if (isGM) {
        const minus = createControlBtn("minus", () => modifyCount(1)); 
        const plus = createControlBtn("plus", () => modifyCount(-1));
        
        sliderWrapper.appendChild(minus);
        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(plus);

        if (visibilityMode === "button") {
            const eye = createVisibilityBtn();
            sliderWrapper.appendChild(eye);
        }
    } else {
        sliderWrapper.appendChild(slider);
    }

    container.appendChild(sliderWrapper);
    
    // Attach Drag logic to container
    setupDrag(container, "largeTrackerPosition");
    
    document.body.appendChild(container);

    // Auto visibility listeners
    if (visibilityMode === "auto") {
        container.addEventListener("mouseenter", refreshAutoVisibility);
        container.addEventListener("mousemove", refreshAutoVisibility);
        container.addEventListener("click", refreshAutoVisibility);
        refreshAutoVisibility();
    }
    
    // Initial Positioning
    updateUI(leftSideCount, totalPips);
}

function initializeTracker() {
    // Initial sync from System to ensure we start correct
    if (game.user.isGM && game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) {
        const settingValue = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        const numericValue = (typeof settingValue === 'object' && settingValue !== null && 'value' in settingValue) 
            ? settingValue.value 
            : settingValue;
            
        if (!isNaN(Number(numericValue))) {
            const max = getMaxFearTokens();
            const left = max - Number(numericValue);
            // We set local variable manually or update setting if extremely off
            // But let's just trigger a re-render
        }
    }
    reRender();
}

/* -------------------------------------------- */
/* User Interaction                            */
/* -------------------------------------------- */

async function modifyCount(delta) {
    if (!game.user.isGM) return;
    let current = game.settings.get(MODULE_ID, "leftSideCount");
    const max = getMaxFearTokens();
    
    let next = current + delta;
    if (next < 0) next = 0;
    if (next > max) next = max;

    if (next !== current) {
        // This triggers the Hook loop which updates UI and System
        await game.settings.set(MODULE_ID, "leftSideCount", next);
    }
}

function createControlBtn(type, onClick, sizeClass = "") {
    const img = document.createElement("img");
    img.src = getThemeAsset(type);
    img.className = `control-btn ${sizeClass}`;
    
    // STOP PROPAGATION IS CRITICAL HERE
    // Prevents the "Drag" event from the parent container firing when clicking the button
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

function createVisibilityBtn(sizeClass = "") {
    const eye = document.createElement("i");
    const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    eye.className = `${isVisible ? "fas fa-eye" : "fas fa-eye-slash"} visibility-icon ${sizeClass}`;
    
    // STOP PROPAGATION HERE TOO
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

function toggleVisibilityUI() {
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

function setupDrag(tracker, settingKey) {
    let offset = { x: 0, y: 0 };
    let isDragging = false;
    
    function onMouseMove(event) {
        if (!isDragging) return;
        event.preventDefault();
        tracker.style.left = `${event.clientX - offset.x}px`;
        tracker.style.top = `${event.clientY - offset.y}px`;
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
        // Double check we aren't clicking a button (though stopPropagation in buttons should handle it)
        if (event.target.closest('.control-btn') || event.target.closest('.visibility-icon')) return;
        
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

/* -------------------------------------------- */
/* Helpers                                     */
/* -------------------------------------------- */

function refreshAutoVisibility() {
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

function getMaxFearTokens() {
    const DEFAULT_MAX = 12;
    try {
        if (!game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_HOMEBREW_SETTING}`)) return DEFAULT_MAX;
        const homebrewSetting = game.settings.get(SYSTEM_ID, SYSTEM_HOMEBREW_SETTING);
        if (!homebrewSetting) return DEFAULT_MAX;

        let configData = homebrewSetting;
        if (typeof homebrewSetting === 'string') {
            try { configData = JSON.parse(homebrewSetting); } catch (e) { return DEFAULT_MAX; }
        }
        if (configData && typeof configData === 'object' && 'maxFear' in configData) {
            return Number(configData.maxFear) || DEFAULT_MAX;
        }
        return Number(DEFAULT_MAX);
    } catch (err) {
        return DEFAULT_MAX;
    }
}

function getThemeAsset(type) {
    const theme = game.settings.get(MODULE_ID, "theme");
    const buttonTheme = game.settings.get(MODULE_ID, "buttonTheme");
    const fileMap = {
        slider: "slider.png", pipActive: "pip-active.png", pipInactive: "pip-inactive.png", minus: "minus.png", plus: "plus.png"
    };
    const customSettingMap = {
        slider: "sliderImage", pipActive: "pipActiveImage", pipInactive: "pipInactiveImage", minus: "minusImage", plus: "plusImage"
    };
    if (type === "minus" || type === "plus") {
        if (buttonTheme === "custom") {
             if (customSettingMap[type]) return game.settings.get(MODULE_ID, customSettingMap[type]);
        }
        else if (buttonTheme && buttonTheme !== "match-theme") {
            return `modules/${MODULE_ID}/images/buttons/${buttonTheme}/${fileMap[type]}`;
        }
    }
    if (theme === "custom") {
        if (customSettingMap[type]) return game.settings.get(MODULE_ID, customSettingMap[type]);
        return `modules/${MODULE_ID}/images/stone/${fileMap[type]}`;
    } else {
        return `modules/${MODULE_ID}/images/${theme}/${fileMap[type]}`;
    }
}

function applyPulseColor() {
    const color = game.settings.get(MODULE_ID, "pulseColor");
    document.documentElement.style.setProperty('--fear-glow-color', color);
}

// Optimized function to check and hide system bar securely
async function checkAndHideSystemBar() {
    const shouldHide = game.settings.get(MODULE_ID, "hideSystemBar");

    // 1. Client-side Visual Toggle (CSS)
    // Always runs so players get the visual benefit even if they can't change world settings
    if (shouldHide) {
        document.body.classList.add("dh-ft-hide-system-bar");
    } else {
        document.body.classList.remove("dh-ft-hide-system-bar");
        return; // If we are unhiding, we don't enforce "hide" in settings
    }

    // 2. System Setting Enforcement (System Config)
    // Removed isGM check so players can update their own client settings if the system setting scope allows it.
    if (!CONFIG.DH) return;

    try {
        const key = CONFIG.DH.SETTINGS.gameSettings.appearance;
        
        // Get raw settings
        const rawSettings = game.settings.get(CONFIG.DH.id, key);

        // Safe conversion using toObject if available (Foundry V13 DataModels)
        const currentSettings = (typeof rawSettings.toObject === 'function') 
            ? rawSettings.toObject() 
            : { ...rawSettings };

        // Verify and Save if necessary
        if (currentSettings.displayFear !== "hide") {
            await game.settings.set(CONFIG.DH.id, key, { 
                ...currentSettings, 
                displayFear: "hide" 
            });
            console.log("Daggerheart Fear Tracker | System Fear Bar setting forced to 'hide'.");
        }

    } catch (err) {
        console.warn("Daggerheart Fear Tracker | Failed to enforce system hide setting:", err);
    }
}

function registerSettings() {
    game.settings.register(MODULE_ID, "theme", {
        name: "Theme",
        hint: "Choose the visual theme.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "blood-drop": "Blood Drop",
            "bones": "Bones",
            "capybara": "Capybara",
            "custom": "Custom",
            "demon": "Demon",
            "fire": "Fire",
            "ghost": "Ghost",
            "nuclear": "Nuclear",
            "skull": "Skull",
            "stone": "Stone",
            "stone-red": "Stone Red"
        },
        default: "skull",
        onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "buttonTheme", {
        name: "Buttons Theme",
        hint: "Choose a specific style for the +/- buttons, or match the main theme.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "match-theme": "Match Main Theme",
            "custom": "Custom (Use GM Images)",
            "standard": "Standard",
            "round-yp": "Round",
            "round-yp-white": "Round (White)",
            "squared-yp": "Squared",
            "squared-yp-white": "Squared (White)"
        },
        default: "match-theme",
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

    game.settings.register(MODULE_ID, "enablePulse", {
        name: "Pulse Effect (Glow)", hint: "Enable glowing animation for active fear tokens.",
        scope: "world", config: true, type: Boolean, default: true, onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "pulseColor", {
        name: "Pulse Glow Color", hint: "Enter CSS color (e.g. #6a0dad, red, rgba(100,0,0,0.5)). Controls the outer glow.",
        scope: "world", config: true, type: String, default: "#6a0dad", onChange: () => applyPulseColor()
    });

    game.settings.register(MODULE_ID, "pipTintColor", {
        name: "Active Pip Tint Color", hint: "Enter CSS color (e.g. red, #ff0000). Adds a color tint layer over the image.",
        scope: "world", config: true, type: String, default: "", onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "enableScaleAnimation", {
        name: "Breathing Effect (Scale)", hint: "Enable the growing/shrinking animation for active fear tokens.",
        scope: "world", config: true, type: Boolean, default: true, onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "trackerSize", {
        name: "Tracker Size", hint: "Select the size of the Fear Tracker bar locally.",
        scope: "client", config: true, type: String, choices: { "small": "Small", "normal": "Normal", "large": "Large" }, default: "normal", onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "trackerWidth", {
        name: "Tracker Bar Width", hint: "Adjust the width of the bar in pixels locally to fit your screen.",
        scope: "client", config: true, type: Number, range: { min: 400, max: 2000, step: 10 }, default: 700, onChange: () => reRender()
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
            default: `modules/${MODULE_ID}/images/stone/${s.default}`
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
        name: "Pip Count Left Side (Internal)", scope: "world", config: false, type: Number, default: 12,
        // onChange logic handled by global Hook
    });

    game.settings.register(MODULE_ID, "activeFear", { scope: "world", config: false, type: Number, default: 0 });
    game.settings.register(MODULE_ID, VISIBILITY_SETTING, { scope: "world", config: false, type: Boolean, default: true });
    game.settings.register(MODULE_ID, "largeTrackerPosition", { scope: "client", config: false, type: Object, default: { top: "100px", left: "100px" } });
}
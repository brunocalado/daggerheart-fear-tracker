/**
 * Module: Daggerheart: Fear Tracker
 * Compatible with: Foundry VTT v13
 */

const MODULE_ID = "daggerheart-fear-tracker";
const SYSTEM_ID = "daggerheart";
const SYSTEM_FEAR_SETTING = "ResourcesFear";
const SYSTEM_HOMEBREW_SETTING = "Homebrew";
const SYSTEM_APPEARANCE_SETTING = "Appearance"; // New setting key

const VISIBILITY_SETTING = "trackerVisible_v2"; 

// Initialize module and register settings
Hooks.once("init", () => {
    registerSettings();
});

// Initialize tracker UI when Foundry is ready
Hooks.once("ready", () => {
    applyPulseColor();
    
    // Apply system fear bar hiding logic on startup
    applySystemFearHidden();

    initializeTracker();
    
    // Listen for changes in system settings to sync state
    Hooks.on("updateSetting", (setting, value, options, userId) => {
        // Detect change in the System's Fear value
        if (setting.key === `${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`) {
            let fearValue = value;
            // Handle if value is an object (common in Daggerheart system)
            if (typeof value === 'object' && value !== null && 'value' in value) {
                fearValue = value.value;
            }
            const numericValue = Number(fearValue);
            if (!isNaN(numericValue)) {
                syncTrackerFromSystem(numericValue);
            }
        }

        // Detect change in Max Fear (Homebrew configuration)
        if (setting.key === `${SYSTEM_ID}.${SYSTEM_HOMEBREW_SETTING}`) {
            reRender();
        }
    });

    // Re-render on window resize to ensure constraints
    window.addEventListener("resize", () => {
        const slider = document.getElementById("slider-bar");
        if (slider) reRender();
    });
});

/* -------------------------------------------- */
/* System Integration Logic                    */
/* -------------------------------------------- */

// Logic to hide the native Daggerheart system fear bar
async function applySystemFearHidden() {
    // Only GM should change world settings to avoid conflicts
    if (!game.user.isGM) return;

    const shouldHide = game.settings.get(MODULE_ID, "hideSystemFear");

    if (!shouldHide) return;

    try {
        if (!game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_APPEARANCE_SETTING}`)) {
            return;
        }

        const appearanceSetting = game.settings.get(SYSTEM_ID, SYSTEM_APPEARANCE_SETTING);
        
        let configData = appearanceSetting;
        let isString = false;

        // Parse if it's a string (expected behavior)
        if (typeof appearanceSetting === 'string') {
            try {
                configData = JSON.parse(appearanceSetting);
                isString = true;
            } catch (e) {
                return; // Abort if parsing fails
            }
        }

        // Check if displayFear is already hidden to avoid unnecessary writes
        if (configData && typeof configData === 'object') {
            if (configData.displayFear !== "hide") {
                // Update the value
                configData.displayFear = "hide";
                
                // Prepare value to save (stringify if it was a string)
                const valueToSave = isString ? JSON.stringify(configData) : configData;
                
                // Save the setting
                await game.settings.set(SYSTEM_ID, SYSTEM_APPEARANCE_SETTING, valueToSave);
                // ui.notifications.info("Daggerheart Fear Tracker: Native system fear bar hidden.");
            }
        }

    } catch (err) {
        // Silent fail
    }
}

/* -------------------------------------------- */
/* Theme Asset Helper                          */
/* -------------------------------------------- */

// Retrieve the correct image path based on the selected theme
function getThemeAsset(type) {
    const theme = game.settings.get(MODULE_ID, "theme");

    const fileMap = {
        slider: "slider.png",
        pipActive: "pip-active.png",
        pipInactive: "pip-inactive.png",
        minus: "minus.png", 
        plus: "plus.png"
    };

    const customSettingMap = {
        slider: "sliderImage",
        pipActive: "pipActiveImage",
        pipInactive: "pipInactiveImage",
        minus: "minusImage",
        plus: "plusImage"
    };

    if (theme === "custom") {
        // Return user-defined path if custom theme is active
        if (customSettingMap[type]) {
            return game.settings.get(MODULE_ID, customSettingMap[type]);
        }
        // Fallback to stone theme if setting is missing
        return `modules/${MODULE_ID}/images/stone/${fileMap[type]}`;
    } else {
        // Return path from the selected theme folder
        return `modules/${MODULE_ID}/images/${theme}/${fileMap[type]}`;
    }
}

// Update the CSS variable for the pulse glow color
function applyPulseColor() {
    const color = game.settings.get(MODULE_ID, "pulseColor");
    document.documentElement.style.setProperty('--fear-glow-color', color);
}

/* -------------------------------------------- */
/* System Data Logic                           */
/* -------------------------------------------- */

// Retrieve the maximum number of fear tokens from Daggerheart system settings
function getMaxFearTokens() {
    const DEFAULT_MAX = 12;

    try {
        if (!game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_HOMEBREW_SETTING}`)) {
            return DEFAULT_MAX;
        }

        const homebrewSetting = game.settings.get(SYSTEM_ID, SYSTEM_HOMEBREW_SETTING);
        if (!homebrewSetting) return DEFAULT_MAX;

        let configData = homebrewSetting;

        // Parse JSON if the setting is stored as a string
        if (typeof homebrewSetting === 'string') {
            try {
                configData = JSON.parse(homebrewSetting);
            } catch (e) {
                return DEFAULT_MAX;
            }
        }

        if (configData && typeof configData === 'object' && 'maxFear' in configData) {
            return Number(configData.maxFear) || DEFAULT_MAX;
        }

        return DEFAULT_MAX;

    } catch (err) {
        return DEFAULT_MAX;
    }
}

/* -------------------------------------------- */
/* Synchronization Logic                       */
/* -------------------------------------------- */

// Update the local tracker based on a value received from the System
async function syncTrackerFromSystem(systemFearValue) {
    const maxTokens = getMaxFearTokens();
    let safeFear = Math.max(0, Math.min(systemFearValue, maxTokens));
    const newLeftSide = maxTokens - safeFear;
    const currentLeftSide = game.settings.get(MODULE_ID, "leftSideCount");

    if (newLeftSide !== currentLeftSide) {
        if (game.user.isGM) {
             await game.settings.set(MODULE_ID, "leftSideCount", newLeftSide);
             // Broadcast update to other clients via socket
             game.socket.emit(`module.${MODULE_ID}`, { type: "updatePips", leftSideCount: newLeftSide });
        }
        updatePips(newLeftSide);
    }
}

// Push a local tracker change to the System settings
async function syncSystemFromTracker(activeFearValue) {
    if (game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) {
        const currentSetting = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        
        let valueToSave = activeFearValue;
        let needsUpdate = false;

        // Handle object structure vs primitive value
        if (typeof currentSetting === 'object' && currentSetting !== null && 'value' in currentSetting) {
            if (currentSetting.value !== activeFearValue) {
                valueToSave = foundry.utils.deepClone(currentSetting);
                valueToSave.value = activeFearValue;
                needsUpdate = true;
            }
        } else {
            if (currentSetting !== activeFearValue) {
                valueToSave = activeFearValue;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await game.settings.set(SYSTEM_ID, SYSTEM_FEAR_SETTING, valueToSave);
        }
    }
}

/* -------------------------------------------- */
/* Settings Configuration                      */
/* -------------------------------------------- */

function registerSettings() {
    // Theme Selection
    game.settings.register(MODULE_ID, "theme", {
        name: "Theme",
        hint: "Choose the visual theme.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            skull: "Skull",
            custom: "Custom",
            stone: "Stone",
            capybara: "Capybara",
            demon: "Demon",
            bones: "Bones",
            "blood-drop": "Blood Drop",
            "stone-red": "Stone Red"
        },
        default: "skull",
        onChange: () => reRender()
    });

    // NEW: Hide System Fear Setting
    game.settings.register(MODULE_ID, "hideSystemFear", {
        name: "Hide System Fear Bar",
        hint: "If enabled, this module will attempt to hide the native Daggerheart system fear bar by modifying the system's appearance settings (displayFear = hide).",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => applySystemFearHidden()
    });

    // Pulse Effect Toggle
    game.settings.register(MODULE_ID, "enablePulse", {
        name: "Pulse Effect",
        hint: "Enable pulsing glow animation for active fear tokens.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => reRender()
    });

    // Pulse Color Picker
    game.settings.register(MODULE_ID, "pulseColor", {
        name: "Pulse Glow Color",
        hint: "Select the color for the fear token glow/pulse effect.",
        scope: "client",
        config: true,
        type: new game.colorPicker.ColorPickerField(),
        default: "#6a0dad",
        onChange: () => {
            applyPulseColor();
        }
    });

    // Tracker Scale Slider
    game.settings.register(MODULE_ID, "trackerScale", {
        name: "Tracker Scale",
        hint: "Adjust the size of the Fear Tracker bar. (Client side)",
        scope: "client",
        config: true,
        type: Number,
        range: {
            min: 0.5,
            max: 2.0,
            step: 0.1
        },
        default: 1.0,
        onChange: () => reRender()
    });

    // Tracker Width Setting
    game.settings.register(MODULE_ID, "trackerWidth", {
        name: "Tracker Bar Width",
        hint: "Adjust the base width of the bar in pixels. This affects all users. The bar will automatically shrink if it exceeds the screen width.",
        scope: "world",
        config: true,
        type: Number,
        range: {
            min: 400,
            max: 2000,
            step: 10
        },
        default: 1000,
        onChange: () => reRender()
    });

    // --- Custom Image Settings ---
    
    game.settings.register(MODULE_ID, "sliderImage", {
        name: "GM (Custom): Slider Bar Image",
        scope: "world",
        config: true,
        type: String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/images/stone/slider.png`
    });

    game.settings.register(MODULE_ID, "pipActiveImage", {
        name: "GM (Custom): Activated Pip Image",
        scope: "world",
        config: true,
        type: String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/images/stone/pip-active.png`
    });

    game.settings.register(MODULE_ID, "pipInactiveImage", {
        name: "GM (Custom): Inactive Pip Image",
        scope: "world",
        config: true,
        type: String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/images/stone/pip-inactive.png`
    });

    game.settings.register(MODULE_ID, "plusImage", {
        name: "GM (Custom): Plus Button Image",
        scope: "world",
        config: true,
        type: String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/images/stone/plus.png`
    });

    game.settings.register(MODULE_ID, "minusImage", {
        name: "GM (Custom): Minus Button Image",
        scope: "world",
        config: true,
        type: String,
        filePicker: "image",
        default: `modules/${MODULE_ID}/images/stone/minus.png`
    });

    // --- Internal State Settings (Hidden) ---

    game.settings.register(MODULE_ID, "leftSideCount", {
        name: "Pip Count Left Side (Internal)",
        scope: "world",
        config: false,
        type: Number,
        default: 12,
        onChange: (value) => {
            if (!game.user.isGM) return;
            const max = getMaxFearTokens();
            game.settings.set(MODULE_ID, "activeFear", max - value);
        }
    });

    game.settings.register(MODULE_ID, "activeFear", {
        name: "Active Fear (Internal)",
        scope: "world",
        config: false,
        type: Number,
        default: 0
    });

    game.settings.register(MODULE_ID, VISIBILITY_SETTING, {
        name: "Slider Bar Visible",
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "largeTrackerPosition", {
        scope: "client",
        config: false,
        type: Object,
        default: { top: "100px", left: "100px" }
    });
}

/* -------------------------------------------- */
/* Core Logic                                  */
/* -------------------------------------------- */

// Update visual state and sync with system if GM
async function updatePips(leftSideCount) {
    const totalPips = getMaxFearTokens();
    const activeCount = totalPips - leftSideCount;

    updateUI(leftSideCount, totalPips);

    if (game.user.isGM) {
        syncSystemFromTracker(activeCount);
    }
}

/* -------------------------------------------- */
/* UI Rendering Logic                          */
/* -------------------------------------------- */

let container = null;
let pips = [];
let slider = null;

// Initialize the tracker element and listeners
function initializeTracker() {
    const isGM = game.user.isGM;

    // Initial sync with System data
    if (isGM && game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) {
        const settingValue = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        const numericValue = (typeof settingValue === 'object' && settingValue !== null && 'value' in settingValue) 
            ? settingValue.value 
            : settingValue;
            
        if (!isNaN(Number(numericValue))) {
            syncTrackerFromSystem(Number(numericValue));
        }
    }

    reRender();

    // Listen for socket events from other clients
    game.socket.on(`module.${MODULE_ID}`, (payload) => {
        if (payload.type === "updatePips") {
            updatePips(payload.leftSideCount);
        }
        if (payload.type === "toggleVisibility") {
            toggleVisibilityUI();
        }
    });
}

// Clean up existing elements and re-render the tracker
function reRender() {
    const el = document.getElementById("fear-tracker-container");
    if (el) el.remove();

    container = null;
    pips = [];
    slider = null;

    renderLargeTracker();
}

// Build the Large Tracker DOM elements
function renderLargeTracker() {
    const isGM = game.user.isGM;
    const pos = game.settings.get(MODULE_ID, "largeTrackerPosition");
    
    // Scale settings
    const scale = game.settings.get(MODULE_ID, "trackerScale");
    // Width settings (User preferred width)
    const preferredWidth = game.settings.get(MODULE_ID, "trackerWidth");
    
    // Constraint Logic: Ensure bar doesn't overflow screen width
    // window.innerWidth / scale gives us the effective pixel width available in the scaled context
    // We subtract 40px for a safe margin
    const maxAllowedWidth = (window.innerWidth / scale) - 40;
    
    // The final width is the lesser of the preference or the max allowed
    const finalWidth = Math.min(preferredWidth, maxAllowedWidth);

    container = document.createElement("div");
    container.id = "fear-tracker-container";
    container.style.left = pos.left || "0";
    container.style.top = pos.top || "0";
    
    // Apply scale transform
    if (scale !== 1.0) {
        container.style.transform = `scale(${scale})`;
    }
    
    const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    container.style.opacity = visible ? "1" : (isGM ? "0.5" : "0");

    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "fear-slider-wrapper";

    slider = document.createElement("div");
    slider.id = "slider-bar";
    
    // Apply dynamic width
    slider.style.width = `${finalWidth}px`;
    slider.style.backgroundImage = `url(${getThemeAsset('slider')})`;

    const totalPips = getMaxFearTokens();
    let leftSideCount = game.settings.get(MODULE_ID, "leftSideCount");
    
    if (leftSideCount > totalPips) leftSideCount = totalPips;

    const pipContainer = document.createElement("div");
    pipContainer.className = "pip-container";

    const inactiveSrc = getThemeAsset('pipInactive');
    const activeSrc = getThemeAsset('pipActive');
    
    const enablePulse = game.settings.get(MODULE_ID, "enablePulse");

    for (let i = 0; i < totalPips; i++) {
        const pipWrapper = document.createElement("div");
        pipWrapper.className = "pip-wrapper";

        const inactiveImg = document.createElement("img");
        inactiveImg.src = inactiveSrc;
        inactiveImg.className = "pip-img pip-inactive";

        const activeImg = document.createElement("img");
        activeImg.src = activeSrc;
        activeImg.className = "pip-img pip-active";
        
        if (enablePulse) {
            activeImg.classList.add("pulse");
        }
        activeImg.style.opacity = "0";

        pipWrapper.appendChild(inactiveImg);
        pipWrapper.appendChild(activeImg);
        pipContainer.appendChild(pipWrapper);
        pips.push({ wrapper: pipWrapper, inactiveImg, activeImg });
    }

    slider.appendChild(pipContainer);

    // GM Controls
    if (isGM) {
        const minus = createControlBtn("minus", () => modifyCount(1));
        const plus = createControlBtn("plus", () => modifyCount(-1));
        const eye = createVisibilityBtn();
        
        sliderWrapper.appendChild(minus);
        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(plus);
        sliderWrapper.appendChild(eye);
    } else {
        sliderWrapper.appendChild(slider);
    }

    container.appendChild(sliderWrapper);
    setupDrag(container, "largeTrackerPosition");
    document.body.appendChild(container);
    updatePips(leftSideCount);
}

// Modify the fear count by delta (+1 or -1)
function modifyCount(delta) {
    if (!game.user.isGM) return;
    let current = game.settings.get(MODULE_ID, "leftSideCount");
    const max = getMaxFearTokens();
    
    let next = current + delta;
    if (next < 0) next = 0;
    if (next > max) next = max;

    if (next !== current) {
        game.settings.set(MODULE_ID, "leftSideCount", next);
        updatePips(next);
        game.socket.emit(`module.${MODULE_ID}`, { type: "updatePips", leftSideCount: next });
    }
}

// Update the visual state of the pips (active/inactive and position)
function updateUI(leftSideCount, totalPips) {
    if (!slider) return;

    // Re-render if pip count mismatches (e.g., changed in Homebrew settings)
    if (pips.length !== totalPips) {
        reRender();
        return;
    }

    const activeCount = totalPips - leftSideCount;

    for (let i = 0; i < totalPips; i++) {
        if (!pips[i]) continue;
        const pip = pips[i];
        const isActive = i >= leftSideCount;
        let targetLeft;
        
        // Dynamic positioning uses slider.clientWidth, so it adapts to the new width
        if (isActive) {
            const activeIndex = i - leftSideCount;
            // 28px spacing, 15px margin
            const startX = slider.clientWidth - (activeCount * 28) - 15;
            targetLeft = startX + (activeIndex * 28);
        } else {
            targetLeft = i * 28 + 15;
        }

        pip.wrapper.style.left = `${targetLeft}px`;
        pip.inactiveImg.style.opacity = isActive ? "0" : "1";
        pip.activeImg.style.opacity = isActive ? "1" : "0";
    }
}

// Helper to create control buttons
function createControlBtn(type, onClick, sizeClass = "") {
    const img = document.createElement("img");
    img.src = getThemeAsset(type);
    img.className = `control-btn ${sizeClass}`;
    img.onclick = onClick;
    return img;
}

// Helper to create the visibility toggle button
function createVisibilityBtn(sizeClass = "") {
    const eye = document.createElement("i");
    const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    eye.className = `${isVisible ? "fas fa-eye" : "fas fa-eye-slash"} visibility-icon ${sizeClass}`;
    
    eye.onclick = () => {
        if (!game.user.isGM) return;
        const newState = !game.settings.get(MODULE_ID, VISIBILITY_SETTING);
        game.settings.set(MODULE_ID, VISIBILITY_SETTING, newState);
        toggleVisibilityUI();
        game.socket.emit(`module.${MODULE_ID}`, { type: "toggleVisibility" });
    };
    return eye;
}

// Apply visibility state to UI elements
function toggleVisibilityUI() {
    const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    const opacity = visible ? "1" : (game.user.isGM ? "0.5" : "0");
    const iconClass = visible ? "fas fa-eye" : "fas fa-eye-slash";

    const el = document.getElementById("fear-tracker-container");
    if (el) el.style.opacity = opacity;
    
    document.querySelectorAll(".visibility-icon").forEach(icon => {
        icon.className = `${iconClass} visibility-icon ${icon.classList.contains("small") ? "small" : ""}`;
    });
}

// Enable drag-and-drop functionality for the tracker
function setupDrag(tracker, settingKey) {
    let offset = { x: 0, y: 0 };
    
    function onMouseMove(event) {
        event.preventDefault();
        tracker.style.left = `${event.clientX - offset.x}px`;
        tracker.style.top = `${event.clientY - offset.y}px`;
    }

    function onMouseUp(event) {
        event.preventDefault();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        game.settings.set(MODULE_ID, settingKey, {
            top: tracker.style.top,
            left: tracker.style.left
        });
    }

    function onMouseDown(event) {
        if (event.target.tagName === "IMG" || event.target.tagName === "I") return;
        event.preventDefault();
        offset = {
            x: event.clientX - tracker.offsetLeft,
            y: event.clientY - tracker.offsetTop
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }

    tracker.addEventListener("mousedown", onMouseDown);
}
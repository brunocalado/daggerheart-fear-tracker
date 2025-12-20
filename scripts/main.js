/**
 * Module: Daggerheart: Fear Tracker
 * Compatible with: Foundry VTT v13
 */

const MODULE_ID = "daggerheart-fear-tracker";
const SYSTEM_ID = "daggerheart";
const SYSTEM_FEAR_SETTING = "ResourcesFear";
const SYSTEM_HOMEBREW_SETTING = "Homebrew";

const VISIBILITY_SETTING = "trackerVisible_v3"; 

/* -------------------------------------------- */
/* Hooks & Initialization                      */
/* -------------------------------------------- */

Hooks.once("init", () => {
    registerSettings();
});

Hooks.once("ready", async () => {
    // Safe Initialization
    try {
        applyPulseColor();
        
        // Ensure initial visibility for GM
        if (game.user.isGM) {
            const isVisible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
            if (!isVisible) {
                await game.settings.set(MODULE_ID, VISIBILITY_SETTING, true);
            }
        }

        // Initialize bar
        initializeTracker();

        // Automatically hide system bar if setting enabled
        // Delay slightly to ensure system settings are fully loaded
        setTimeout(() => {
            checkAndHideSystemBar();
        }, 1000);

        // --- EXPOSE API ---
        window.FearTracker = {
            /**
             * Resets the Fear Tracker position.
             * Default behavior: Centers horizontally at the top of the screen.
             * @param {number|null} x - Specific Left position. If null, centers horizontally.
             * @param {number|null} y - Specific Top position. If null, defaults to 100px.
             */
            Reset: async (x = null, y = null) => {
                try {
                    const el = document.getElementById("fear-tracker-container");
                    if (!el) return;

                    // Get current scale to calculate visual width
                    const sizeSetting = game.settings.get(MODULE_ID, "trackerSize");
                    const sizeMap = { small: 0.6, normal: 1.0, large: 1.4 };
                    const scale = sizeMap[sizeSetting] || 1.0;

                    // Calculate visual width
                    const visualWidth = el.offsetWidth * scale;

                    // Determine positions
                    let leftVal, topVal;

                    if (x !== null) {
                        leftVal = typeof x === "number" ? `${x}px` : x;
                    } else {
                        // Calculate Center: (Window Width / 2) - (Tracker Visual Width / 2)
                        const centeredX = (window.innerWidth / 2) - (visualWidth / 2);
                        leftVal = `${Math.max(0, centeredX)}px`;
                    }

                    if (y !== null) {
                        topVal = typeof y === "number" ? `${y}px` : y;
                    } else {
                        topVal = "100px"; // Default top padding
                    }

                    const newPos = { left: leftVal, top: topVal };

                    // 1. Save setting
                    await game.settings.set(MODULE_ID, "largeTrackerPosition", newPos);
                    
                    // 2. Direct DOM update
                    el.style.left = newPos.left;
                    el.style.top = newPos.top;
                    
                    ui.notifications.info(`Daggerheart Fear Tracker: Reset to Top Center.`);
                } catch (err) {
                    console.error("FearTracker API Error:", err);
                    ui.notifications.warn("Could not reset Fear Tracker position.");
                }
            }
        };
        
    } catch (err) {
        console.error("Daggerheart Fear Tracker | Initialization Error:", err);
    }

    // Settings Listeners
    Hooks.on("updateSetting", (setting, value, options, userId) => {
        // System Fear Resource Change
        if (setting.key === `${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`) {
            let fearValue = value;
            if (typeof value === 'object' && value !== null && 'value' in value) {
                fearValue = value.value;
            }
            const numericValue = Number(fearValue);
            if (!isNaN(numericValue)) {
                syncTrackerFromSystem(numericValue);
            }
        }

        // Homebrew (Max Fear) Change
        if (setting.key === `${SYSTEM_ID}.${SYSTEM_HOMEBREW_SETTING}`) {
            reRender();
        }
        
        // Visual Changes
        if (setting.key === `${MODULE_ID}.pulseColor`) applyPulseColor();
        if (setting.key === `${MODULE_ID}.enablePulse`) reRender();
        if (setting.key === `${MODULE_ID}.enableScaleAnimation`) reRender();
        
        // Re-render on Size change
        if (setting.key === `${MODULE_ID}.trackerSize`) reRender();

        // Check system bar visibility
        if (setting.key === `${MODULE_ID}.hideSystemBar`) checkAndHideSystemBar();
        
        // Re-render on Theme change
        if (setting.key === `${MODULE_ID}.theme`) reRender();
    });

    // Resize listener with Debounce
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const slider = document.getElementById("slider-bar");
            if (slider) reRender();
        }, 200);
    });
});

/* -------------------------------------------- */
/* Logic: Tracker Rendering & Updates          */
/* -------------------------------------------- */

// Hoisted declarations

async function updatePips(leftSideCount) {
    const totalPips = getMaxFearTokens();
    const activeCount = totalPips - leftSideCount;

    updateUI(leftSideCount, totalPips);

    if (game.user.isGM) {
        syncSystemFromTracker(activeCount);
    }
}

function updateUI(leftSideCount, totalPips) {
    const slider = document.getElementById("slider-bar");
    if (!slider) return;

    // Check DOM integrity
    const currentPipsDom = document.querySelectorAll(".pip-wrapper");
    if (currentPipsDom.length !== totalPips) {
        reRender();
        return;
    }

    const activeCount = totalPips - leftSideCount;

    for (let i = 0; i < totalPips; i++) {
        const wrapper = currentPipsDom[i];
        if (!wrapper) continue;
        
        const inactiveImg = wrapper.querySelector(".pip-inactive");
        const activeImg = wrapper.querySelector(".pip-active");

        const isActive = i >= leftSideCount;
        let targetLeft;
        
        if (isActive) {
            const activeIndex = i - leftSideCount;
            const startX = slider.clientWidth - (activeCount * 28) - 15;
            targetLeft = startX + (activeIndex * 28);
        } else {
            targetLeft = i * 28 + 15;
        }

        wrapper.style.left = `${targetLeft}px`;
        
        if (inactiveImg) inactiveImg.style.opacity = isActive ? "0" : "1";
        if (activeImg) activeImg.style.opacity = isActive ? "1" : "0";
    }
}

function reRender() {
    const el = document.getElementById("fear-tracker-container");
    if (el) el.remove();
    renderLargeTracker();
}

function renderLargeTracker() {
    // Check local hide setting
    const localHide = game.settings.get(MODULE_ID, "hideTrackerClient");
    if (localHide) return;

    const isGM = game.user.isGM;
    const pos = game.settings.get(MODULE_ID, "largeTrackerPosition");
    
    // SCALE SETTINGS
    const sizeSetting = game.settings.get(MODULE_ID, "trackerSize");
    const sizeMap = { small: 0.6, normal: 1.0, large: 1.4 };
    const scale = sizeMap[sizeSetting] || 1.0;

    // PIP ALIGNMENT SETTINGS (Dynamic Margin Top)
    const pipOffsets = {
        small: "-1px",
        normal: "-2px",
        large: "-1px"
    };
    const pipMarginTop = pipOffsets[sizeSetting] || "4px";

    const preferredWidth = game.settings.get(MODULE_ID, "trackerWidth");
    
    // Calculate responsive width
    const maxAllowedWidth = (window.innerWidth / scale) - 40;
    const finalWidth = Math.min(preferredWidth, maxAllowedWidth);

    const container = document.createElement("div");
    container.id = "fear-tracker-container";
    container.style.left = pos.left || "0";
    container.style.top = pos.top || "0";
    
    if (scale !== 1.0) container.style.transform = `scale(${scale})`;
    
    const visible = game.settings.get(MODULE_ID, VISIBILITY_SETTING);
    container.style.opacity = visible ? "1" : (isGM ? "0.5" : "0");

    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "fear-slider-wrapper";

    const slider = document.createElement("div");
    slider.id = "slider-bar";
    slider.style.width = `${finalWidth}px`;
    slider.style.backgroundImage = `url(${getThemeAsset('slider')})`;

    const totalPips = getMaxFearTokens();
    let leftSideCount = game.settings.get(MODULE_ID, "leftSideCount");
    
    // Safety check
    if (leftSideCount > totalPips) leftSideCount = totalPips;

    const pipContainer = document.createElement("div");
    pipContainer.className = "pip-container";

    const inactiveSrc = getThemeAsset('pipInactive');
    const activeSrc = getThemeAsset('pipActive');
    
    // Animation Settings
    const enablePulse = game.settings.get(MODULE_ID, "enablePulse");
    const enableScaleAnim = game.settings.get(MODULE_ID, "enableScaleAnimation");

    for (let i = 0; i < totalPips; i++) {
        const pipWrapper = document.createElement("div");
        pipWrapper.className = "pip-wrapper"; 
        
        // APPLY DYNAMIC MARGIN TOP
        pipWrapper.style.marginTop = pipMarginTop;

        const inactiveImg = document.createElement("img");
        inactiveImg.src = inactiveSrc;
        inactiveImg.className = "pip-img pip-inactive";

        const activeImg = document.createElement("img");
        activeImg.src = activeSrc;
        activeImg.className = "pip-img pip-active";
        
        // Apply animation classes
        if (enablePulse) activeImg.classList.add("pulse");
        if (enableScaleAnim) activeImg.classList.add("breathing");
        
        activeImg.style.opacity = "0";

        pipWrapper.appendChild(inactiveImg);
        pipWrapper.appendChild(activeImg);
        pipContainer.appendChild(pipWrapper);
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
    
    // Initial update
    updateUI(leftSideCount, totalPips);
}

function initializeTracker() {
    const isGM = game.user.isGM;

    // Initial Sync
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

    // Socket listeners
    game.socket.on(`module.${MODULE_ID}`, (payload) => {
        if (payload.type === "updatePips") {
            updatePips(payload.leftSideCount);
        }
        if (payload.type === "toggleVisibility") {
            toggleVisibilityUI();
        }
    });
}

/* -------------------------------------------- */
/* Logic: User Interaction                     */
/* -------------------------------------------- */

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

function createControlBtn(type, onClick, sizeClass = "") {
    const img = document.createElement("img");
    img.src = getThemeAsset(type);
    img.className = `control-btn ${sizeClass}`;
    img.onclick = onClick;
    return img;
}

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

/* -------------------------------------------- */
/* Helpers & Sync Logic                        */
/* -------------------------------------------- */

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

async function syncTrackerFromSystem(systemFearValue) {
    const maxTokens = getMaxFearTokens();
    let safeFear = Math.max(0, Math.min(systemFearValue, maxTokens));
    const newLeftSide = maxTokens - safeFear;
    const currentLeftSide = game.settings.get(MODULE_ID, "leftSideCount");

    if (newLeftSide !== currentLeftSide) {
        if (game.user.isGM) {
             await game.settings.set(MODULE_ID, "leftSideCount", newLeftSide);
             game.socket.emit(`module.${MODULE_ID}`, { type: "updatePips", leftSideCount: newLeftSide });
        }
        updatePips(newLeftSide);
    }
}

async function syncSystemFromTracker(activeFearValue) {
    if (game.settings.settings.has(`${SYSTEM_ID}.${SYSTEM_FEAR_SETTING}`)) {
        const currentSetting = game.settings.get(SYSTEM_ID, SYSTEM_FEAR_SETTING);
        let valueToSave = activeFearValue;
        let needsUpdate = false;

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

function getThemeAsset(type) {
    const theme = game.settings.get(MODULE_ID, "theme");
    const fileMap = {
        slider: "slider.png", pipActive: "pip-active.png", pipInactive: "pip-inactive.png", minus: "minus.png", plus: "plus.png"
    };
    const customSettingMap = {
        slider: "sliderImage", pipActive: "pipActiveImage", pipInactive: "pipInactiveImage", minus: "minusImage", plus: "plusImage"
    };

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

/**
 * Checks client settings (including native localStorage) for the system's "displayFear" property
 * and sets it to "hide" if the "Hide System Bar" module setting is enabled.
 */
async function checkAndHideSystemBar() {
    const shouldHide = game.settings.get(MODULE_ID, "hideSystemBar");
    if (!shouldHide) return;

    // Use native localStorage which is standard across all browsers
    const storageLength = localStorage.length;

    for (let i = 0; i < storageLength; i++) {
        const storageKey = localStorage.key(i);
        // Only proceed if it looks relevant (basic check)
        if (!storageKey) continue;

        const storageValue = localStorage.getItem(storageKey);
        
        // Optimize: Check as string first to avoid unnecessary parsing
        if (storageValue && storageValue.includes("displayFear")) {
            
            try {
                const parsed = JSON.parse(storageValue);
                
                // Confirm structure
                if (parsed && typeof parsed === 'object' && 'displayFear' in parsed) {
                    
                    if (parsed.displayFear !== 'hide') {
                        // Update the object in memory
                        parsed.displayFear = 'hide';
                        
                        // 1. Try Foundry API if it looks like a "namespace.key" setting
                        let updatedViaAPI = false;
                        if (storageKey.includes('.')) {
                            const parts = storageKey.split('.');
                            const namespace = parts[0];
                            const key = parts.slice(1).join('.');
                            
                            try {
                                await game.settings.set(namespace, key, parsed);
                                updatedViaAPI = true;
                            } catch (e) {
                                // Fail silently on API error, fallback will handle it
                            }
                        }

                        // 2. Fallback: Direct localStorage write if API failed or key format is non-standard
                        if (!updatedViaAPI) {
                            localStorage.setItem(storageKey, JSON.stringify(parsed));
                        }
                    }
                }
            } catch (err) {
                // Not JSON or parse error, skip silently
            }
        }
    }
}

function registerSettings() {
    // Theme Selection (Alphabetical)
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

    // Pulse Effect (Glow)
    game.settings.register(MODULE_ID, "enablePulse", {
        name: "Pulse Effect (Glow)", hint: "Enable glowing animation for active fear tokens.",
        scope: "world", config: true, type: Boolean, default: true, onChange: () => reRender()
    });

    // Text field for CSS color
    game.settings.register(MODULE_ID, "pulseColor", {
        name: "Pulse Glow Color", 
        hint: "Enter CSS color (e.g. #6a0dad, red, rgba(100,0,0,0.5)).",
        scope: "world", 
        config: true, 
        type: String, 
        default: "#6a0dad",
        onChange: () => applyPulseColor()
    });

    // Breathing Effect (Scale)
    game.settings.register(MODULE_ID, "enableScaleAnimation", {
        name: "Breathing Effect (Scale)", hint: "Enable the growing/shrinking animation for active fear tokens.",
        scope: "world", config: true, type: Boolean, default: true, onChange: () => reRender()
    });

    // Tracker Scale with Preset Size (Small/Normal/Large)
    game.settings.register(MODULE_ID, "trackerSize", {
        name: "Tracker Size", 
        hint: "Select the size of the Fear Tracker bar locally.",
        scope: "client", 
        config: true, 
        type: String, 
        choices: {
            "small": "Small",
            "normal": "Normal",
            "large": "Large"
        },
        default: "normal", 
        onChange: () => reRender()
    });

    game.settings.register(MODULE_ID, "trackerWidth", {
        name: "Tracker Bar Width", hint: "Adjust the width of the bar in pixels locally to fit your screen.",
        scope: "client", config: true, type: Number, range: { min: 400, max: 2000, step: 10 }, default: 700, onChange: () => reRender()
    });

    // Custom Images (World/GM)
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

    // Hide Fear Tracker (Local) moved to the very bottom of visible settings
    game.settings.register(MODULE_ID, "hideTrackerClient", {
        name: "Hide Fear Tracker (Local)",
        hint: "Hides the Fear Tracker module bar only for you. Does not affect the System bar or other players.",
        scope: "client", config: true, type: Boolean, default: false, onChange: () => reRender()
    });

    // Hide System Bar
    game.settings.register(MODULE_ID, "hideSystemBar", {
        name: "Hide System Bar",
        hint: "Automatically sets the Daggerheart system's Fear bar setting to 'hide'.",
        scope: "client", 
        config: true, 
        type: Boolean, 
        default: true,
        onChange: () => checkAndHideSystemBar()
    });

    // Internal State Settings (Hidden from menu)
    game.settings.register(MODULE_ID, "leftSideCount", {
        name: "Pip Count Left Side (Internal)", scope: "world", config: false, type: Number, default: 12,
        onChange: (value) => {
            if (!game.user.isGM) return;
            const max = getMaxFearTokens();
            game.settings.set(MODULE_ID, "activeFear", max - value);
        }
    });

    game.settings.register(MODULE_ID, "activeFear", { scope: "world", config: false, type: Number, default: 0 });
    game.settings.register(MODULE_ID, VISIBILITY_SETTING, { scope: "world", config: false, type: Boolean, default: true });
    game.settings.register(MODULE_ID, "largeTrackerPosition", { scope: "client", config: false, type: Object, default: { top: "100px", left: "100px" } });
}
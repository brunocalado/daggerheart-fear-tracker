/*!
 * Daggerheart: Fear Tracker
 * Copyright (c) 2026 https://github.com/brunocalado
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3.
 */

import { MODULE_ID, BUILTIN_THEME_CHOICES } from "./constants.js";

// Registry of themes added by other modules via registerTheme(). Not exported directly;
// consumed through getCustomTheme() / getCustomThemeChoices() below.
const customThemes = new Map();

/**
 * Public API (exposed as game.modules.get(MODULE_ID).api.registerTheme) allowing other
 * modules to add an entry to the "Theme" settings dropdown.
 *
 * Safe to call from either the registering module's "init" or "ready" hook: if this
 * module's "theme" setting is already registered, the new choice is added to it in place;
 * otherwise it is picked up when registerSettings() runs.
 *
 * @param {string} id - Unique theme id (must not collide with a built-in or already-registered id).
 * @param {string} label - Label shown in the Theme dropdown.
 * @param {object} assets - Either { path } (a folder containing slider.png, pip-active.png and
 *   pip-inactive.png) or explicit { slider, pipActive, pipInactive } file paths. Explicit paths
 *   take precedence over ones derived from "path".
 */
export function registerTheme(id, label, assets) {
    if (typeof id !== "string" || !id.trim()) {
        throw new Error(`${MODULE_ID} | registerTheme: "id" must be a non-empty string.`);
    }
    if (id in BUILTIN_THEME_CHOICES) {
        throw new Error(`${MODULE_ID} | registerTheme: "${id}" is a reserved built-in theme id.`);
    }
    if (typeof label !== "string" || !label.trim()) {
        throw new Error(`${MODULE_ID} | registerTheme: "label" must be a non-empty string.`);
    }

    const resolved = resolveAssets(assets);
    for (const key of ["slider", "pipActive", "pipInactive"]) {
        if (!resolved[key]) {
            throw new Error(`${MODULE_ID} | registerTheme: missing "${key}" image path for theme "${id}".`);
        }
    }

    if (customThemes.has(id)) {
        console.warn(`${MODULE_ID} | registerTheme: overwriting already-registered theme "${id}".`);
    }
    customThemes.set(id, { label, assets: resolved });

    // The "theme" setting may already be registered by the time this runs (e.g. called from
    // another module's "ready" hook). Patch its live choices so the new option shows up
    // without requiring registerSettings() to run again.
    const setting = game.settings.settings.get(`${MODULE_ID}.theme`);
    if (setting) setting.choices[id] = label;
}

function resolveAssets(assets = {}) {
    const { path, slider, pipActive, pipInactive } = assets;
    return {
        slider: slider ?? (path ? `${path}/slider.png` : undefined),
        pipActive: pipActive ?? (path ? `${path}/pip-active.png` : undefined),
        pipInactive: pipInactive ?? (path ? `${path}/pip-inactive.png` : undefined)
    };
}

/**
 * @param {string} id
 * @returns {{label: string, assets: {slider: string, pipActive: string, pipInactive: string}}|undefined}
 */
export function getCustomTheme(id) {
    return customThemes.get(id);
}

/**
 * @returns {Record<string, string>} id -> label, for merging into the "theme" setting's choices.
 */
export function getCustomThemeChoices() {
    const choices = {};
    for (const [id, { label }] of customThemes) choices[id] = label;
    return choices;
}

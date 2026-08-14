/*!
 * Daggerheart: Fear Tracker
 * Copyright (c) 2026 https://github.com/brunocalado
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3.
 */

import { MODULE_ID } from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Settings submenu grouping the visual effect toggles for active fear tokens
 * (pulse glow, glow color, breathing scale) behind a single settings button.
 */
export class EffectsSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-effects-settings`,
        classes: [MODULE_ID, "dhft-effects-settings"],
        tag: "form",
        window: {
            title: "Fear Tracker: Visual Effects",
            icon: "fa-solid fa-sparkles",
            contentClasses: ["standard-form"]
        },
        position: { width: 420 },
        form: {
            handler: EffectsSettingsApp.#onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/effects-settings.hbs` },
        footer: { template: "templates/generic/form-footer.hbs" }
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.enablePulse = game.settings.get(MODULE_ID, "enablePulse");
        context.pulseColor = game.settings.get(MODULE_ID, "pulseColor");
        context.enableScaleAnimation = game.settings.get(MODULE_ID, "enableScaleAnimation");
        context.pipTintColor = game.settings.get(MODULE_ID, "pipTintColor");
        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "Save Changes" }];
        return context;
    }

    /**
     * Persists the submitted values to their underlying world settings.
     * Each setting's own onChange (reRender / applyPulseColor) handles side effects.
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static async #onSubmit(event, form, formData) {
        const data = formData.object;
        await game.settings.set(MODULE_ID, "enablePulse", data.enablePulse);
        await game.settings.set(MODULE_ID, "pulseColor", data.pulseColor);
        await game.settings.set(MODULE_ID, "enableScaleAnimation", data.enableScaleAnimation);
        await game.settings.set(MODULE_ID, "pipTintColor", data.pipTintColor);
    }
}

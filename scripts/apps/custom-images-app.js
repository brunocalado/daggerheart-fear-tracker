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
 * Settings submenu for overriding the selected theme's images with custom ones.
 * Guarded behind the "Use Custom Images" toggle: when off, the theme's own
 * images are used regardless of what is configured here.
 */
export class CustomImagesSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-custom-images`,
        classes: [MODULE_ID, "dhft-custom-images"],
        tag: "form",
        window: {
            title: "Fear Tracker: Custom Images",
            icon: "fa-solid fa-images",
            contentClasses: ["standard-form"]
        },
        position: { width: 480 },
        form: {
            handler: CustomImagesSettingsApp.#onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/custom-images.hbs` },
        footer: { template: "templates/generic/form-footer.hbs" }
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.useCustomImages = game.settings.get(MODULE_ID, "useCustomImages");
        context.sliderImage = game.settings.get(MODULE_ID, "sliderImage");
        context.pipActiveImage = game.settings.get(MODULE_ID, "pipActiveImage");
        context.pipInactiveImage = game.settings.get(MODULE_ID, "pipInactiveImage");
        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "Save Changes" }];
        return context;
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this.element.querySelectorAll(".dhft-image-picker file-picker").forEach(picker => {
            picker.addEventListener("change", () => this.#updatePreview(picker));
        });
    }

    /**
     * Rebuilds a field's thumbnail/tooltip preview to match its file-picker's current value.
     * @param {HTMLElement} picker - the <file-picker> element that changed.
     */
    #updatePreview(picker) {
        const preview = picker.closest(".dhft-image-picker")?.querySelector(".dhft-image-preview");
        if (!preview) return;

        const path = picker.value?.trim();
        preview.replaceChildren();

        if (path) {
            const thumb = document.createElement("img");
            thumb.src = path;
            thumb.alt = "";

            const zoom = document.createElement("div");
            zoom.className = "dhft-image-preview-zoom";
            const zoomImg = document.createElement("img");
            zoomImg.src = path;
            zoomImg.alt = "";
            zoom.appendChild(zoomImg);

            preview.append(thumb, zoom);
        } else {
            const icon = document.createElement("i");
            icon.className = "fa-solid fa-image";
            preview.appendChild(icon);
        }
    }

    /**
     * Persists the submitted values to their underlying world settings.
     * Each setting's own onChange (reRender) handles side effects.
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static async #onSubmit(event, form, formData) {
        const data = formData.object;
        await game.settings.set(MODULE_ID, "useCustomImages", data.useCustomImages);
        await game.settings.set(MODULE_ID, "sliderImage", data.sliderImage);
        await game.settings.set(MODULE_ID, "pipActiveImage", data.pipActiveImage);
        await game.settings.set(MODULE_ID, "pipInactiveImage", data.pipInactiveImage);
    }
}

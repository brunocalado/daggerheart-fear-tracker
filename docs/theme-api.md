# Theme API

Other modules can add their own entry to the Fear Tracker's **Theme** setting dropdown by
calling `registerTheme()`. Once registered, players simply pick the new theme from the
existing "Theme" setting — no separate configuration screen is needed.

## Requirements

* Declare a dependency on `daggerheart-fear-tracker` in your module's `module.json`
  (`relationships.requires`), so Foundry loads it before your module.
* Call the API from your own module's `"init"` or `"ready"` hook. Either works.
* Provide three images: a slider bar background and two pip images (inactive / active),
  matching the same roles used by the built-in **Stone** and **Stone Red** themes.

## API

```js
game.modules.get("daggerheart-fear-tracker").api.registerTheme(id, label, assets);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique id for the theme. Must not collide with a built-in id (`stone`, `stone-red`) or an id already registered by another module. |
| `label` | `string` | Label shown in the "Theme" dropdown. |
| `assets` | `object` | Either `{ path }` or explicit `{ slider, pipActive, pipInactive }`. See below. |

### `assets` — folder convention (recommended)

Point `path` at a folder in your module containing three files named exactly
`slider.png`, `pip-active.png`, and `pip-inactive.png`:

```js
game.modules.get("daggerheart-fear-tracker").api.registerTheme(
    "my-module-neon",
    "Neon",
    { path: "modules/my-module/images/neon-theme" }
);
```

This resolves to:

* `modules/my-module/images/neon-theme/slider.png`
* `modules/my-module/images/neon-theme/pip-active.png`
* `modules/my-module/images/neon-theme/pip-inactive.png`

### `assets` — explicit paths

If your files don't follow that naming convention, pass the three paths directly:

```js
game.modules.get("daggerheart-fear-tracker").api.registerTheme(
    "my-module-neon",
    "Neon",
    {
        slider: "modules/my-module/images/neon-slider.webp",
        pipActive: "modules/my-module/images/neon-on.webp",
        pipInactive: "modules/my-module/images/neon-off.webp"
    }
);
```

Explicit paths always take precedence over ones derived from `path`, so you can mix both
(e.g. `path` plus a single override) if only one file breaks the naming convention.

## Full example

`module.json` (excerpt):

```json
{
  "id": "my-module",
  "relationships": {
    "requires": [
      { "id": "daggerheart-fear-tracker", "type": "module", "compatibility": { "minimum": "1.2.4" } }
    ]
  }
}
```

`scripts/main.js` (excerpt):

```js
Hooks.once("init", () => {
    const fearTracker = game.modules.get("daggerheart-fear-tracker");
    if (!fearTracker?.active) return;

    fearTracker.api.registerTheme("my-module-neon", "Neon", {
        path: "modules/my-module/images/neon-theme"
    });
});
```

Once your module is enabled, "Neon" appears as an option in the Fear Tracker's **Theme**
setting immediately — no reload beyond the normal "enable module" world reload is required.

## Notes

* `registerTheme()` throws if `id` or `label` is missing/empty, if `id` collides with a
  built-in theme, or if any of the three asset paths can't be resolved.
* Calling it twice with the same `id` overwrites the previous registration (a warning is
  logged to the console); it does not throw.
* Registering a theme does not select it. Users still choose it manually from the "Theme"
  dropdown in **Configure Settings → Module Settings**.

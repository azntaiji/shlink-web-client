# QR code styling plan

Each phase adds one feature in the existing QR modal, using `qr-code-styling` for rendering and export.

1. **Dots Options:** replace the foreground picker with a collapsible section for six module styles, a single color, or a linear/radial gradient with two colors and rotation in degrees. Leave corner overrides unset so both eyes inherit these options. Preserve the configured foreground color, defaulting to black.
2. **Corners Square Options:** add independent outer-eye style and color overrides, initially inherited from dots, plus Clear to restore inheritance.
3. **Corners Dot Options:** add independent inner-eye style and color overrides, initially inherited from dots, plus Clear.
4. **Background Options:** replace the background picker with single-color and gradient controls. Default gradient stops are `#a7b6c5` and `#ffffff`.
5. **Frame:** add square/circle frames, inherited or custom color, and optional top/bottom text limited to 20 characters. Use a library extension for rendering so previews and downloaded images include the frame and text. Derive border thickness from the QR module grid; curve text around circular frames.

For every phase, run style, type, browser tests, and production build checks, correcting failures before stopping for a live browser test. Wait for the user's “proceed”, then run the yeet skill to commit that phase. Stop again and ask whether to start the next phase.

## Phase 1 integration

The QR modal and renderer are internal to `@shlinkio/shlink-web-component` 0.19.2. There is no public API for adding modal controls or passing additional QR options. `config/qrCodeStyling.ts` adapts the locked distribution during Vite development, tests, and production builds. It replaces the foreground control with local React controls, passes dots options to the existing renderer, and resets styling on modal close. It reuses the dependency's original color picker and hex field. Installed dependency files are never modified.

The adapter checks every replacement occurs exactly once and fails the build if an upstream update changes the expected code. Dependency prebundling excludes this package so the adapter also runs in development. Keep the lockfile and adapter in sync when updating the dependency. Prefer a public upstream customization API when one becomes available, then remove the adapter and optimizer exclusion.

The renderer still owns all preview, data URI, and image downloads. Gradient rotations convert degrees to radians at the library boundary. Switching to single color explicitly clears the previous gradient. Corner options are left unset, allowing the library to render both eyes using the dots styling.

## Phase 1 live browser checks

- Open a short URL's QR modal. Dots Options should be expanded by default; verify Square and Single color are selected and the configured foreground color is retained (black by default).
- Select each of the six styles and confirm the data modules and both eyes change. Collapse and reopen the section; the selections should persist.
- Change Dots Color using the picker or its hex field. Select Color gradient and check the default blue/black stops, Linear type, and rotation of 0 degrees.
- Change both gradient colors, try 90 and negative rotations, then select Radial. Rotation should be hidden for Radial. Switching back to Linear retains its previous rotation.
- Switch to Single color; the gradient should disappear. Check size, margin, background, error correction, and logo still work.
- Download SVG and raster images and copy the data URI; confirm they match the preview. Test on a narrow viewport and with keyboard navigation.
- Close and reopen the modal; options should reset to defaults and the configured foreground color. Scan a high-contrast exported QR code.

The user completed the Phase 1 and Phase 2 live browser gates and approved committing both. Phases 3–5 remain pending.

## Phase 1 automated validation

Validated with Node.js 26.12.0 after `npm ci`:

- Style and formatting checks, TypeScript checks, and production/PWA build passed.
- All 250 browser tests across 44 files passed, including 13 QR styling tests covering the real modal, reset behavior, accessibility, keyboard entry, and SVG rendering.
- Coverage thresholds passed: 97.17% statements, 91.96% branches, 94.28% functions, and 97.85% lines.
- Browser screenshot: `reports/qr-code-dots-options.png` (generated artifact, ignored by Git).

The user confirmed “proceed” after live browser testing, including the change to expand Dots Options by default.

## Phase 2 integration

Corners Square Options starts collapsed, with None selected and all styling inherited from Dots Options. None removes the style override; it does not remove the outer eye. Selecting a style overrides only its shape. Editing any color control creates a separate color configuration using the current inherited values as its starting point. Subsequent dots changes continue to affect properties that have no override. Clear removes both shape and color overrides and immediately restores inheritance.

The dots and outer-eye sections share the same color and gradient controls. Numeric rotation remains editable while inherited values update on dots changes or Clear. Closing the modal resets both sections.

The library normally propagates an outer-eye color override to the inner eye. When an outer-eye color is set, the adapter supplies an independent inner-eye color layer, and a library extension gives that layer the dots' original fill. This preserves the exact global gradient alignment rather than restarting the gradient inside each inner eye. The extension runs before rasterization, so SVG and raster exports follow the same behavior.

## Phase 2 live browser checks

- Refresh the local app and open a short URL's QR modal. Dots Options should remain expanded by default. Expand Corners Square Options; verify None is selected and Clear is disabled.
- Change dots style, color, gradient type, stops, and rotation. Before any color override, the outer eye should follow those changes.
- Try Square, Dot, and Extra Rounded for Corners Square Style. Only the outer eyes should change shape. Select None to resume inheriting the dots style.
- Change Corners Square Color. Only the outer eyes should change color; the data modules and inner eyes should retain the dots color.
- Select Color gradient in Corners Square Options, edit both stops, switch between Linear and Radial, and enter positive, negative, and fractional rotations. The inner eyes should keep their dots gradient, including its position within the overall QR code.
- With an outer-eye override active, change Dots Options again. The overridden properties should stay fixed while inherited properties still follow dots.
- Press Clear. Both the outer-eye shape and color should immediately inherit the latest Dots Options, with no leftover gradient. Clear should become disabled.
- Download SVG and raster images and compare them with the preview. Close and reopen the modal; outer-eye overrides should reset. Scan a high-contrast export.

## Phase 2 automated validation

- Style and formatting checks, TypeScript checks, and production/PWA build passed with Node.js 26.12.0.
- All 262 browser tests across 46 files passed, including 25 QR tests for inheritance, overrides, Clear, modal reset, keyboard entry, accessibility, and rendering.
- Exported PNG comparisons verified unchanged inner-eye pixels for single-color, linear-gradient, and radial-gradient dots after an outer-eye override and after Clear.
- Coverage thresholds passed: 97.21% statements, 92.08% branches, 94.71% functions, and 97.83% lines.
- Browser screenshot: `reports/qr-code-corners-square-options.png` (generated artifact, ignored by Git).

The user confirmed “proceed” after the Phase 2 live browser test and approved committing it.

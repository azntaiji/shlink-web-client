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

The user completed the live browser gates for phases 1–3 and approved committing each phase. Phases 4–5 remain pending.

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

## Phase 3 integration

Corners Dot Options starts collapsed and inherits its shape and color from Dots Options, independently of Corners Square Options. Its dropdown shows the current inherited dots style until a shape override is selected, using the same six styles as Dots Options. Editing a color control creates an independent inner-eye color configuration from the currently inherited values. Clear restores the latest dots settings for both shape and color while preserving outer-eye overrides. Closing the modal resets all styling sections.

The rendering extension now distinguishes inherited inner-eye paint from explicitly selected inner-eye colors and gradients. Inherited paint still uses the exact dots gradient alignment, while custom inner-eye gradients render within each inner eye using the library's native behavior.

Export validation exposed a library cache issue: SVG-mode updates retain a previously generated raster canvas. The adapter now creates a fresh library renderer for every options update, preserving the requested preview drawing type while ensuring subsequent PNG and other raster exports reflect current styling. The renderer replaces the preview in the same container and retains the existing download and copy actions.

## Phase 3 live browser checks

- Refresh the local app and open a short URL's QR modal. Expand Corners Dot Options; verify the style and color match Dots Options and Clear is disabled.
- Change dots style, color, gradient stops, type, and rotation. The inner eyes should follow these settings until overridden.
- Set an outer-eye style and color override. The inner eyes should continue to inherit Dots Options, independently of the outer eyes.
- Try Square, Dots, Rounded, Extra Rounded, Classy, and Classy Rounded in Corners Dot Style. Only the three inner eyes should change shape; the data modules and outer eyes should remain unchanged.
- Change Corners Dot Color. Switch to Color gradient, edit both stops, try Linear and Radial, and enter positive, negative, and fractional rotations. Only the inner eyes should change color.
- Change Dots Options and Corners Square Options while inner-eye overrides are active. The inner-eye overrides should stay fixed. Clear either corner section and verify the other section's overrides remain intact.
- Press Clear in Corners Dot Options. It should resume the current dots style and color, including the original global gradient alignment, even when outer-eye overrides remain active.
- Download PNG, edit the inner-eye styling, then download PNG again. The second image must reflect the new settings. Also compare SVG and copied data URI exports with the preview.
- Close and reopen the modal. Both corner sections should reset to inheritance. Scan a high-contrast export.

## Phase 3 automated validation

- Style and formatting checks, TypeScript checks, and production/PWA build passed with Node.js 26.12.0.
- All 275 browser tests across 48 files passed, including 38 QR tests covering inner-eye controls, inheritance, independent corner overrides, Clear, modal reset, accessibility, and exports.
- Pixel comparisons verified that every inner-eye style changes only the three inner-eye regions, preserving data modules and outer eyes. Clearing inner-eye overrides restores the inherited image while keeping outer-eye overrides.
- A real-modal regression test exports PNG before and after changing inner-eye styling and verifies that the second export contains updated image data.
- Coverage thresholds passed: 97.33% statements, 92.83% branches, 94.95% functions, and 97.93% lines.
- Browser screenshot: `reports/qr-code-corners-dot-options.png` (generated artifact, ignored by Git).

The user confirmed “proceed” after the Phase 3 live browser test and approved committing it.

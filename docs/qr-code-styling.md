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

The user completed the Phase 1 live browser gate and approved committing it. Phases 2–5 remain pending.

## Phase 1 automated validation

Validated with Node.js 26.12.0 after `npm ci`:

- Style and formatting checks, TypeScript checks, and production/PWA build passed.
- All 250 browser tests across 44 files passed, including 13 QR styling tests covering the real modal, reset behavior, accessibility, keyboard entry, and SVG rendering.
- Coverage thresholds passed: 97.17% statements, 91.96% branches, 94.28% functions, and 97.85% lines.
- Browser screenshot: `reports/qr-code-dots-options.png` (generated artifact, ignored by Git).

The user confirmed “proceed” after live browser testing, including the change to expand Dots Options by default.

# QR code styling plan

Each phase adds one feature in the existing QR modal, using `qr-code-styling` for rendering and export.

1. **Dots Options:** replace the foreground picker with a collapsible section for six module styles, a single color, or a linear/radial gradient with two colors and rotation in degrees. Leave corner overrides unset so both eyes inherit these options. Preserve the configured foreground color, defaulting to black.
2. **Corners Square Options:** add independent outer-eye style and color overrides, initially inherited from dots, plus Clear to restore inheritance.
3. **Corners Dot Options:** add independent inner-eye style and color overrides, initially inherited from dots, plus Clear.
4. **Background Options:** replace the background picker with single-color and gradient controls. Default gradient stops are `#a7b6c5` and `#ffffff`.
5. **Frame:** add optional square/circle frames, inherited or custom color, and optional top/bottom text limited to 20 characters. Use a library extension for rendering so previews and downloaded images include the frame and text. Derive border thickness from the QR module grid; curve text around circular frames. For circular frames, data module should extend to circular whitespace like the FlowCode platform does for its QR codes.

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

The user completed the live browser gates for all five phases and approved committing each phase. The phased QR styling plan is complete.

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

## Phase 4 integration

Background Options replaces the standalone background picker with a collapsed accordion using the same color and gradient controls as the foreground sections. Single color is selected by default and retains the configured background color, which defaults to `#ffffff`. The default gradient is Linear, with stops `#a7b6c5` and `#ffffff` and rotation of 0 degrees. The single-color picker is labelled Background Color; the gradient controls retain the Dots Gradient label.

Background colors, gradients, and rotations are independent of all foreground sections. Switching to single color clears the gradient and restores the chosen solid background; switching back retains the previous gradient values. Radial gradients hide Rotation, while returning to Linear restores the previous degree value. Closing the modal resets background styling and restores the configured solid background.

Reset restores the application's default white background (`#ffffff`), selects Single color, and resets the gradient stops, type, and rotation to their defaults. Foreground styling remains unchanged.

The adapter sends the background options to the same library renderer used for preview, downloads, and copied data URIs. The existing fresh-renderer behavior also applies to background edits, keeping repeated raster exports current.

## Phase 4 live browser checks

- Refresh the local app and open a QR modal. Verify the old standalone background picker is replaced by Background Options. Expand it; Single color should be selected and the color should be white unless configured otherwise.
- Change the single-color picker. Only the background should change; dots and both corner overrides should retain their settings.
- Select Color gradient. Verify Linear, `#a7b6c5` and `#ffffff`, and Rotation of 0 degrees. Change both stops and try positive, negative, and fractional rotations.
- Switch to Radial and confirm Rotation disappears. Return to Linear and confirm the previous rotation is retained.
- Collapse and reopen the section, then switch between Single color and Color gradient. Each mode should retain its selected colors; single color should remove the gradient completely.
- Press Reset after changing a solid color or gradient. The background should return to white and Single color, with default gradient values restored when reopening Color gradient. Dots and corner overrides should remain unchanged.
- Change dots and corner styles/colors and clear corner overrides. Background Options should retain its own settings.
- Download PNG, change the background, and download PNG again. Compare the latest PNG, SVG, and copied data URI with the preview.
- Close and reopen the modal. Single color and the configured solid background should be restored. Reopen Color gradient and verify its default stops, Linear type, and 0-degree rotation. Scan a high-contrast export.

## Phase 4 automated validation

- Style and formatting checks, TypeScript checks, and production/PWA build passed with Node.js 26.12.0.
- All 281 browser tests across 50 files passed, including 44 QR tests for controls, independent styling, modal reset, accessibility, and exports.
- PNG pixel comparisons verified that linear and radial background gradients change the background while preserving foreground pixels for dots and both corner overrides.
- The real-modal test verifies default stops, edited colors, rotation, gradient type, switching back to a solid background, reset on close, and updated PNG data after background edits.
- Coverage thresholds passed: 97.37% statements, 92.83% branches, 95.06% functions, and 97.95% lines.
- Browser screenshot: `reports/qr-code-background-options.png` (generated artifact, ignored by Git).
- Follow-up Background Color label and Reset button changes passed all 6 affected browser tests, style/formatting checks, and TypeScript checks. Tests verify Reset from both solid and gradient modes, restored default gradient values, and unchanged foreground overrides.

The user confirmed “proceed” after the Phase 4 live browser test, including the Background Color label and Reset button, and approved committing it.

## Phase 5 integration

Frame starts collapsed and disabled, making frames optional as specified in the updated plan. Enable frame reveals Square/Circle shape choices, inherited or custom color, and Top Text/Bottom Text inputs limited to 20 characters each. Square is the initial shape. Inherit dots color is selected initially and follows the dots' current solid color or gradient; changing Frame Color creates a solid-color override. Re-enabling inheritance restores the live dots color. Toggling the frame off preserves the control values for re-enabling it, while closing the modal resets the frame to its disabled defaults.

Circular frames use the library's native circle shape, which fills the circular perimeter with extra modules around the encoded square QR matrix. This implements the requested circular data fill. Disabling the frame restores the ordinary square QR layout.

A library extension draws the frame and optional labels before rasterization. It derives border thickness from the same module grid used by the QR renderer, including circular layout and fractional module sizing. The border remains one module thick, matching the outer-eye border. The layout reserves at least four module widths between the outside of the QR data area and the frame. Square labels are centered above and below the frame; circle labels follow SVG text paths, with the bottom label reading upright. Text is inserted as plain text, and label paths have unique IDs.

The extension fits the code, quiet space, frame, and labels inside the requested image dimensions. The background continues to fill the entire image. SVG downloads, raster downloads, and copied data URIs share this renderer, including inherited colors and curved text.

## Phase 5 live browser checks

- Refresh the local app and open a QR modal. The preview should initially have no frame. Expand Frame and select Enable frame; Square and Inherit dots color should be selected.
- Compare the border thickness with the outer-eye border. Change the QR size and margin and verify the frame remains complete and centered.
- Change dots color and gradient settings. The frame and its text should inherit them. Change Frame Color to create a solid override, then select Inherit dots color to restore inheritance.
- Enter Top Text and Bottom Text, trying both labels independently and together. Verify each field stops at 20 characters and labels remain outside the frame without clipping.
- Select Circle. Extra modules should fill the circular perimeter, with the border outside them. Top and bottom text should follow the circle and remain readable.
- Change dots and corner styles, background colors/gradients, and logo. Verify those controls still work with either frame shape.
- Download SVG and raster images and copy the data URI. Confirm the frame and text match the preview. Export, edit frame options, and export again to verify the image updates.
- Disable the frame. Its border, text, and circular fill should disappear. Re-enable it to restore the selections. Close and reopen the modal; the frame should be disabled with default Square, inherited color, and empty text fields.
- Scan both square and circular high-contrast exports with a phone, including examples with labels.

## Phase 5 automated validation

- Style and formatting checks, TypeScript checks, and production/PWA build passed with Node.js 26.12.0.
- All 294 browser tests across 52 files passed, including 57 QR tests for frame controls, text limits, inherited/custom color, circular fill, reset behavior, exports, and accessibility.
- Rendering tests verified module-derived stroke width, curved label paths, fixed export dimensions, inherited linear/radial gradients, safe text insertion, fractional module sizing, and restoration of a plain QR code when disabled.
- The real-modal test verifies frame preview updates, distinct square/circle PNG exports, copied PNG data URIs, custom color, removal of circular fill, and reset on modal close.
- macOS Vision independently decoded both square and circular framed preview images with labels to the expected `https://example.com/qr` payload.
- Coverage thresholds passed: 97.50% statements, 92.78% branches, 95.38% functions, and 98.02% lines.
- Browser screenshots: `reports/qr-code-frame-options.png`, `reports/qr-code-frame-square.png`, and `reports/qr-code-frame-circle.png` (generated artifacts, ignored by Git).

The user confirmed “proceed and yeet” after the Phase 5 live browser test and approved committing it. Follow-up fixes will be handled separately from the completed five-phase plan.

## Larger center logos

Center logos now use `imageOptions.imageSize: 0.5`, the highest coefficient recommended by qr-code-styling 1.9.2. The renderer applies this policy whenever an image is present, alongside High (`H`) error correction, hidden background dots, and the existing 5 px logo padding. The previous High-correction coefficient was `0.3`.

This coefficient is not a width percentage: the library multiplies it by the correction-level fraction to calculate a hidden-module budget, then rounds the reserved rectangle to the module grid and fits the source aspect ratio. At H, `0.5` produces a nominal 15% area budget (roughly 39% of the width for a square before module rounding and padding). These figures describe sizing, not guaranteed damage tolerance or universal scan reliability.

The modal shows a disabled High correction control and explains why while a logo is present. The underlying correction selection is preserved, so clearing the logo restores it. Replacing a logo uses the existing Clear logo / Select logo flow. Closing the modal resets the logo and correction selection as before. No persistent settings or new sizing controls are added.

Circular QR designs fit the data grid inside the circular perimeter. The frame then scales the grid, logo, border, and text to fit the requested export dimensions. Logos therefore remain smaller in pixels in circular designs while keeping the same reserved-module proportion. We do not enlarge logos independently over additional data modules or change export dimensions to compensate.

### Calibration and regression checks

- The `0.50` candidate passed the complete primary scan matrix, so lower coefficients were not needed for the selected default: 3 logo fixtures (opaque square, transparent square, wide), 2 URL payload lengths, 3 frame modes (none, square, circle), and 2 output sizes (300 and 600 px), totaling 36 PNG decodes with jsQR. Frames include both labels; colors are black on white with a 20 px QR margin.
- All 6 dots styles also decode in each frame mode with continuous square finder patterns, totaling 18 additional PNG decodes. jsQR cannot locate some inherited dotted circular finder patterns even without a logo; macOS Vision independently decoded the 600 px inherited-dots circular logo preview, plus the square and circular square-module previews, to `https://example.com/qr`.
- Regression checks cover the visible size increase, preserved centering and grid proportions, SVG embedding, unchanged export dimensions, forced H correction, caller-option preservation, upload/clear/replacement, restored correction selection, copied PNG matching the current export, and modal reset.
- jsQR is a development-only dependency and is not used for runtime sizing or included in the production application.
- Validation passed: 342 tests across 53 files; coverage 97.55% statements, 92.94% branches, 95.40% functions, and 98.07% lines. Style, TypeScript/production build, adapter lint/format, and diff checks pass. Existing non-blocking build/coverage warnings remain.

### Live browser check before committing

- Add a logo: confirm it is visibly larger and correction displays disabled High with the explanation. Clear it: confirm the previous correction selection returns. Repeat with a different logo, then close/reopen the modal to check reset.
- Compare plain, square, and circular designs, including labels. Circular logos should keep their proportion to the smaller data grid; output dimensions should stay the same.
- Compare preview, downloaded SVG/PNG, and copied data URI. Scan exported examples at their intended display/print size on iOS and Android.
- Device-testing previews are generated at `reports/qr-code-logo-square.png`, `reports/qr-code-logo-circle.png`, and `reports/qr-code-logo-circle-dotted.png` (ignored artifacts).

This is a tested larger default, not a guarantee for arbitrary images, low-contrast colors, very small exports, every payload, or every camera. Physical-device testing remains pending user review.

## Tighter frame spacing

The default gap between the circular QR perimeter and the inner edge of its frame is reduced from four module widths to three (25% tighter). Square frames retain four module widths: trial gaps of two, three, 3.5, and 3.75 failed PNG decode cases at 600 px. A larger explicitly selected QR margin still sets the minimum gap. Frame thickness, label spacing, and requested export dimensions are preserved; the tighter circular layout leaves more room for the QR and logo.

Validation after the spacing adjustment: all 57 targeted frame, logo, and modal tests pass, including the 54 PNG decode cases; style and TypeScript/production build checks pass. Updated square, circular, and inherited-dots circular logo previews also decode independently with macOS Vision.

## Modal correction default

The QR modal now starts at High (`H`) error correction and resets to H when reopened. Other configured QR defaults are preserved. Correction remains editable without a logo; adding a logo locks H, and clearing it restores the selection made during that modal session.

## Wider QR modal layout

The QR modal is capped at 1280 px, with viewport padding preserved. At desktop widths (1024 px and above), the preview occupies about one third of the content and settings occupy two thirds. Settings use two columns for the accordions, while correction and export controls span both columns. The preview aligns to the top and remains sticky while scrolling. SVG/canvas previews scale to the available display width without changing export dimensions.

Below the desktop breakpoint, settings and preview remain stacked, with one settings column. Browser regression checks verify the 1280 px cap, settings/preview proportions, side-by-side desktop accordions, and mobile layout without horizontal overflow. Desktop/mobile screenshots are generated at `reports/qr-code-modal-wide.png` and `reports/qr-code-modal-mobile.png`. Production build (including TypeScript), style checks, and adapter lint/format checks pass.

### Section order and initial frame

The modal sections now follow this DOM/keyboard order (row by row on desktop): Dots Options, Frame, Corners Square Options, Corners Dot Options, Background Options. Select logo / Clear logo sits immediately after error correction and before the accordions. The modal starts with Enable frame checked and Circle selected, and restores those defaults after closing/reopening; users can still disable the frame or select Square. The low-level renderer remains unframed when called without frame settings.

On mobile, the QR preview appears above settings. Desktop retains the sticky preview beside the two-column settings layout. All 105 QR tests pass, including section order, logo placement, initial/reset defaults, mobile preview order, and horizontal-overflow checks. Style checks, adapter lint/format checks, TypeScript/production build, and diff checks pass. Updated desktop and mobile screenshots use the paths above.

The Frame accordion is expanded by default, alongside Dots Options, including after reopening the modal.

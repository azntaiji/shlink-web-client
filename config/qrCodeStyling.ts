import { fileURLToPath } from 'node:url';
import webComponentPackage from '@shlinkio/shlink-web-component/package.json' with { type: 'json' };
import type { Plugin } from 'vite';

/**
 * The upstream package owns the modal and does not expose a customization API.
 * Keep this adapter restricted to its locked bundle; fail on upstream changes instead of silently losing controls.
 * No installed files are modified. See docs/qr-code-styling.md for the removal path.
 */
export const qrCodeStyling = (): Plugin => ({
  name: 'shlink-qr-code-styling',
  enforce: 'pre',
  transform(source, id) {
    if (!id.split('?')[0].replaceAll('\\', '/').endsWith('/@shlinkio/shlink-web-component/dist/index.js')) {
      return;
    }

    if (webComponentPackage.version !== '0.19.2') {
      throw new Error('Review the QR code styling adapter before updating @shlinkio/shlink-web-component.');
    }

    const replaceOnce = (before: string, after: string) => {
      if (!source.includes(before) || source.indexOf(before) !== source.lastIndexOf(before)) {
        throw new Error(
          'QR code styling adapter no longer matches @shlinkio/shlink-web-component. Update the adapter.',
        );
      }
      source = source.replace(before, () => after);
    };

    const controls = fileURLToPath(new URL('../src/common/qr-codes/QrStylingOptions.tsx', import.meta.url));
    const state = fileURLToPath(new URL('../src/common/qr-codes/useQrStyling.ts', import.meta.url));
    const renderer = fileURLToPath(new URL('../src/common/qr-codes/renderQrCode.ts', import.meta.url));
    const backgroundControls = fileURLToPath(new URL('../src/common/qr-codes/BackgroundOptions.tsx', import.meta.url));
    const frameControls = fileURLToPath(new URL('../src/common/qr-codes/FrameOptions.tsx', import.meta.url));
    source =
      `import { QrStylingOptions as ShlinkQrStylingOptions } from ${JSON.stringify(controls)};\n` +
      `import { useQrStyling } from ${JSON.stringify(state)};\n` +
      `import { BackgroundOptions as ShlinkBackgroundOptions } from ${JSON.stringify(backgroundControls)};\n` +
      `import { FrameOptions as ShlinkFrameOptions } from ${JSON.stringify(frameControls)};\n` +
      `import { renderQrCode } from ${JSON.stringify(renderer)};\n${source}`;

    replaceOnce(
      'drawType: o, logo: s }, c)',
      'drawType: o, logo: s, dotsStyling, cornersSquareStyling, cornersDotStyling, backgroundStyling, frameStyling }, c)',
    );
    replaceOnce('u.current.update({', 'u.current = renderQrCode({');
    replaceOnce('image: s\n\t\t});', 'image: s\n\t\t}, l.current, frameStyling);');
    replaceOnce('backgroundOptions: { color: n },', 'backgroundOptions: { color: n, ...backgroundStyling },');
    replaceOnce(
      'dotsOptions: { color: t },',
      `dotsOptions: { color: t, ...dotsStyling },
      cornersSquareOptions: cornersSquareStyling,
      cornersDotOptions: cornersDotStyling,`,
    );
    replaceOnce(
      '\n\t\tn,\n\t\tt,\n\t\te,\n\t\to,',
      '\n\t\tdotsStyling,\n\t\tcornersSquareStyling,\n\t\tcornersDotStyling,\n\t\tbackgroundStyling,\n\t\tframeStyling,\n\t\tn,\n\t\tt,\n\t\te,\n\t\to,',
    );
    replaceOnce(
      'let a = o("qrCodes", l), [{ size:',
      'let { styling, setStyling, dotsOptions, cornersSquareStyling, setCornersSquareStyling, cornersSquareOptions, cornersDotStyling, setCornersDotStyling, cornersDotOptions, backgroundStyling, setBackgroundStyling, backgroundOptions, frameStyling, setFrameStyling, resetStyling } = useQrStyling();\n\tlet a = o("qrCodes", l), [{ size:',
    );
    replaceOnce('_(a), S(void 0);', '_(a), S(void 0), resetStyling();');
    replaceOnce(
      'let a = o("qrCodes", l),',
      'let qrDefaults = o("qrCodes", l), a = F(() => ({ ...qrDefaults, errorCorrection: "H" }), [qrDefaults]),',
    );
    // Keep p unchanged while a logo is present, so removing it restores the user's selection.
    replaceOnce(
      'z(m, {\n\t\t\t\t\t\terrorCorrection: p,\n\t\t\t\t\t\tonChange: (e) => y({ errorCorrection: e })\n\t\t\t\t\t})',
      'B("fieldset", { disabled: !!x, className: "flex flex-col gap-1", children: [z(m, { errorCorrection: x ? "H" : p, onChange: (e) => y({ errorCorrection: e }) }), x && z("p", { className: "text-sm", children: "High error correction is required for logos." })] })',
    );
    replaceOnce(
      'drawType: i\n',
      'drawType: i,\n\t\t\t\t\t\tdotsStyling: dotsOptions, cornersSquareStyling: cornersSquareOptions, cornersDotStyling: cornersDotOptions, backgroundStyling: backgroundOptions, frameStyling\n',
    );
    replaceOnce(
      'z(Ac, {\n\t\t\t\t\t\tname: "color",\n\t\t\t\t\t\tcolor: d,\n\t\t\t\t\t\tonChange: (e) => y({ color: e })\n\t\t\t\t\t})',
      'z(ShlinkQrStylingOptions, { styling, setStyling, cornersSquareStyling, setCornersSquareStyling, cornersDotStyling, setCornersDotStyling, color: d, onColorChange: (e) => y({ color: e }), ColorControl: Ac })',
    );
    replaceOnce(
      'z(Ac, {\n\t\t\t\t\t\tname: "background",\n\t\t\t\t\t\tcolor: f,\n\t\t\t\t\t\tonChange: (e) => y({ bgColor: e })\n\t\t\t\t\t})',
      'z(ShlinkBackgroundOptions, { backgroundStyling, setBackgroundStyling, color: f, onColorChange: (e) => y({ bgColor: e }), ColorControl: Ac })',
    );

    replaceOnce(
      '!x && /* @__PURE__ */ B(R,',
      'z(ShlinkFrameOptions, { frameStyling, setFrameStyling, styling, color: d, ColorControl: Ac }),\n\t\t\t\t\t!x && /* @__PURE__ */ B(R,',
    );

    return { code: source, map: null };
  },
});

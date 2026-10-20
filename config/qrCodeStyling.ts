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
    const corners = fileURLToPath(new URL('../src/common/qr-codes/cornersSquareStyling.ts', import.meta.url));
    source =
      `import { QrStylingOptions as ShlinkQrStylingOptions } from ${JSON.stringify(controls)};\n` +
      `import { useQrStyling } from ${JSON.stringify(state)};\n` +
      `import { preserveInnerEyeColor } from ${JSON.stringify(corners)};\n${source}`;

    replaceOnce('drawType: o, logo: s }, c)', 'drawType: o, logo: s, dotsStyling, cornersSquareStyling }, c)');
    replaceOnce('u.current.append(e);', 'u.current.applyExtension(preserveInnerEyeColor);\n\t\tu.current.append(e);');
    replaceOnce(
      'dotsOptions: { color: t },',
      `dotsOptions: { color: t, ...dotsStyling },
      cornersSquareOptions: cornersSquareStyling,
      cornersDotOptions: cornersSquareStyling?.color || cornersSquareStyling?.gradient ? { color: t } : undefined,`,
    );
    replaceOnce(
      '\n\t\tn,\n\t\tt,\n\t\te,\n\t\to,',
      '\n\t\tdotsStyling,\n\t\tcornersSquareStyling,\n\t\tn,\n\t\tt,\n\t\te,\n\t\to,',
    );
    replaceOnce(
      'let a = o("qrCodes", l), [{ size:',
      'let { styling, setStyling, dotsOptions, cornersSquareStyling, setCornersSquareStyling, cornersSquareOptions, resetStyling } = useQrStyling();\n\tlet a = o("qrCodes", l), [{ size:',
    );
    replaceOnce('_(a), S(void 0);', '_(a), S(void 0), resetStyling();');
    replaceOnce(
      'drawType: i\n',
      'drawType: i,\n\t\t\t\t\t\tdotsStyling: dotsOptions, cornersSquareStyling: cornersSquareOptions\n',
    );
    replaceOnce(
      'z(Ac, {\n\t\t\t\t\t\tname: "color",\n\t\t\t\t\t\tcolor: d,\n\t\t\t\t\t\tonChange: (e) => y({ color: e })\n\t\t\t\t\t})',
      'z(ShlinkQrStylingOptions, { styling, setStyling, cornersSquareStyling, setCornersSquareStyling, color: d, onColorChange: (e) => y({ color: e }), ColorControl: Ac })',
    );

    return { code: source, map: null };
  },
});

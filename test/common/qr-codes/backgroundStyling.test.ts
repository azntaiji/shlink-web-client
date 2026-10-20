import type QRCodeStyling from 'qr-code-styling';
import { defaultBackgroundStyling, toBackgroundOptions } from '../../../src/common/qr-codes/backgroundStyling';
import { renderQrCode } from '../../../src/common/qr-codes/renderQrCode';

const getSvg = async (qr: QRCodeStyling) =>
  new DOMParser().parseFromString(await ((await qr.getRawData('svg')) as Blob).text(), 'image/svg+xml');

const getPixels = async (qr: QRCodeStyling) => {
  const image = await createImageBitmap((await qr.getRawData('png')) as Blob);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 300;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  image.close();
  return context.getImageData(0, 0, 300, 300).data;
};

describe('background rendering', () => {
  it.each(['linear', 'radial'] as const)(
    'renders a %s background without changing foreground pixels',
    async (gradientType) => {
      let qr = renderQrCode({
        type: 'svg',
        data: 'https://example.com/qr',
        margin: 20,
        dotsOptions: { color: '#000000', type: 'square' },
        cornersSquareOptions: { type: 'square', color: '#ff0000' },
        cornersDotOptions: { type: 'square', color: '#00ff00' },
        backgroundOptions: { color: '#ffffff', ...toBackgroundOptions(defaultBackgroundStyling) },
      });
      const before = await getPixels(qr);
      const styling = { ...defaultBackgroundStyling, colorType: 'gradient' as const, gradientType, rotation: 90 };
      qr = renderQrCode({ ...qr._options, backgroundOptions: { color: '#ffffff', ...toBackgroundOptions(styling) } });
      const svg = await getSvg(qr);
      const gradient = svg.querySelector(`${gradientType}Gradient[id^="background-color-"]`)!;
      expect(gradient).not.toBeNull();
      expect(Array.from(gradient.querySelectorAll('stop')).map((stop) => stop.getAttribute('stop-color'))).toEqual([
        '#a7b6c5',
        '#ffffff',
      ]);
      expect(qr._options.backgroundOptions?.gradient?.rotation).toBe(gradientType === 'linear' ? Math.PI / 2 : 0);
      const after = await getPixels(qr);
      let changedForeground = 0;
      let changedBackground = 0;
      for (let offset = 0; offset < before.length; offset += 4) {
        const isBackground = before[offset] === 255 && before[offset + 1] === 255 && before[offset + 2] === 255;
        const changed = [0, 1, 2, 3].some((channel) => before[offset + channel] !== after[offset + channel]);
        if (changed && isBackground) {
          changedBackground++;
        } else if (changed) {
          changedForeground++;
        }
      }
      expect(changedBackground).toBeGreaterThan(0);
      expect(changedForeground).toBe(0);
      qr = renderQrCode({
        ...qr._options,
        backgroundOptions: { color: '#fedcba', ...toBackgroundOptions(defaultBackgroundStyling) },
      });
      const cleared = await getSvg(qr);
      expect(cleared.querySelector('[id^="background-color-"]')).toBeNull();
      expect(cleared.querySelector('rect[clip-path*="clip-path-background-color-"]')?.getAttribute('fill')).toBe(
        '#fedcba',
      );
      expect(qr._options.backgroundOptions?.gradient).toBeUndefined();
    },
  );
});

import type QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { inheritedInnerEyeColor, toCornersDotOptions } from '../../../src/common/qr-codes/cornersDotStyling';
import { toCornersSquareOptions } from '../../../src/common/qr-codes/cornersSquareStyling';
import { defaultDotsStyling, toDotsOptions } from '../../../src/common/qr-codes/dotsStyling';
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

describe('inner-eye rendering', () => {
  it.each(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'] as const)(
    'renders %s while leaving data modules and outer eyes unchanged',
    async (style) => {
      const outer = toCornersSquareOptions({
        style: 'dot',
        color: {
          ...defaultDotsStyling,
          color: '#ff0000',
          colorType: 'gradient',
          gradientType: 'radial',
        },
      });
      let qr = renderQrCode({
        type: 'svg',
        data: 'https://example.com/qr',
        dotsOptions: { color: '#123456', type: 'classy-rounded' },
        cornersSquareOptions: outer,
        cornersDotOptions: toCornersDotOptions({}, outer),
      });
      const before = await getPixels(qr);
      qr = renderQrCode({
        ...qr._options,
        cornersDotOptions: toCornersDotOptions(
          {
            style,
            color: {
              ...defaultDotsStyling,
              color: '#00ff00',
            },
          },
          outer,
        ),
      });
      const svg = await getSvg(qr);
      expect(svg.querySelectorAll('rect[clip-path*="clip-path-corners-dot-color-"]')).toHaveLength(3);
      svg.querySelectorAll('rect[clip-path*="clip-path-corners-dot-color-"]').forEach((eye) => {
        expect(eye.getAttribute('fill')).toBe('#00ff00');
      });
      const after = await getPixels(qr);
      const count = qr._qr!.getModuleCount();
      const size = Math.floor(300 / count);
      const origin = Math.floor((300 - count * size) / 2);
      const positions = [
        [2, 2],
        [count - 5, 2],
        [2, count - 5],
      ];
      let changedInside = 0;
      let changedOutside = 0;
      for (let pixel = 0; pixel < 300 * 300; pixel++) {
        const x = pixel % 300;
        const y = Math.floor(pixel / 300);
        const changed = [0, 1, 2, 3].some((channel) => before[pixel * 4 + channel] !== after[pixel * 4 + channel]);
        if (!changed) {
          continue;
        }
        const inside = positions.some(
          ([col, row]) =>
            x >= origin + col * size &&
            x < origin + (col + 3) * size &&
            y >= origin + row * size &&
            y < origin + (row + 3) * size,
        );
        if (inside) {
          changedInside++;
        } else {
          changedOutside++;
        }
      }
      expect(changedInside).toBeGreaterThan(0);
      expect(changedOutside).toBe(0);
    },
  );

  it('supports independent linear and radial gradients, single color, and Clear with an outer override', async () => {
    const outer = toCornersSquareOptions({
      style: 'extra-rounded',
      color: { ...defaultDotsStyling, color: '#ff0000' },
    });
    const dots = { ...defaultDotsStyling, colorType: 'gradient' as const, rotation: 45 };
    let qr = renderQrCode({
      type: 'svg',
      data: 'https://example.com/qr',
      dotsOptions: { color: '#123456', ...toDotsOptions(dots) },
      cornersSquareOptions: outer,
      cornersDotOptions: toCornersDotOptions({}, outer),
    });
    const before = await getPixels(qr);
    const color = {
      ...defaultDotsStyling,
      colorType: 'gradient' as const,
      color: '#00ff00',
      rotation: -90,
      firstColor: '#ff00ff',
      secondColor: '#00ff00',
    };
    qr = renderQrCode({ ...qr._options, cornersDotOptions: toCornersDotOptions({ style: 'dots', color }, outer) });
    let svg = await getSvg(qr);
    expect(svg.querySelectorAll('linearGradient[id^="corners-dot-color-"]')).toHaveLength(3);
    expect((qr._options as Options).cornersDotOptions?.gradient?.rotation).toBeCloseTo(-Math.PI / 2);
    const linearPixels = await getPixels(qr);
    qr = renderQrCode({
      ...qr._options,
      cornersDotOptions: toCornersDotOptions({ color: { ...color, gradientType: 'radial' } }, outer),
    });
    svg = await getSvg(qr);
    expect(svg.querySelectorAll('radialGradient[id^="corners-dot-color-"]')).toHaveLength(3);
    expect(svg.querySelector('linearGradient[id^="corners-dot-color-"]')).toBeNull();
    expect(await getPixels(qr)).not.toEqual(linearPixels);
    qr = renderQrCode({
      ...qr._options,
      cornersDotOptions: toCornersDotOptions({ color: { ...color, colorType: 'single' } }, outer),
    });
    svg = await getSvg(qr);
    expect(svg.querySelector('[id^="corners-dot-color-"]')).toBeNull();
    expect(svg.querySelector('rect[clip-path*="clip-path-corners-dot-color-"]')?.getAttribute('fill')).toBe('#00ff00');
    qr = renderQrCode({ ...qr._options, cornersDotOptions: toCornersDotOptions({}, outer) });
    expect(qr._options.cornersDotOptions?.color).toBe(inheritedInnerEyeColor);
    expect(qr._options.cornersDotOptions?.type).toBeUndefined();
    expect(await getPixels(qr)).toEqual(before);
    expect(qr._options.cornersSquareOptions?.color).toBe('#ff0000');
  });

  it('restores dots inheritance without leaving stale color or gradient options', async () => {
    let qr = renderQrCode({
      type: 'svg',
      data: 'https://example.com/qr',
      dotsOptions: { type: 'classy' },
      cornersDotOptions: toCornersDotOptions(
        {
          style: 'dots',
          color: {
            ...defaultDotsStyling,
            color: '#00ff00',
            colorType: 'gradient',
          },
        },
        undefined,
      ),
    });
    qr = renderQrCode({ ...qr._options, cornersDotOptions: toCornersDotOptions({}, undefined) });
    const svg = await getSvg(qr);
    expect(qr._options.cornersDotOptions).toBeUndefined();
    expect(svg.querySelector('linearGradient')).toBeNull();
    expect(svg.querySelector('[id^="clip-path-corners-dot-color-"]')).toBeNull();
    qr = renderQrCode({ ...qr._options, cornersDotOptions: toCornersDotOptions({ style: 'rounded' }, undefined) });
    expect(qr._options.cornersDotOptions?.type).toBe('rounded');
    expect(qr._options.cornersDotOptions?.color).toBeUndefined();
  });
});

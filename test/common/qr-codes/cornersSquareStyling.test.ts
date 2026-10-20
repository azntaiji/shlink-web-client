import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { preserveInnerEyeColor, toCornersSquareOptions } from '../../../src/common/qr-codes/cornersSquareStyling';
import { defaultDotsStyling, toDotsOptions } from '../../../src/common/qr-codes/dotsStyling';

const getSvg = async (qr: QRCodeStyling) => {
  const blob = (await qr.getRawData('svg')) as Blob;
  return new DOMParser().parseFromString(await blob.text(), 'image/svg+xml');
};

describe('outer-eye rendering', () => {
  it.each(['square', 'dot', 'extra-rounded'] as const)('renders the %s outer-eye override', async (style) => {
    const qr = new QRCodeStyling({
      type: 'svg',
      data: 'https://example.com/qr',
      dotsOptions: { type: 'classy', color: '#123456' },
      cornersSquareOptions: toCornersSquareOptions({ style, color: { ...defaultDotsStyling, color: '#ff0000' } }),
      cornersDotOptions: { color: '#123456' },
    });
    qr.applyExtension(preserveInnerEyeColor);
    const svg = await getSvg(qr);
    expect(svg.querySelectorAll('clipPath[id^="clip-path-corners-square-color-"]')).toHaveLength(3);
    expect(svg.querySelector('rect[clip-path*="clip-path-corners-square-color-"]')?.getAttribute('fill')).toBe(
      '#ff0000',
    );
    expect(svg.querySelector('rect[clip-path*="clip-path-corners-dot-color-"]')?.getAttribute('fill')).toBe('#123456');
  });

  it.each(['single', 'linear', 'radial'] as const)(
    'preserves inner-eye paint and pixels when dots use %s color',
    async (colorType) => {
      const dots = {
        ...defaultDotsStyling,
        colorType: colorType === 'single' ? ('single' as const) : ('gradient' as const),
        gradientType: colorType === 'radial' ? ('radial' as const) : ('linear' as const),
        rotation: 45,
      };
      const qr = new QRCodeStyling({
        type: 'svg',
        data: 'https://example.com/qr',
        dotsOptions: { color: '#123456', ...toDotsOptions(dots) },
      });
      qr.applyExtension(preserveInnerEyeColor);
      const pixels = async () => {
        const bitmap = await createImageBitmap((await qr.getRawData('png')) as Blob);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 300;
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        const count = qr._qr!.getModuleCount();
        const size = Math.floor(300 / count);
        const origin = Math.floor((300 - count * size) / 2) + 2 * size;
        return Array.from(context.getImageData(origin, origin, 3 * size, 3 * size).data);
      };
      const before = await pixels();
      qr.update({
        cornersSquareOptions: toCornersSquareOptions({
          style: 'dot',
          color: {
            ...defaultDotsStyling,
            color: '#ff0000',
            colorType: 'gradient',
            firstColor: '#ff0000',
            secondColor: '#00ff00',
          },
        }),
        cornersDotOptions: { color: '#123456' },
      });
      const svg = await getSvg(qr);
      const fill = svg.querySelector('rect[clip-path*="clip-path-dot-color-"]')!.getAttribute('fill');
      svg.querySelectorAll('rect[clip-path*="clip-path-corners-dot-color-"]').forEach((innerEye) => {
        expect(innerEye.getAttribute('fill')).toBe(fill);
      });
      expect(await pixels()).toEqual(before);

      qr.update({ cornersSquareOptions: toCornersSquareOptions({}), cornersDotOptions: undefined });
      const cleared = await getSvg(qr);
      expect(cleared.querySelector('[id^="clip-path-corners-square-color-"]')).toBeNull();
      expect(cleared.querySelector('[id^="clip-path-corners-dot-color-"]')).toBeNull();
      expect(await pixels()).toEqual(before);
    },
  );

  it('clears gradient and style settings when returning to single color and inheritance', async () => {
    const qr = new QRCodeStyling({
      type: 'svg',
      data: 'https://example.com/qr',
      cornersSquareOptions: toCornersSquareOptions({
        style: 'dot',
        color: {
          ...defaultDotsStyling,
          color: '#ff0000',
          colorType: 'gradient',
          rotation: 90,
        },
      }),
    });
    expect((qr._options as Options).cornersSquareOptions?.gradient?.rotation).toBeCloseTo(Math.PI / 2);
    qr.update({ cornersSquareOptions: toCornersSquareOptions({ color: { ...defaultDotsStyling, color: '#00ff00' } }) });
    const svg = await getSvg(qr);
    expect(svg.querySelector('linearGradient')).toBeNull();
    expect(svg.querySelector('rect[clip-path*="clip-path-corners-square-color-"]')?.getAttribute('fill')).toBe(
      '#00ff00',
    );
    expect((qr._options as Options).cornersSquareOptions?.type).toBeUndefined();
  });
});

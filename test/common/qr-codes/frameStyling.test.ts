import './setup';
import type QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { defaultFrameStyling } from '../../../src/common/qr-codes/frameStyling';
import { renderQrCode } from '../../../src/common/qr-codes/renderQrCode';

const options: Options = {
  type: 'svg',
  width: 400,
  height: 400,
  margin: 8,
  data: 'https://example.com/qr',
  dotsOptions: { type: 'square', color: '#123456' },
  backgroundOptions: { color: '#ffffff' },
};

const getSvg = async (qr: QRCodeStyling) =>
  new DOMParser().parseFromString(await ((await qr.getRawData('svg')) as Blob).text(), 'image/svg+xml');

describe('frame rendering', () => {
  it('leaves the normal code unframed when disabled', async () => {
    const qr = renderQrCode(options);
    const svg = await getSvg(qr);
    expect(svg.querySelector('[data-qr-frame]')).toBeNull();
    expect(qr._options.shape).toBe('square');
  });

  it.each(['square', 'circle'] as const)('renders a %s border with module thickness and both labels', async (shape) => {
    const frame = { ...defaultFrameStyling, enabled: true, shape, topText: 'SCAN ME', bottomText: 'LEARN MORE' };
    const qr = renderQrCode(options, undefined, frame);
    const svg = await getSvg(qr);
    const border = svg.querySelector('[data-qr-frame]')!;
    expect(border.tagName).toBe(shape === 'circle' ? 'circle' : 'rect');
    expect(border.getAttribute('stroke')).toBe('#123456');
    const count = qr._qr!.getModuleCount();
    const moduleSize = Math.floor((400 - 16) / (shape === 'circle' ? Math.SQRT2 : 1) / count);
    expect(Number(border.getAttribute('stroke-width'))).toBe(moduleSize);
    expect(svg.querySelector('[data-qr-frame-text="top"]')?.textContent).toBe('SCAN ME');
    expect(svg.querySelector('[data-qr-frame-text="bottom"]')?.textContent).toBe('LEARN MORE');
    expect(svg.querySelectorAll('textPath')).toHaveLength(shape === 'circle' ? 2 : 0);
    svg.querySelectorAll('textPath').forEach((text) => {
      const href = text.getAttribute('href')!;
      expect(svg.querySelector(href)).not.toBeNull();
      expect(text.getAttribute('startOffset')).toBe('50%');
    });
    expect(svg.documentElement.getAttribute('width')).toBe('400');
    expect(svg.documentElement.getAttribute('height')).toBe('400');
    const bitmap = await createImageBitmap((await qr.getRawData('png')) as Blob);
    expect([bitmap.width, bitmap.height]).toEqual([400, 400]);
    bitmap.close();
  });

  it('fills the circular perimeter with library-generated data modules', async () => {
    const square = renderQrCode(options, undefined, { ...defaultFrameStyling, enabled: true });
    const circle = renderQrCode(options, undefined, { ...defaultFrameStyling, enabled: true, shape: 'circle' });
    const squareSvg = await getSvg(square);
    const circleSvg = await getSvg(circle);
    const modules = (svg: Document) => svg.querySelector('[id^="clip-path-dot-color-"]')!.children;
    expect(modules(circleSvg).length).toBeGreaterThan(modules(squareSvg).length);
    const size = Math.floor((400 - 16) / Math.SQRT2 / circle._qr!.getModuleCount());
    const coreStart = Math.floor((400 - circle._qr!.getModuleCount() * size) / 2);
    expect(Array.from(modules(circleSvg)).some((node) => Number(node.getAttribute('x')) < coreStart)).toBe(true);
    expect(circle._options.shape).toBe('circle');
  });

  it.each(['linear', 'radial'] as const)(
    'inherits the %s dots gradient and allows custom frame color',
    async (type) => {
      const gradientOptions: Options = {
        ...options,
        dotsOptions: {
          type: 'rounded',
          color: '#123456',
          gradient: {
            type,
            colorStops: [
              { offset: 0, color: '#2078cf' },
              { offset: 1, color: '#000000' },
            ],
          },
        },
      };
      const frame = { ...defaultFrameStyling, enabled: true, topText: 'SCAN' };
      const qr = renderQrCode(gradientOptions, undefined, frame);
      const svg = await getSvg(qr);
      const paint = svg.querySelector('rect[clip-path*="clip-path-dot-color-"]')!.getAttribute('fill');
      expect(svg.querySelector('[data-qr-frame]')!.getAttribute('stroke')).toBe(paint);
      expect(svg.querySelector('text')!.getAttribute('fill')).toBe(paint);
      const custom = renderQrCode(gradientOptions, undefined, { ...frame, color: '#ff0000' });
      const customSvg = await getSvg(custom);
      expect(customSvg.querySelector('[data-qr-frame]')!.getAttribute('stroke')).toBe('#ff0000');
      expect(customSvg.querySelector('text')!.getAttribute('fill')).toBe('#ff0000');
      expect(customSvg.querySelector('rect[clip-path*="clip-path-dot-color-"]')!.getAttribute('fill')).toContain(
        'url(',
      );
    },
  );

  it('escapes and limits text, omits blank labels, and supports fractional modules', async () => {
    const qr = renderQrCode({ ...options, dotsOptions: { color: '#000000', roundSize: false } }, undefined, {
      ...defaultFrameStyling,
      enabled: true,
      topText: '<script>alert(1)</script>',
    });
    const svg = await getSvg(qr);
    expect(svg.querySelector('text')!.textContent).toBe('<script>alert(1)</sc');
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelectorAll('text')).toHaveLength(1);
    expect(Number(svg.querySelector('[data-qr-frame]')!.getAttribute('stroke-width')) % 1).not.toBe(0);
  });

  it('removes circular fill, frame, and text when disabled again', async () => {
    const framed = renderQrCode(options, undefined, {
      ...defaultFrameStyling,
      enabled: true,
      shape: 'circle',
      topText: 'SCAN',
    });
    await framed.getRawData('png');
    const plain = renderQrCode(framed._options, undefined, defaultFrameStyling);
    const svg = await getSvg(plain);
    expect(plain._options.shape).toBe('square');
    expect(svg.querySelector('[data-qr-frame-content]')).toBeNull();
    expect(svg.querySelector('text')).toBeNull();
  });
});

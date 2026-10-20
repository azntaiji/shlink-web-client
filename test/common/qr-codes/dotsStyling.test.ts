import './setup';
import QRCodeStyling from 'qr-code-styling';
import type { DotsStyling } from '../../../src/common/qr-codes/dotsStyling';
import { defaultDotsStyling, toDotsOptions } from '../../../src/common/qr-codes/dotsStyling';

describe('dots styling', () => {
  it.each(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'] as const)(
    'renders %s using the library and inherits the dots style for both eyes',
    async (style) => {
      const qr = new QRCodeStyling({
        type: 'svg',
        data: 'https://example.com/qr',
        dotsOptions: { color: '#000000', ...toDotsOptions({ ...defaultDotsStyling, style }) },
      });
      const blob = await qr.getRawData('svg');
      expect(blob).toBeInstanceOf(Blob);
      const svg = await (blob as Blob).text();
      expect(svg).toContain('<svg');
      const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const modules = document.querySelector('[id^="clip-path-dot-color"]')!;
      expect(modules.children.length).toBeGreaterThan(0);
      expect(modules.querySelector(style === 'square' ? 'rect' : style === 'dots' ? 'circle' : 'path')).not.toBeNull();
      // Without corner overrides, the library draws both eyes into the same styled module layer.
      expect(document.querySelector('[id^="clip-path-corners"]')).toBeNull();
    },
  );

  it('converts degrees to radians and clears gradients when returning to a single color', async () => {
    const styling: DotsStyling = { ...defaultDotsStyling, colorType: 'gradient', rotation: 90 };
    expect(toDotsOptions(styling)?.gradient?.rotation).toBeCloseTo(Math.PI / 2);
    const qr = new QRCodeStyling({
      type: 'svg',
      data: 'https://example.com/qr',
      dotsOptions: { color: '#123456', ...toDotsOptions(styling) },
    });
    const svg = async () => ((await qr.getRawData('svg')) as Blob).text();
    expect(await svg()).toContain('linearGradient');
    expect(await svg()).toContain('#2078cf');
    qr.update({ dotsOptions: toDotsOptions({ ...styling, gradientType: 'radial' }) });
    expect(await svg()).toContain('radialGradient');
    expect(await svg()).not.toContain('linearGradient');
    expect(toDotsOptions({ ...styling, gradientType: 'radial' })?.gradient?.rotation).toBe(0);
    qr.update({ dotsOptions: toDotsOptions(defaultDotsStyling) });
    expect(await svg()).not.toContain('Gradient');
    expect(await svg()).toContain('#123456');
  });
});

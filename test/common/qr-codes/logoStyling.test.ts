import jsQR from 'jsqr';
import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { page } from 'vitest/browser';
import { dotStyles } from '../../../src/common/qr-codes/dotsStyling';
import { defaultFrameStyling } from '../../../src/common/qr-codes/frameStyling';
import { logoImageSize, renderQrCode } from '../../../src/common/qr-codes/renderQrCode';
import { createLogo } from './logoFixtures';

const getSvg = async (qr: QRCodeStyling) =>
  new DOMParser().parseFromString(await ((await qr.getRawData('svg')) as Blob).text(), 'image/svg+xml');

const decode = async (qr: QRCodeStyling) => {
  const bitmap = await createImageBitmap((await qr.getRawData('png')) as Blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(pixels.data, pixels.width, pixels.height)?.data;
};

const payloads = ['https://example.com/qr', `https://example.com/long-path?campaign=${'abcdefghij'.repeat(8)}`];
const frames = ['none', 'square', 'circle'] as const;
const makeOptions = (data: string, width: number, image: string): Options => ({
  type: 'svg',
  width,
  height: width,
  margin: 20,
  data,
  image,
  qrOptions: { errorCorrectionLevel: 'L' },
  dotsOptions: { type: 'square', color: '#000000' },
  backgroundOptions: { color: '#ffffff' },
});

const cases = (['opaque', 'transparent', 'wide'] as const).flatMap((logo) =>
  payloads.flatMap((data) => frames.flatMap((shape) => [300, 600].map((size) => ({ logo, data, shape, size })))),
);

describe('logo sizing', () => {
  it.each(cases)('decodes $logo logo, $shape frame, $size px, $data', async ({ logo, data, shape, size }) => {
    const qr = renderQrCode(makeOptions(data, size, createLogo(logo)), undefined, {
      ...defaultFrameStyling,
      enabled: shape !== 'none',
      shape: shape === 'circle' ? 'circle' : 'square',
      topText: 'SCAN ME',
      bottomText: 'EXAMPLE.COM',
    });
    expect(qr._options.qrOptions.errorCorrectionLevel).toBe('H');
    expect(qr._options.imageOptions.imageSize).toBe(logoImageSize);
    expect(await decode(qr)).toBe(data);
    const svg = await getSvg(qr);
    expect(svg.documentElement.getAttribute('width')).toBe(String(size));
    expect(svg.documentElement.getAttribute('height')).toBe(String(size));
    const image = svg.querySelector('image')!;
    expect(Number.parseFloat(image.getAttribute('width')!)).toBeGreaterThan(0);
    expect(Number.parseFloat(image.getAttribute('height')!)).toBeGreaterThan(0);
    if (shape !== 'none') {
      expect(image.parentElement!.getAttribute('data-qr-frame-content')).toBe('');
    }
  });

  it.each(Object.keys(dotStyles) as (keyof typeof dotStyles)[])('decodes %s dots with every frame', async (type) => {
    for (const shape of frames) {
      const options = makeOptions(payloads[0], 300, createLogo());
      const qr = renderQrCode(
        {
          ...options,
          dotsOptions: { ...options.dotsOptions, type },
          // Keep finder patterns continuous: jsQR cannot locate some dotted circular eyes even without a logo.
          cornersSquareOptions: { type: 'square' },
          cornersDotOptions: { type: 'square' },
        },
        undefined,
        {
          ...defaultFrameStyling,
          enabled: shape !== 'none',
          shape: shape === 'circle' ? 'circle' : 'square',
          topText: 'SCAN ME',
          bottomText: 'EXAMPLE.COM',
        },
      );
      expect(await decode(qr), shape).toBe(payloads[0]);
    }
  });

  it('increases the visible logo over the previous High-correction size', async () => {
    const options = makeOptions(payloads[0], 400, createLogo());
    const old = new QRCodeStyling({
      ...options,
      qrOptions: { errorCorrectionLevel: 'H' },
      imageOptions: { imageSize: 0.3, margin: 5 },
    });
    const current = renderQrCode(options);
    const width = async (qr: QRCodeStyling) =>
      Number.parseFloat((await getSvg(qr)).querySelector('image')!.getAttribute('width')!);
    expect(await width(current)).toBeGreaterThan(await width(old));
  });

  it('keeps the logo proportional to the data grid across frame shapes', async () => {
    const ratios = [];
    for (const shape of frames) {
      const qr = renderQrCode(makeOptions(payloads[0], 600, createLogo()), undefined, {
        ...defaultFrameStyling,
        enabled: shape !== 'none',
        shape: shape === 'circle' ? 'circle' : 'square',
      });
      const svg = await getSvg(qr);
      const image = svg.querySelector('image')!;
      const size = qr._qr!.getModuleCount();
      const moduleSize = Math.floor((600 - 40) / (shape === 'circle' ? Math.SQRT2 : 1) / size);
      const width = Number.parseFloat(image.getAttribute('width')!);
      // Padding is inside the reserved module rectangle; both transform with the frame.
      ratios.push((width + 10) / (size * moduleSize));
      expect(Math.abs(Number(image.getAttribute('x')) + width / 2 - 300)).toBeLessThanOrEqual(1);
    }
    expect(ratios[0]).toBe(ratios[1]);
    expect(ratios[0]).toBe(ratios[2]);
  });

  it.each(['square', 'circle'] as const)('captures the %s logo design for device testing', async (shape) => {
    await page.viewport(620, 620);
    const container = document.createElement('div');
    container.style.cssText = 'width:600px;height:600px;background:white';
    document.body.appendChild(container);
    const qr = renderQrCode(makeOptions(payloads[0], 600, createLogo()), container, {
      ...defaultFrameStyling,
      enabled: true,
      shape,
      topText: 'SCAN ME',
      bottomText: 'EXAMPLE.COM',
    });
    await qr.getRawData('svg');
    await page.screenshot({ path: `../../../reports/qr-code-logo-${shape}.png` });
    container.remove();
  });

  it('captures inherited dotted eyes for independent scanner validation', async () => {
    await page.viewport(620, 620);
    const container = document.createElement('div');
    container.style.cssText = 'width:600px;height:600px;background:white';
    document.body.appendChild(container);
    const options = makeOptions(payloads[0], 600, createLogo());
    const qr = renderQrCode({ ...options, dotsOptions: { type: 'dots', color: '#000000' } }, container, {
      ...defaultFrameStyling,
      enabled: true,
      shape: 'circle',
      topText: 'SCAN ME',
      bottomText: 'EXAMPLE.COM',
    });
    await qr.getRawData('svg');
    await page.screenshot({ path: '../../../reports/qr-code-logo-circle-dotted.png' });
    container.remove();
  });

  it('retains caller options without an image and applies the logo policy only when present', async () => {
    const options = makeOptions(payloads[0], 400, createLogo());
    const qr = renderQrCode({ ...options, qrOptions: { typeNumber: 5, errorCorrectionLevel: 'M' } });
    expect(qr._options.qrOptions).toMatchObject({ typeNumber: 5, errorCorrectionLevel: 'H' });
    expect(qr._options.imageOptions).toMatchObject({ hideBackgroundDots: true, margin: 5, imageSize: logoImageSize });
    expect(options.qrOptions?.errorCorrectionLevel).toBe('L');
    const plain = renderQrCode({ ...options, image: undefined });
    expect(plain._options.qrOptions.errorCorrectionLevel).toBe('L');
    expect((await getSvg(plain)).querySelector('image')).toBeNull();
  });
});

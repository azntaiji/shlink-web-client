import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { preserveInnerEyeColor } from './cornersSquareStyling';
import type { FrameStyling } from './frameStyling';
import { defaultFrameStyling, drawFrame } from './frameStyling';

// Calibrated against exported PNGs; this coefficient is not a percentage of QR width.
export const logoImageSize = 0.5;

export const renderQrCode = (
  options: Options,
  container?: HTMLElement | null,
  frame: FrameStyling = defaultFrameStyling,
) => {
  // SVG-mode updates retain the library's previously exported canvas. A fresh renderer keeps every format current.
  const qr = new QRCodeStyling();
  qr.applyExtension((svg, currentOptions) => {
    preserveInnerEyeColor(svg, currentOptions);
    if (frame.enabled && qr._qr) {
      drawFrame(svg, currentOptions, frame, qr._qr.getModuleCount());
    }
  });
  qr.append(container ?? undefined);
  qr.update({
    ...options,
    shape: frame.enabled ? frame.shape : 'square',
    ...(options.image && {
      qrOptions: { ...options.qrOptions, errorCorrectionLevel: 'H' },
      imageOptions: { ...options.imageOptions, hideBackgroundDots: true, margin: 5, imageSize: logoImageSize },
    }),
  });
  return qr;
};

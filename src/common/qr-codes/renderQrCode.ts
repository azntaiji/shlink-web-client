import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { preserveInnerEyeColor } from './cornersSquareStyling';

export const renderQrCode = (options: Options, container?: HTMLElement | null) => {
  // SVG-mode updates retain the library's previously exported canvas. A fresh renderer keeps every format current.
  const qr = new QRCodeStyling();
  qr.applyExtension(preserveInnerEyeColor);
  qr.append(container ?? undefined);
  qr.update(options);
  return qr;
};

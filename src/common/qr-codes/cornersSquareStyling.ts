import type { ExtensionFunction, Options } from 'qr-code-styling';
import type { ColorStyling } from './colorStyling';
import { toGradient } from './colorStyling';

export type CornersSquareStyling = {
  style?: 'square' | 'dot' | 'extra-rounded';
  color?: ColorStyling & { color: string };
};

export const toCornersSquareOptions = (styling: CornersSquareStyling): Options['cornersSquareOptions'] => ({
  // Explicit undefined values clear previous settings in the library's merged updates.
  type: styling.style,
  color: styling.color?.color,
  gradient: styling.color ? toGradient(styling.color) : undefined,
});

/** The library normally lets the inner eye inherit the outer eye's color. Keep it on the dots' paint layer instead. */
export const preserveInnerEyeColor: ExtensionFunction = (svg) => {
  const fill = svg.querySelector('rect[clip-path*="clip-path-dot-color-"]')?.getAttribute('fill');
  if (!fill) {
    return;
  }
  svg.querySelectorAll('rect[clip-path*="clip-path-corners-dot-color-"]').forEach((eye) => {
    eye.setAttribute('fill', fill);
  });
};

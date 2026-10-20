import type { Options } from 'qr-code-styling';
import type { ColorStyling } from './colorStyling';
import { toGradient } from './colorStyling';

export const defaultBackgroundStyling: ColorStyling = {
  colorType: 'single',
  gradientType: 'linear',
  firstColor: '#a7b6c5',
  secondColor: '#ffffff',
  rotation: 0,
};

export const toBackgroundOptions = (styling: ColorStyling): Options['backgroundOptions'] => ({
  gradient: toGradient(styling),
});

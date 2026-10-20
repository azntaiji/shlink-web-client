import type { DotType, Options } from 'qr-code-styling';
import { useMemo, useState } from 'react';
import type { ColorStyling } from './colorStyling';
import { toGradient } from './colorStyling';

export type DotsStyling = ColorStyling & {
  style: DotType;
};

export const dotStyles = {
  square: 'Square',
  dots: 'Dots',
  rounded: 'Rounded',
  'extra-rounded': 'Extra Rounded',
  classy: 'Classy',
  'classy-rounded': 'Classy Rounded',
} as const;

export const defaultDotsStyling: DotsStyling = {
  style: 'square',
  colorType: 'single',
  gradientType: 'linear',
  firstColor: '#2078cf',
  secondColor: '#000000',
  rotation: 0,
};

export const toDotsOptions = (styling: DotsStyling): Options['dotsOptions'] => ({
  type: styling.style,
  // Explicitly clear the gradient when switching back to a single color. The library merges updates.
  gradient: toGradient(styling),
});

export const useDotsStyling = () => {
  const [styling, setStyling] = useState(defaultDotsStyling);
  const dotsOptions = useMemo(() => toDotsOptions(styling), [styling]);

  return { styling, setStyling, dotsOptions };
};

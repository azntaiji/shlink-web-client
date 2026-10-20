import type { DotType, GradientType, Options } from 'qr-code-styling';
import { useMemo, useState } from 'react';

export type DotsStyling = {
  style: DotType;
  colorType: 'single' | 'gradient';
  gradientType: GradientType;
  firstColor: string;
  secondColor: string;
  rotation: number;
};

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
  gradient:
    styling.colorType === 'single'
      ? undefined
      : {
          type: styling.gradientType,
          rotation: styling.gradientType === 'linear' ? (styling.rotation * Math.PI) / 180 : 0,
          colorStops: [
            { offset: 0, color: styling.firstColor },
            { offset: 1, color: styling.secondColor },
          ],
        },
});

export const useDotsStyling = () => {
  const [styling, setStyling] = useState(defaultDotsStyling);
  const dotsOptions = useMemo(() => toDotsOptions(styling), [styling]);

  return { styling, setStyling, dotsOptions };
};

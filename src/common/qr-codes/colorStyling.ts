import type { Gradient, GradientType } from 'qr-code-styling';

export type ColorStyling = {
  colorType: 'single' | 'gradient';
  gradientType: GradientType;
  firstColor: string;
  secondColor: string;
  rotation: number;
};

export const toGradient = (styling: ColorStyling): Gradient | undefined =>
  styling.colorType === 'single'
    ? undefined
    : {
        type: styling.gradientType,
        rotation: styling.gradientType === 'linear' ? (styling.rotation * Math.PI) / 180 : 0,
        colorStops: [
          { offset: 0, color: styling.firstColor },
          { offset: 1, color: styling.secondColor },
        ],
      };

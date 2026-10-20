import type { DotType, Options } from 'qr-code-styling';
import type { ColorStyling } from './colorStyling';
import { toGradient } from './colorStyling';

export type CornersDotStyling = {
  style?: DotType;
  color?: ColorStyling & { color: string };
};

// The extension replaces this valid SVG color with the dots' exact paint, including global gradient alignment.
export const inheritedInnerEyeColor = 'inherit';

export const toCornersDotOptions = (
  styling: CornersDotStyling,
  outerOptions: Options['cornersSquareOptions'],
): Options['cornersDotOptions'] => {
  const outerHasColor = Boolean(outerOptions?.color || outerOptions?.gradient);
  if (!styling.style && !styling.color && !outerHasColor) {
    return undefined;
  }

  return {
    type: styling.style,
    color: styling.color?.color ?? (outerHasColor ? inheritedInnerEyeColor : undefined),
    gradient: styling.color ? toGradient(styling.color) : undefined,
  };
};

import { Button, LabelledSelect } from '@shlinkio/shlink-frontend-kit';
import type { Dispatch, SetStateAction } from 'react';
import type { CornersSquareStyling } from './cornersSquareStyling';
import type { DotsOptionsProps } from './DotsOptions';
import { QrColorOptions } from './QrColorOptions';

export type CornersSquareOptionsProps = Pick<DotsOptionsProps, 'styling' | 'color' | 'ColorControl'> & {
  cornersSquareStyling: CornersSquareStyling;
  setCornersSquareStyling: Dispatch<SetStateAction<CornersSquareStyling>>;
};

export const CornersSquareOptions = ({
  styling,
  color,
  ColorControl,
  cornersSquareStyling,
  setCornersSquareStyling,
}: CornersSquareOptionsProps) => {
  const inherited = { ...styling, color };
  const effectiveColor = cornersSquareStyling.color ?? inherited;
  const updateColor = (patch: Partial<typeof effectiveColor>) =>
    setCornersSquareStyling((previous) => ({
      ...previous,
      color: { ...effectiveColor, ...patch },
    }));

  return (
    <details className="rounded border border-current/25 p-2">
      <summary className="cursor-pointer font-bold">Corners Square Options</summary>
      <div className="mt-2 flex flex-col gap-3">
        <p className="text-sm">Options inherit from Dots Options until overridden. None inherits the dots style.</p>
        <LabelledSelect
          label="Corners Square Style"
          value={cornersSquareStyling.style ?? ''}
          onChange={(event) => {
            const style = event.target.value as CornersSquareStyling['style'];
            setCornersSquareStyling((previous) => ({ ...previous, style: style || undefined }));
          }}
        >
          <option value="">None</option>
          <option value="square">Square</option>
          <option value="dot">Dot</option>
          <option value="extra-rounded">Extra Rounded</option>
        </LabelledSelect>
        <QrColorOptions
          styling={effectiveColor}
          onStylingChange={updateColor}
          color={effectiveColor.color}
          onColorChange={(nextColor) => updateColor({ color: nextColor })}
          ColorControl={ColorControl}
          colorLabel="Corners Square Color"
        />
        <Button
          variant="secondary"
          disabled={!cornersSquareStyling.style && !cornersSquareStyling.color}
          onClick={() => setCornersSquareStyling({})}
        >
          Clear
        </Button>
      </div>
    </details>
  );
};

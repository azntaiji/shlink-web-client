import { Button, LabelledSelect } from '@shlinkio/shlink-frontend-kit';
import type { Dispatch, SetStateAction } from 'react';
import type { CornersDotStyling } from './cornersDotStyling';
import type { DotsOptionsProps } from './DotsOptions';
import { dotStyles } from './dotsStyling';
import { QrColorOptions } from './QrColorOptions';

export type CornersDotOptionsProps = Pick<DotsOptionsProps, 'styling' | 'color' | 'ColorControl'> & {
  cornersDotStyling: CornersDotStyling;
  setCornersDotStyling: Dispatch<SetStateAction<CornersDotStyling>>;
};

export const CornersDotOptions = ({
  styling,
  color,
  ColorControl,
  cornersDotStyling,
  setCornersDotStyling,
}: CornersDotOptionsProps) => {
  const effectiveColor = cornersDotStyling.color ?? { ...styling, color };
  const updateColor = (patch: Partial<typeof effectiveColor>) =>
    setCornersDotStyling((previous) => ({
      ...previous,
      color: { ...effectiveColor, ...patch },
    }));

  return (
    <details className="rounded border border-current/25 p-2">
      <summary className="cursor-pointer font-bold">Corners Dot Options</summary>
      <div className="mt-2 flex flex-col gap-3">
        <p className="text-sm">Options inherit from Dots Options until overridden. Clear restores inheritance.</p>
        <LabelledSelect
          label="Corners Dot Style"
          value={cornersDotStyling.style ?? styling.style}
          onChange={(event) => {
            const style = event.target.value as CornersDotStyling['style'];
            setCornersDotStyling((previous) => ({ ...previous, style }));
          }}
        >
          {Object.entries(dotStyles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </LabelledSelect>
        <QrColorOptions
          styling={effectiveColor}
          onStylingChange={updateColor}
          color={effectiveColor.color}
          onColorChange={(nextColor) => updateColor({ color: nextColor })}
          ColorControl={ColorControl}
          colorLabel="Corners Dot Color"
        />
        <Button
          variant="secondary"
          disabled={!cornersDotStyling.style && !cornersDotStyling.color}
          onClick={() => setCornersDotStyling({})}
        >
          Clear
        </Button>
      </div>
    </details>
  );
};

import { LabelledSelect } from '@shlinkio/shlink-frontend-kit';
import type { ComponentType, Dispatch, SetStateAction } from 'react';
import type { DotsStyling } from './dotsStyling';
import { dotStyles } from './dotsStyling';
import { QrColorOptions } from './QrColorOptions';

export type ColorControlProps = {
  name: string;
  color: string;
  onChange: (color: string) => void;
};

export type DotsOptionsProps = {
  styling: DotsStyling;
  setStyling: Dispatch<SetStateAction<DotsStyling>>;
  color: string;
  onColorChange: (color: string) => void;
  ColorControl: ComponentType<ColorControlProps>;
};

export const DotsOptions = ({ styling, setStyling, color, onColorChange, ColorControl }: DotsOptionsProps) => {
  const update = (patch: Partial<DotsStyling>) => setStyling((previous) => ({ ...previous, ...patch }));

  return (
    <details open className="rounded border border-current/25 p-2">
      <summary className="cursor-pointer font-bold">Dots Options</summary>
      <div className="mt-2 flex flex-col gap-3">
        <LabelledSelect
          label="Dots Style"
          value={styling.style}
          onChange={(event) => update({ style: event.target.value as DotsStyling['style'] })}
        >
          {Object.entries(dotStyles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </LabelledSelect>
        <QrColorOptions
          styling={styling}
          onStylingChange={update}
          color={color}
          onColorChange={onColorChange}
          ColorControl={ColorControl}
          colorLabel="Dots Color"
        />
      </div>
    </details>
  );
};

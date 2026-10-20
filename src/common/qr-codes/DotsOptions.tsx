import { Input, LabelledSelect } from '@shlinkio/shlink-frontend-kit';
import type { ComponentType, Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import type { DotsStyling } from './dotsStyling';

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

const styles = {
  square: 'Square',
  dots: 'Dots',
  rounded: 'Rounded',
  'extra-rounded': 'Extra Rounded',
  classy: 'Classy',
  'classy-rounded': 'Classy Rounded',
} as const;

export const DotsOptions = ({ styling, setStyling, color, onColorChange, ColorControl }: DotsOptionsProps) => {
  const id = useId();
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
          {Object.entries(styles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </LabelledSelect>
        <fieldset>
          <legend className="mb-1">Color Type</legend>
          <div className="flex flex-wrap gap-2">
            {(['single', 'gradient'] as const).map((value) => (
              <label key={value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`${id}-color-type`}
                  value={value}
                  checked={styling.colorType === value}
                  onChange={() => update({ colorType: value })}
                />
                {value === 'single' ? 'Single color' : 'Color gradient'}
              </label>
            ))}
          </div>
        </fieldset>
        {styling.colorType === 'single' ? (
          <div className="flex flex-col gap-1">
            <span>Dots Color</span>
            <ColorControl name="Dots Color" color={color} onChange={onColorChange} />
          </div>
        ) : (
          <>
            <fieldset>
              <legend className="mb-1">Gradient Type</legend>
              <div className="flex gap-2">
                {(['linear', 'radial'] as const).map((value) => (
                  <label key={value} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`${id}-gradient-type`}
                      value={value}
                      checked={styling.gradientType === value}
                      onChange={() => update({ gradientType: value })}
                    />
                    {value === 'linear' ? 'Linear' : 'Radial'}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1">Dots Gradient</legend>
              <ColorControl
                name="Dots Gradient first color"
                color={styling.firstColor}
                onChange={(firstColor) => update({ firstColor })}
              />
              <ColorControl
                name="Dots Gradient second color"
                color={styling.secondColor}
                onChange={(secondColor) => update({ secondColor })}
              />
            </fieldset>
            {styling.gradientType === 'linear' && (
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-rotation`}>Rotation (degrees)</label>
                <Input
                  id={`${id}-rotation`}
                  type="number"
                  step="any"
                  defaultValue={styling.rotation}
                  onBlur={(event) => {
                    event.target.value = String(styling.rotation);
                  }}
                  onChange={(event) => {
                    const rotation = event.target.valueAsNumber;
                    if (Number.isFinite(rotation)) {
                      update({ rotation });
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
};

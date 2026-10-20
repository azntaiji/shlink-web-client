import { Input } from '@shlinkio/shlink-frontend-kit';
import type { ComponentType } from 'react';
import { useEffect, useId, useRef } from 'react';
import type { ColorStyling } from './colorStyling';
import type { ColorControlProps } from './DotsOptions';

type QrColorOptionsProps = {
  styling: ColorStyling;
  onStylingChange: (patch: Partial<ColorStyling>) => void;
  color: string;
  onColorChange: (color: string) => void;
  ColorControl: ComponentType<ColorControlProps>;
  colorLabel: string;
};

export const QrColorOptions = ({
  styling,
  onStylingChange: update,
  color,
  onColorChange,
  ColorControl,
  colorLabel,
}: QrColorOptionsProps) => {
  const id = useId();
  const rotationInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = rotationInput.current;
    if (input && input !== document.activeElement) {
      input.value = String(styling.rotation);
    }
  }, [styling.rotation]);
  return (
    <>
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
          <span>{colorLabel}</span>
          <ColorControl name={colorLabel} color={color} onChange={onColorChange} />
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
                ref={rotationInput}
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
    </>
  );
};

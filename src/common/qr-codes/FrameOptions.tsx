import { LabelledInput } from '@shlinkio/shlink-frontend-kit';
import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import type { DotsOptionsProps } from './DotsOptions';
import type { FrameStyling } from './frameStyling';

export type FrameOptionsProps = Pick<DotsOptionsProps, 'styling' | 'color' | 'ColorControl'> & {
  frameStyling: FrameStyling;
  setFrameStyling: Dispatch<SetStateAction<FrameStyling>>;
};

export const FrameOptions = ({ styling, color, ColorControl, frameStyling, setFrameStyling }: FrameOptionsProps) => {
  const id = useId();
  const update = (patch: Partial<FrameStyling>) => setFrameStyling((previous) => ({ ...previous, ...patch }));
  const inheritedColor = styling.colorType === 'gradient' ? styling.firstColor : color;

  return (
    <details className="rounded border border-current/25 p-2">
      <summary className="cursor-pointer font-bold">Frame</summary>
      <div className="mt-2 flex flex-col gap-3">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={frameStyling.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          Enable frame
        </label>
        {frameStyling.enabled && (
          <>
            <fieldset>
              <legend className="mb-1">Shape</legend>
              <div className="flex gap-2">
                {(['square', 'circle'] as const).map((shape) => (
                  <label key={shape} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`${id}-shape`}
                      checked={frameStyling.shape === shape}
                      onChange={() => update({ shape })}
                    />
                    {shape === 'square' ? 'Square' : 'Circle'}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1">Color</legend>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={frameStyling.color === undefined}
                  onChange={(event) => update({ color: event.target.checked ? undefined : inheritedColor })}
                />
                Inherit dots color
              </label>
              <ColorControl
                name="Frame Color"
                color={frameStyling.color ?? inheritedColor}
                onChange={(nextColor) => update({ color: nextColor })}
              />
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1">Frame Text</legend>
              <LabelledInput
                label="Top Text"
                maxLength={20}
                value={frameStyling.topText}
                onChange={(event) => update({ topText: event.target.value.slice(0, 20) })}
              />
              <LabelledInput
                label="Bottom Text"
                maxLength={20}
                value={frameStyling.bottomText}
                onChange={(event) => update({ bottomText: event.target.value.slice(0, 20) })}
              />
            </fieldset>
          </>
        )}
      </div>
    </details>
  );
};

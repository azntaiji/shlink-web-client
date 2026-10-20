import { Button } from '@shlinkio/shlink-frontend-kit';
import { defaultQrCodeSettings } from '@shlinkio/shlink-web-component/settings';
import type { Dispatch, SetStateAction } from 'react';
import { defaultBackgroundStyling } from './backgroundStyling';
import type { ColorStyling } from './colorStyling';
import type { DotsOptionsProps } from './DotsOptions';
import { QrColorOptions } from './QrColorOptions';

export type BackgroundOptionsProps = Pick<DotsOptionsProps, 'color' | 'onColorChange' | 'ColorControl'> & {
  backgroundStyling: ColorStyling;
  setBackgroundStyling: Dispatch<SetStateAction<ColorStyling>>;
};

export const BackgroundOptions = ({
  backgroundStyling,
  setBackgroundStyling,
  color,
  onColorChange,
  ColorControl,
}: BackgroundOptionsProps) => (
  <details className="rounded border border-current/25 p-2">
    <summary className="cursor-pointer font-bold">Background Options</summary>
    <div className="mt-2 flex flex-col gap-3">
      <QrColorOptions
        styling={backgroundStyling}
        onStylingChange={(patch) => setBackgroundStyling((previous) => ({ ...previous, ...patch }))}
        color={color}
        onColorChange={onColorChange}
        ColorControl={ColorControl}
        colorLabel="Background Color"
      />
      <Button
        variant="secondary"
        onClick={() => {
          setBackgroundStyling(defaultBackgroundStyling);
          onColorChange(defaultQrCodeSettings.bgColor);
        }}
      >
        Reset
      </Button>
    </div>
  </details>
);

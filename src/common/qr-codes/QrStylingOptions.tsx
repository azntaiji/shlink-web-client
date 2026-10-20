import type { CornersSquareOptionsProps } from './CornersSquareOptions';
import { CornersSquareOptions } from './CornersSquareOptions';
import type { DotsOptionsProps } from './DotsOptions';
import { DotsOptions } from './DotsOptions';

export const QrStylingOptions = (props: DotsOptionsProps & CornersSquareOptionsProps) => (
  <>
    <DotsOptions {...props} />
    <CornersSquareOptions {...props} />
  </>
);

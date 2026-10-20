import type { CornersDotOptionsProps } from './CornersDotOptions';
import { CornersDotOptions } from './CornersDotOptions';
import type { CornersSquareOptionsProps } from './CornersSquareOptions';
import { CornersSquareOptions } from './CornersSquareOptions';
import type { DotsOptionsProps } from './DotsOptions';
import { DotsOptions } from './DotsOptions';

export const QrStylingOptions = (props: DotsOptionsProps & CornersSquareOptionsProps & CornersDotOptionsProps) => (
  <>
    <DotsOptions {...props} />
    <CornersSquareOptions {...props} />
    <CornersDotOptions {...props} />
  </>
);

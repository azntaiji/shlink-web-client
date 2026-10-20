import type { CornersDotOptionsProps } from './CornersDotOptions';
import { CornersDotOptions } from './CornersDotOptions';
import type { CornersSquareOptionsProps } from './CornersSquareOptions';
import { CornersSquareOptions } from './CornersSquareOptions';
import type { DotsOptionsProps } from './DotsOptions';
import { DotsOptions } from './DotsOptions';
import type { FrameOptionsProps } from './FrameOptions';
import { FrameOptions } from './FrameOptions';

export const QrStylingOptions = (
  props: DotsOptionsProps & CornersSquareOptionsProps & CornersDotOptionsProps & FrameOptionsProps,
) => (
  <>
    <DotsOptions {...props} />
    <FrameOptions {...props} />
    <CornersSquareOptions {...props} />
    <CornersDotOptions {...props} />
  </>
);

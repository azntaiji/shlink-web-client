import { useCallback, useMemo, useState } from 'react';
import type { CornersDotStyling } from './cornersDotStyling';
import { toCornersDotOptions } from './cornersDotStyling';
import type { CornersSquareStyling } from './cornersSquareStyling';
import { toCornersSquareOptions } from './cornersSquareStyling';
import { defaultDotsStyling, useDotsStyling } from './dotsStyling';

export const useQrStyling = () => {
  const dots = useDotsStyling();
  const [cornersSquareStyling, setCornersSquareStyling] = useState<CornersSquareStyling>({});
  const cornersSquareOptions = useMemo(() => toCornersSquareOptions(cornersSquareStyling), [cornersSquareStyling]);
  const [cornersDotStyling, setCornersDotStyling] = useState<CornersDotStyling>({});
  const cornersDotOptions = useMemo(
    () => toCornersDotOptions(cornersDotStyling, cornersSquareOptions),
    [cornersDotStyling, cornersSquareOptions],
  );
  const { setStyling } = dots;
  const resetStyling = useCallback(() => {
    setStyling(defaultDotsStyling);
    setCornersSquareStyling({});
    setCornersDotStyling({});
  }, [setStyling]);

  return {
    ...dots,
    cornersSquareStyling,
    setCornersSquareStyling,
    cornersSquareOptions,
    cornersDotStyling,
    setCornersDotStyling,
    cornersDotOptions,
    resetStyling,
  };
};

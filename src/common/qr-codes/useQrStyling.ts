import { useCallback, useMemo, useState } from 'react';
import { defaultBackgroundStyling, toBackgroundOptions } from './backgroundStyling';
import type { CornersDotStyling } from './cornersDotStyling';
import { toCornersDotOptions } from './cornersDotStyling';
import type { CornersSquareStyling } from './cornersSquareStyling';
import { toCornersSquareOptions } from './cornersSquareStyling';
import { defaultDotsStyling, useDotsStyling } from './dotsStyling';

export const useQrStyling = () => {
  const dots = useDotsStyling();
  const [backgroundStyling, setBackgroundStyling] = useState(defaultBackgroundStyling);
  const backgroundOptions = useMemo(() => toBackgroundOptions(backgroundStyling), [backgroundStyling]);
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
    setBackgroundStyling(defaultBackgroundStyling);
  }, [setStyling]);

  return {
    ...dots,
    backgroundStyling,
    setBackgroundStyling,
    backgroundOptions,
    cornersSquareStyling,
    setCornersSquareStyling,
    cornersSquareOptions,
    cornersDotStyling,
    setCornersDotStyling,
    cornersDotOptions,
    resetStyling,
  };
};

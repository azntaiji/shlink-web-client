import { useCallback, useMemo, useState } from 'react';
import type { CornersSquareStyling } from './cornersSquareStyling';
import { toCornersSquareOptions } from './cornersSquareStyling';
import { defaultDotsStyling, useDotsStyling } from './dotsStyling';

export const useQrStyling = () => {
  const dots = useDotsStyling();
  const [cornersSquareStyling, setCornersSquareStyling] = useState<CornersSquareStyling>({});
  const cornersSquareOptions = useMemo(() => toCornersSquareOptions(cornersSquareStyling), [cornersSquareStyling]);
  const { setStyling } = dots;
  const resetStyling = useCallback(() => {
    setStyling(defaultDotsStyling);
    setCornersSquareStyling({});
  }, [setStyling]);

  return { ...dots, cornersSquareStyling, setCornersSquareStyling, cornersSquareOptions, resetStyling };
};

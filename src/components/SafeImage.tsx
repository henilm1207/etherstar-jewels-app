import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/assets/jewelry-placeholder.svg";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function SafeImage({ fallbackSrc = DEFAULT_FALLBACK, src, className = "", ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      {...props}
      src={currentSrc}
      className={`${className} contrast-[1.04] saturate-[0.94]`}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

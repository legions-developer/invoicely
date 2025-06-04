/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface MDXImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const MDXImage = ({ src, ...props }: MDXImageProps) => {
  const { resolvedTheme } = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) return;

    const isDark = resolvedTheme === "dark";

    if (isDark) {
      // Generate dark mode image path
      const extension = src.split(".").pop();
      const baseName = src.replace(`.${extension}`, "");
      const darkImageSrc = `${baseName}-dark.${extension}`;

      // Check if dark image exists
      const img = new Image();
      img.onload = () => {
        setImageSrc(darkImageSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        // Fallback to light image if dark doesn't exist
        setImageSrc(src);
        setIsLoading(false);
      };
      img.src = darkImageSrc;
    } else {
      setImageSrc(src);
      setIsLoading(false);
    }
  }, [src, resolvedTheme]);

  // Don't render anything until we've determined the correct image
  if (isLoading || !imageSrc) {
    return (
      <div className="-mx-12 my-12 border-y border-dashed p-4">
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="-mx-12 my-12 border-y border-dashed p-4">
      <img src={imageSrc} {...props} className="rounded-lg object-cover object-center" />
    </div>
  );
};

export default MDXImage;

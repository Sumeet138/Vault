import React from "react";
import ImageInput, { ImageInputProps } from "./ImageInput";

type AspectRatioType = "1:1" | "16:9" | "4:3";

interface ThumbnailInputProps extends Omit<ImageInputProps, "description"> {
  aspectRatio?: AspectRatioType;
}

const ASPECT_RATIOS: {
  [key in AspectRatioType]: { label: string; value: number };
} = {
  "1:1": { label: "Square", value: 1 },
  "16:9": { label: "Landscape", value: 16 / 9 },
  "4:3": { label: "Classic", value: 4 / 3 },
};

const ThumbnailInput = ({
  value,
  onChange,
  aspectRatio = "1:1",
  placeholder = "Upload Thumbnail",
  maxSize = 5,
  accept = "image/*",
  className = "",
  disabled = false,
  ...props
}: ThumbnailInputProps) => {
  const getDescription = () => {
    const ratioText = ASPECT_RATIOS[aspectRatio].label;
    return `Recommended: ${ratioText} format (${aspectRatio}), JPG/PNG`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <ImageInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        description={getDescription()}
        maxSize={maxSize}
        accept={accept}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default ThumbnailInput;

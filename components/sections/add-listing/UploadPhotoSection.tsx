"use client";

import Image from "@/components/common/AppImage";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";

const MAX_PHOTOS = 10;

type ListingPhoto = {
  id: string;
  src: string;
  file?: File;
};

function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 5.5 3.59568"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type UploadPhotoSectionProps = {
  onPhotosChange?: (files: File[]) => void;
};

export default function UploadPhotoSection({ onPhotosChange }: UploadPhotoSectionProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onPhotosChange?.(photos.flatMap((photo) => (photo.file ? [photo.file] : [])));
  }, [photos, onPhotosChange]);

  const addPhotos = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!imageFiles.length) {
      return;
    }

    setPhotos((prev) => {
      const remaining = MAX_PHOTOS - prev.length;
      if (remaining <= 0) {
        return prev;
      }

      const newPhotos = imageFiles.slice(0, remaining).map((file) => ({
        id: `photo-${crypto.randomUUID()}`,
        src: URL.createObjectURL(file),
        file,
      }));

      return [...prev, ...newPhotos];
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((item) => item.id === id);
      if (photo?.file) {
        URL.revokeObjectURL(photo.src);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handlePhotoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      addPhotos(event.target.files);
    }
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      addPhotos(event.dataTransfer.files);
    }
  };

  const openPhotoPicker = (event: MouseEvent) => {
    event.preventDefault();
    photoInputRef.current?.click();
  };

  return (
    <div className="tfcl-add-listing upload-photo">
      <h3>Upload Photo</h3>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handlePhotoInputChange}
      />
      <div
        className={`upload-media${isDragging ? " is-dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="inner">
          <a
            href="#"
            onClick={openPhotoPicker}
            aria-disabled={photos.length >= MAX_PHOTOS}
            style={
              photos.length >= MAX_PHOTOS ? { pointerEvents: "none", opacity: 0.6 } : undefined
            }
          >
            Select photos
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={14}
              viewBox="0 0 18 14"
              fill="none"
            >
              <path
                d="M0.875 10.125L5.17417 5.82583C5.34828 5.65172 5.55498 5.51361 5.78246 5.41938C6.00995 5.32515 6.25377 5.27665 6.5 5.27665C6.74623 5.27665 6.99005 5.32515 7.21754 5.41938C7.44502 5.51361 7.65172 5.65172 7.82583 5.82583L12.125 10.125M10.875 8.875L12.0492 7.70083C12.2233 7.52672 12.43 7.38861 12.6575 7.29438C12.885 7.20015 13.1288 7.15165 13.375 7.15165C13.6212 7.15165 13.865 7.20015 14.0925 7.29438C14.32 7.38861 14.5267 7.52672 14.7008 7.70083L17.125 10.125M2.125 13.25H15.875C16.2065 13.25 16.5245 13.1183 16.7589 12.8839C16.9933 12.6495 17.125 12.3315 17.125 12V2C17.125 1.66848 16.9933 1.35054 16.7589 1.11612C16.5245 0.881696 16.2065 0.75 15.875 0.75H2.125C1.79348 0.75 1.47554 0.881696 1.24112 1.11612C1.0067 1.35054 0.875 1.66848 0.875 2V12C0.875 12.3315 1.0067 12.6495 1.24112 12.8839C1.47554 13.1183 1.79348 13.25 2.125 13.25ZM10.875 3.875H10.8817V3.88167H10.875V3.875ZM11.1875 3.875C11.1875 3.95788 11.1546 4.03737 11.096 4.09597C11.0374 4.15458 10.9579 4.1875 10.875 4.1875C10.7921 4.1875 10.7126 4.15458 10.654 4.09597C10.5954 4.03737 10.5625 3.95788 10.5625 3.875C10.5625 3.79212 10.5954 3.71263 10.654 3.65403C10.7126 3.59542 10.7921 3.5625 10.875 3.5625C10.9579 3.5625 11.0374 3.59542 11.096 3.65403C11.1546 3.71263 11.1875 3.79212 11.1875 3.875Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <div className="desc">
            or drag photos here <br />
            <span>(Up to {MAX_PHOTOS} photos)</span>
          </div>
        </div>
      </div>
      {photos.length > 0 && (
        <div className="thumbnail-media">
          {photos.map((photo) => (
            <div className="item" key={photo.id}>
              <Image
                src={photo.src}
                alt="Listing photo"
                width={194}
                height={109}
                unoptimized={Boolean(photo.file)}
              />
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  removePhoto(photo.id);
                }}
                aria-label="Remove photo"
              >
                <DeleteIcon />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

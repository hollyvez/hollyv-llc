"use client";

import { useState } from "react";

interface CameoAvatarProps {
  gender: "man" | "woman";
  size?: number;
  dimmed?: boolean;
  photo?: string | null;
}

export default function CameoAvatar({ gender, size = 48, dimmed = false, photo }: CameoAvatarProps) {
  const [photoErr, setPhotoErr] = useState(false);
  const [cameoErr, setCameoErr] = useState(false);

  const cameoSrc = gender === "man" ? "/cameo-man.png" : "/cameo-woman.png";
  const showPhoto = photo && !photoErr;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        filter: dimmed ? "grayscale(100%) brightness(0.45)" : undefined,
      }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "cover" }}
          onError={() => setPhotoErr(true)}
        />
      ) : !cameoErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cameoSrc}
          alt={`${gender} cameo`}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "cover" }}
          onError={() => setCameoErr(true)}
        />
      ) : (
        <FallbackSilhouette gender={gender} size={size} />
      )}
    </div>
  );
}

function FallbackSilhouette({ gender, size }: { gender: "man" | "woman"; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#e8e0d0", overflow: "hidden" }}>
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#e8e0d0" />
        {/* Head */}
        <ellipse cx="50" cy="34" rx="18" ry="20" fill="#c8b89a" />
        {gender === "man" ? (
          /* Shoulders — square */
          <path d="M10 100 Q10 68 50 65 Q90 68 90 100Z" fill="#c8b89a" />
        ) : (
          /* Shoulders — softer */
          <path d="M15 100 Q15 72 50 68 Q85 72 85 100Z" fill="#c8b89a" />
        )}
      </svg>
    </div>
  );
}

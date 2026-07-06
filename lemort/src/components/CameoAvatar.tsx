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
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#e8e0d0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #d4af37",
        fontSize: size * 0.4,
      }}
    >
      {gender === "man" ? "🎩" : "🪞"}
    </div>
  );
}

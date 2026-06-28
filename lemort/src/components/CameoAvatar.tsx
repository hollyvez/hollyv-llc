"use client";

import { useState } from "react";

interface CameoAvatarProps {
  gender: "man" | "woman";
  size?: number;
  dimmed?: boolean;
}

export default function CameoAvatar({ gender, size = 48, dimmed = false }: CameoAvatarProps) {
  const [err, setErr] = useState(false);
  const src = gender === "man" ? "/cameo-man.png" : "/cameo-woman.png";

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
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${gender} cameo`}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "cover" }}
          onError={() => setErr(true)}
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

/** Initials avatar for public figures without a confirmed photo */
export function InitialsAvatar({
  name,
  size = 48,
  dimmed = false,
}: {
  name: string;
  size?: number;
  dimmed?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: dimmed ? "#3a3830" : "#e8e4dc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        filter: dimmed ? "grayscale(100%) brightness(0.45)" : undefined,
        fontSize: size * 0.33,
        fontWeight: 600,
        color: "#5a5850",
      }}
    >
      {initials}
    </div>
  );
}

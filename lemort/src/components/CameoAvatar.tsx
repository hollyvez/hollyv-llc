import Image from "next/image";

interface CameoAvatarProps {
  gender: "man" | "woman";
  size?: number;
  dimmed?: boolean;
}

export default function CameoAvatar({ gender, size = 48, dimmed = false }: CameoAvatarProps) {
  const src = gender === "man" ? "/cameo-man.png" : "/cameo-woman.png";

  return (
    <div
      style={{
        width: size,
        height: size * 1.15,
        position: "relative",
        flexShrink: 0,
        filter: dimmed ? "grayscale(100%) brightness(0.45)" : undefined,
      }}
    >
      {/* Gold oval frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #d4af37, #a8871a, #f0d060, #a8871a)",
          padding: 3,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#e8e0d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={src}
            alt={`${gender} cameo silhouette`}
            fill
            className="object-cover"
            unoptimized
            onError={() => {}}
          />
          {/* Fallback SVG silhouette shown via CSS if img fails */}
        </div>
      </div>
    </div>
  );
}

/** Inline initials avatar for famous people without a photo */
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
        color: dimmed ? "#5a5850" : "#5a5850",
      }}
    >
      {initials}
    </div>
  );
}

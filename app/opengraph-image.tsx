import { ImageResponse } from "next/og";

export const alt = "zenstart: a calm foundation for your next app";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "96px",
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <svg
          fill="none"
          height="64"
          viewBox="0 0 32 32"
          width="64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.7 8.6a10.2 10.2 0 1 0 6 7.6"
            stroke="#fafafa"
            strokeLinecap="round"
            strokeWidth="2.6"
          />
        </svg>
        <div
          style={{ display: "flex", fontSize: 40, letterSpacing: "-0.02em" }}
        >
          <div>zen</div>
          <div style={{ color: "#8f8f8f" }}>start</div>
        </div>
      </div>
      <div
        style={{
          marginTop: "48px",
          display: "flex",
          flexDirection: "column",
          fontSize: 76,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
        }}
      >
        <div>A calm foundation</div>
        <div>for your next app.</div>
      </div>
      <div style={{ marginTop: "40px", fontSize: 30, color: "#8f8f8f" }}>
        Next.js 16 · React 19 · Tailwind v4 · Turborepo
      </div>
    </div>,
    size
  );
}

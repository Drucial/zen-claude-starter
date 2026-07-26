import { ImageResponse } from "next/og";

// iOS ignores transparency and rounds the corners itself, so this draws the
// mark on an opaque square rather than reusing icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <svg
        fill="none"
        height="112"
        viewBox="0 0 32 32"
        width="112"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.7 8.6a10.2 10.2 0 1 0 6 7.6"
          stroke="#fafafa"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </svg>
    </div>,
    size
  );
}

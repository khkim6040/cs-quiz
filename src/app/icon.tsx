import { ImageResponse } from "next/og";

// 구글 검색 결과 아이콘은 48px 배수의 실제 이미지 URL이 필요 (data URI 불가)
export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 96,
          height: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          background: "linear-gradient(135deg, rgb(251,146,60), rgb(245,158,11))",
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40.3 71h19.5M50 12.5v4.2m26.5 6.8l-3 3M87.5 50h-4.2M16.7 50h-4.2M27.6 23.6l-3-3m11.8 41.2a20.8 20.8 0 1129.5 0l-2.3 2.3a14 14 0 00-4.1 9.9v2.2a8.3 8.3 0 11-16.7 0V77a14 14 0 00-4.1-9.9l-2.3-2.3z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

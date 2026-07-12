import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "김덕진 답변 연대기 V3 | 답은 바뀌었다, 기록은 남는다";
  const description = "김덕진 출연 69편을 60개 질문으로 다시 연결해 당시 핵심 논점, 달라진 점, 현재 종합 관점을 원본 영상과 함께 보여주는 AI 답변 연대기입니다.";
  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: new URL("/og.png", base).toString(), width: 1728, height: 910, alt: "김덕진 답변 연대기 V3 — 답은 바뀌었다, 기록은 남는다" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

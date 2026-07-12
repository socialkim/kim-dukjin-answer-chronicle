import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "김덕진 답변 연대기 | 같은 질문, 달라진 답";
  const description = "김덕진 출연 69편·23시간 33분의 한국어 자막과 근거 시점을 전수 조사하고, 같은 AI 질문에 대한 답의 변화를 추적합니다.";
  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: new URL("/og-corpus-69.png", base).toString(), width: 1728, height: 910, alt: "김덕진 답변 연대기 69편 전수조사" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og-corpus-69.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

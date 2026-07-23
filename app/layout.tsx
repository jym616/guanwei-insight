import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "观微 Insight · 用户声音智能平台",
  description: "自动汇总竞品与自家产品的公开用户评论，生成可行动的产品洞察与日报周报。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

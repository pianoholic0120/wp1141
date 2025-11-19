import './globals.css';

export const metadata = {
  title: 'Opentix 演唱會購票小幫手 - Line AI Chatbot',
  description: '智能演唱會購票客服系統，協助您搜尋演出、查詢票價、解答購票疑問',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}

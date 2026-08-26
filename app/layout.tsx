 import "./globals.css";

export const metadata = {
  title: "Taşkent Cafe",
  description: "Taşkent Cafe Menü ve Sadakat Kulübü",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
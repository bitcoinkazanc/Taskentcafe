import "./globals.css";
import BottomNav from "../components/BottomNav";

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
      <body>
        {children}

        <BottomNav />
      </body>
    </html>
  );
}
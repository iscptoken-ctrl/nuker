import "./globals.css";

export const metadata = {
  title: "Nuker",
  description: "Elemental survival game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b1020" }}>
        {children}
      </body>
    </html>
  );
}

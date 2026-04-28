import "./globals.css";

export const metadata = {
  title: "MumzVoice",
  description: "AI voice and natural language search prototype for Mumzworld"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

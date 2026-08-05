import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Lash Studio",
  description: "Gestão financeira e operacional para lash designers",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f5f5b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${instrumentSans.variable} ${plusJakartaSans.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { THEME_COLOR } from "../theme/tokens";
import { RegistrarServiceWorker } from "../components/pwa/RegistrarServiceWorker";

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
  title: "Nico",
  applicationName: "Nico",
  description: "Gestão financeira e operacional para lash designers",
  appleWebApp: { capable: true, title: "Nico", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
};

export default function RootLayout({ children }) {
  // `suppressHydrationWarning` porque extensões do navegador (tema escuro,
  // tradução) acrescentam classes ao <html> antes de o React hidratar — o erro
  // sumia na aba anônima e num navegador limpo. Vale só para os atributos
  // desta tag: divergência real dentro das páginas continua sendo acusada.
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSans.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          {children}
        </Providers>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}

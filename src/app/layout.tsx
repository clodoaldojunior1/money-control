import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeContext } from "@/context/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeContext value={"light"}>
          <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
        </ThemeContext>
      </body>
    </html>
  );
}

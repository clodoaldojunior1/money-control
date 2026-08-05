"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ColorModeProvider } from "../context/ColorModeProvider";
import { AppDataProvider } from "../context/AppDataProvider";

export function Providers({ children }) {
  return (
    <AppRouterCacheProvider>
      <ColorModeProvider>
        <AppDataProvider>{children}</AppDataProvider>
      </ColorModeProvider>
    </AppRouterCacheProvider>
  );
}

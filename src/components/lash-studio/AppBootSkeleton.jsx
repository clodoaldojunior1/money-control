"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import { LARGURA_APP } from "./AppShell";

/**
 * Mostrado no HTML pré-renderizado, antes de a data do cliente ser conhecida
 * (ver `useHoje`). Reproduz a moldura do app para a troca não dar salto.
 */
export function AppBootSkeleton() {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <Box sx={{ minHeight: "100dvh", backgroundColor: t.pageBg, display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: LARGURA_APP,
          minHeight: "100dvh",
          backgroundColor: t.bg,
          px: 2.75,
          pt: 2.25,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 3 }}>
          <Skeleton variant="rounded" width={42} height={42} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="35%" height={26} />
          </Box>
          <Skeleton variant="rounded" width={42} height={42} />
          <Skeleton variant="rounded" width={42} height={42} />
        </Stack>

        <Stack spacing={1.75}>
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />
          <Stack direction="row" spacing={1.5}>
            <Skeleton variant="rounded" height={104} sx={{ flex: 1, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={104} sx={{ flex: 1, borderRadius: 2 }} />
          </Stack>
          <Skeleton variant="rounded" height={62} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" height={62} sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
    </Box>
  );
}

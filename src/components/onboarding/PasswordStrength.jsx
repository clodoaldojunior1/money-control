"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const ROTULOS = [
  "Use 8 caracteres ou mais.",
  "Senha fraca — misture maiúsculas e minúsculas.",
  "Senha média — adicione um número ou símbolo.",
  "Senha forte.",
];

/** 0 a 3. Cada critério atendido vale um ponto; senha vazia é sempre 0. */
export function forcaDaSenha(senha) {
  if (!senha) return 0;
  let n = 0;
  if (senha.length >= 8) n += 1;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) n += 1;
  if (/[0-9]|[^A-Za-z0-9]/.test(senha)) n += 1;
  return n;
}

export function PasswordStrength({ senha }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  const forca = forcaDaSenha(senha);
  const cores = [t.danger, "#c98a2e", t.accent];

  return (
    <Box>
      <Stack direction="row" spacing={0.6}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: i < forca ? cores[forca - 1] : t.divider,
              transition: "background-color .2s ease",
            }}
          />
        ))}
      </Stack>
      <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.75 }}>{ROTULOS[forca]}</Typography>
    </Box>
  );
}

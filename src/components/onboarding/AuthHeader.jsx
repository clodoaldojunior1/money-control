"use client";

import Link from "next/link";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import { HeaderIconButton } from "../lash-studio/ui/HeaderIconButton";

/** Topo das telas de autenticação: voltar à landing + atalho para a outra tela. */
export function AuthHeader({ atalhoHref, atalhoLabel }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 3, pt: 3.25 }}>
      <HeaderIconButton component={Link} href="/" aria-label="Voltar">
        <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
      </HeaderIconButton>
      <Button component={Link} href={atalhoHref} sx={{ fontSize: 13 }}>{atalhoLabel}</Button>
    </Stack>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import { useTheme } from "@mui/material/styles";
import { PublicShell } from "./PublicShell";
import { AuthHeader } from "./AuthHeader";
import { BrandMark } from "./BrandMark";
import { FormTextField } from "../lash-studio/ui/form/FormTextField";
import { FormPasswordField } from "../lash-studio/ui/form/FormPasswordField";
import { FormCheckbox } from "../lash-studio/ui/form/FormCheckbox";

const EMAIL_VALIDO = /\S+@\S+\.\S+/;

export function Login() {
  const router = useRouter();
  const { custom } = useTheme();
  const t = custom.tokens;

  const { control, handleSubmit } = useForm({
    defaultValues: { email: "", senha: "", manterConectada: true },
  });

  // Sem backend ainda: valida o formulário e entra direto no app.
  const entrar = () => router.push("/app");

  return (
    <PublicShell>
      <AuthHeader atalhoHref="/cadastro" atalhoLabel="Criar conta" />

      <Stack sx={{ flex: 1, justifyContent: "center", px: 3, pb: 4.25 }}>
        <Box sx={{ mb: 2.5 }}>
          <BrandMark size={52} radius={15} fontSize={22} />
        </Box>

        <Typography component="h1" sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.15 }}>
          Bem-vinda de volta
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: "text.secondary", mt: 1, mb: 3.25 }}>
          Entre para ver o resumo do seu mês.
        </Typography>

        <Stack spacing={2}>
          <FormTextField
            control={control}
            name="email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@studio.com"
            reserveHelperText
            rules={{
              required: "Informe seu e-mail.",
              pattern: { value: EMAIL_VALIDO, message: "E-mail inválido." },
            }}
          />

          <FormPasswordField
            control={control}
            name="senha"
            label="Senha"
            autoComplete="current-password"
            placeholder="••••••••"
            rules={{
              required: "Informe sua senha.",
              minLength: { value: 6, message: "A senha tem no mínimo 6 caracteres." },
            }}
          />

          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between", mt: -1 }}>
            <FormCheckbox control={control} name="manterConectada" label="Manter conectada" />
            <MuiLink href="#" underline="hover" sx={{ fontSize: 13, fontWeight: 600 }}>Esqueci a senha</MuiLink>
          </Stack>

          <Button variant="contained" onClick={handleSubmit(entrar)} sx={{ py: 1.9, fontSize: 15 }}>
            Entrar
          </Button>

          <Divider sx={{ "&::before, &::after": { borderColor: t.divider } }}>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>ou</Typography>
          </Divider>

          <Button variant="outlined" startIcon={<LanguageRoundedIcon />} sx={{ py: 1.6, fontSize: 14 }}>
            Continuar com Google
          </Button>
        </Stack>

        <Typography sx={{ fontSize: 13, textAlign: "center", color: "text.secondary", mt: 3 }}>
          Não tem conta?{" "}
          <MuiLink component={Link} href="/cadastro" underline="hover" sx={{ fontWeight: 600 }}>Cadastre-se</MuiLink>
        </Typography>
      </Stack>
    </PublicShell>
  );
}

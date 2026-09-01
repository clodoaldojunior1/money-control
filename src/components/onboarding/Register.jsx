"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MuiLink from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";
import { PublicShell } from "./PublicShell";
import { AuthHeader } from "./AuthHeader";
import { PasswordStrength } from "./PasswordStrength";
import { FormTextField } from "../lash-studio/ui/form/FormTextField";
import { FormPasswordField } from "../lash-studio/ui/form/FormPasswordField";
import { FormSegmented } from "../lash-studio/ui/form/FormSegmented";
import { FormCheckbox } from "../lash-studio/ui/form/FormCheckbox";

const EMAIL_VALIDO = /\S+@\S+\.\S+/;

const VOLUME_OPTIONS = [
  { value: "até 10", label: "até 10" },
  { value: "10 a 25", label: "10 a 25" },
  { value: "25+", label: "25+" },
];

export function Register() {
  const { custom } = useTheme();
  const t = custom.tokens;

  const { control, handleSubmit } = useForm({
    defaultValues: {
      nome: "", studio: "", email: "", whatsapp: "", senha: "",
      volume: "10 a 25", termos: false,
    },
  });

  const senha = useWatch({ control, name: "senha" });

  const [recusado, setRecusado] = useState(false);

  /**
   * O cadastro está **fechado** (ARCHITECTURE 6.1): por ora a conta é só do
   * dono, criada pelo `yarn db:seed`. A tela continua aqui porque o desenho
   * está pronto e volta a valer quando abrir — o que muda é o desfecho.
   *
   * A recusa acontece depois da validação, de propósito: quem preenche errado
   * vê o erro do campo, não uma negativa genérica.
   */
  const criarConta = () => setRecusado(true);

  return (
    <PublicShell>
      <AuthHeader atalhoHref="/login" atalhoLabel="Entrar" />

      <Box sx={{ px: 3, pt: 2.5, pb: 5 }}>
        {/* Progresso do onboarding */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2.25 }}>
          <Box sx={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: t.accent }} />
          <Box sx={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: t.accent }} />
          <Box sx={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: t.divider }} />
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", ml: 0.5 }}>2 de 3</Typography>
        </Stack>

        <Typography component="h1" sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, lineHeight: 1.15 }}>
          Criar sua conta
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: "text.secondary", mt: 1, mb: 3 }}>
          Leva menos de um minuto. Você pode configurar os módulos depois.
        </Typography>

        <Stack spacing={2}>
          <FormTextField
            control={control}
            name="nome"
            label="Nome completo"
            autoComplete="name"
            placeholder="Como suas clientes te chamam"
            reserveHelperText
            rules={{ validate: (v) => v.trim().length > 0 || "Informe seu nome." }}
          />

          <FormTextField
            control={control}
            name="studio"
            label="Nome do studio"
            placeholder="Ex.: Manu Lashes"
          />

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

          <FormTextField
            control={control}
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="(41) 90000-0000"
          />

          <Box>
            <FormPasswordField
              control={control}
              name="senha"
              label="Senha"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              reserveHelperText={false}
              rules={{
                required: "Crie uma senha.",
                minLength: { value: 8, message: "A senha tem no mínimo 8 caracteres." },
              }}
            />
            <Box sx={{ mt: 1 }}>
              <PasswordStrength senha={senha} />
            </Box>
          </Box>

          <FormSegmented
            control={control}
            name="volume"
            label="Quantas clientes você atende por semana?"
            options={VOLUME_OPTIONS}
          />

          <FormCheckbox
            control={control}
            name="termos"
            alignTop
            rules={{ required: "É preciso aceitar os termos para continuar." }}
            label={
              <span>
                Aceito os <MuiLink href="#" underline="hover">Termos de uso</MuiLink> e a{" "}
                <MuiLink href="#" underline="hover">Política de privacidade</MuiLink>.
              </span>
            }
          />

          {recusado && (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              O cadastro ainda não está aberto — por enquanto o Lash Studio tem
              uma conta só. Se a sua já existe,{" "}
              <MuiLink component={Link} href="/login" underline="hover" sx={{ fontWeight: 600 }}>entre por aqui</MuiLink>.
            </Alert>
          )}

          <Button variant="contained" onClick={handleSubmit(criarConta)} sx={{ py: 1.9, fontSize: 15 }}>
            Criar conta e começar
          </Button>

          <Typography sx={{ fontSize: 12, textAlign: "center", color: "text.secondary" }}>
            Teste de 14 dias. Cancele quando quiser.
          </Typography>

          <Typography sx={{ fontSize: 13, textAlign: "center", color: "text.secondary" }}>
            Já tem conta?{" "}
            <MuiLink component={Link} href="/login" underline="hover" sx={{ fontWeight: 600 }}>Entrar</MuiLink>
          </Typography>
        </Stack>
      </Box>
    </PublicShell>
  );
}

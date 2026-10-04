"use client";

import { useMemo } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { FormTextField } from "../ui/form/FormTextField";
import { FormPasswordField } from "../ui/form/FormPasswordField";
import { PasswordStrength } from "../../onboarding/PasswordStrength";

const LIMITE = 80;
const cabe = (v) => v.trim().length <= LIMITE || `No máximo ${LIMITE} caracteres.`;

function Secao({ titulo, descricao, children }) {
  return (
    <Card variant="outlined" sx={{ p: 2.25, gap: 2, display: "flex", flexDirection: "column", border: "none" }}>
      <Box>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17 }}>{titulo}</Typography>
        {descricao && <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>{descricao}</Typography>}
      </Box>
      {children}
    </Card>
  );
}

/**
 * O perfil exibido no app. `values` (e não `defaultValues`) porque a conta vem
 * do servidor: depois de salvar — ou de desfazer — o `revalidatePath` traz a
 * versão nova, e o formulário volta a ela sozinho, já sem alteração pendente.
 */
function PerfilForm() {
  const { conta, salvarPerfil, salvando } = useAppData();

  const values = useMemo(
    () => ({ nome: conta.nome, studio: conta.studio ?? "", whatsapp: conta.whatsapp ?? "" }),
    [conta.nome, conta.studio, conta.whatsapp],
  );
  const { control, handleSubmit } = useForm({ values });
  const { isDirty } = useFormState({ control });

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit(salvarPerfil)}>
      <FormTextField
        control={control}
        name="nome"
        label="Seu nome"
        autoComplete="name"
        reserveHelperText
        rules={{ validate: { preenchido: (v) => v.trim().length > 0 || "Informe seu nome.", cabe } }}
      />
      <FormTextField control={control} name="studio" label="Nome do studio" placeholder="Ex.: Manu Lashes" rules={{ validate: cabe }} />
      <FormTextField
        control={control}
        name="whatsapp"
        label="WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(41) 90000-0000"
        rules={{ validate: cabe }}
      />
      <Button type="submit" variant="contained" disabled={!isDirty || salvando} sx={{ py: 1.5 }}>
        Salvar perfil
      </Button>
    </Stack>
  );
}

const SENHA_VAZIA = { atual: "", nova: "", confirmacao: "" };

function SenhaForm() {
  const { conta, trocarSenha, salvando } = useAppData();
  const { control, handleSubmit, reset } = useForm({ defaultValues: SENHA_VAZIA });
  const nova = useWatch({ control, name: "nova" });

  // Limpa só no sucesso: com erro (senha atual errada), o que foi digitado fica.
  const enviar = (v) => trocarSenha(v, () => reset(SENHA_VAZIA));

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit(enviar)}>
      {/* Para o gerenciador de senhas saber de qual conta é a senha nova. */}
      <input type="email" name="username" autoComplete="username" value={conta.email} readOnly hidden />
      <FormPasswordField
        control={control}
        name="atual"
        label="Senha atual"
        autoComplete="current-password"
        rules={{ required: "Informe a senha atual." }}
      />
      <Box>
        <FormPasswordField
          control={control}
          name="nova"
          label="Nova senha"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          reserveHelperText={false}
          rules={{
            required: "Crie uma senha nova.",
            minLength: { value: 8, message: "A senha tem no mínimo 8 caracteres." },
          }}
        />
        <Box sx={{ mt: 1 }}>
          <PasswordStrength senha={nova} />
        </Box>
      </Box>
      <FormPasswordField
        control={control}
        name="confirmacao"
        label="Repita a nova senha"
        autoComplete="new-password"
        rules={{ validate: (v, form) => v === form.nova || "As senhas não conferem." }}
      />
      <Button type="submit" variant="outlined" disabled={salvando} sx={{ py: 1.5 }}>
        Trocar senha
      </Button>
    </Stack>
  );
}

export function ConfigTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { conta } = useAppData();

  return (
    <Stack spacing={1.75}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: 22 }}>Configurações</Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Sua conta e o seu studio</Typography>
      </Box>

      <Card variant="outlined" sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, p: 2.25, border: "none" }}>
        <Avatar sx={{ width: 46, height: 46, bgcolor: t.accent, color: t.onAccent, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {conta.nome.trim()[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>E-mail de acesso</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}>{conta.email}</Typography>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>É o seu login, e não muda por aqui.</Typography>
        </Box>
      </Card>

      <Secao titulo="Perfil" descricao="Como o app te cumprimenta e apresenta o studio.">
        <PerfilForm />
      </Secao>

      <Secao titulo="Senha" descricao="Os aparelhos em que você já entrou continuam conectados.">
        <SenhaForm />
      </Secao>

      {/* Lugar reservado: renomear e desativar serviços entra aqui (6.4). */}
      <Card variant="outlined" sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, p: 2.25, border: "none" }}>
        <SpaRoundedIcon sx={{ fontSize: 22, color: t.neutral[500] }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17 }}>Serviços</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Renomear e desativar serviços do catálogo</Typography>
        </Box>
        <Chip label="Em breve" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: t.neutral[100], color: t.neutral[800] }} />
      </Card>
    </Stack>
  );
}

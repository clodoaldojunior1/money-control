"use client";

import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { DURATIONS, STATUSES } from "../../../data/dominio";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";
import { FormServicoField } from "../ui/form/FormServicoField";
import { FormOptionGroup } from "../ui/form/FormOptionGroup";

const DUR_OPTIONS = DURATIONS.map((d) => ({ value: d, label: d }));
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: s }));

const toDefaults = (ag, hoje) => (ag
  ? { name: ag.name, service: ag.servicoId, date: ag.date, hour: ag.hour, dur: ag.dur, status: ag.status, value: String(ag.value) }
  : { name: "", service: "", date: hoje, hour: "09:00", dur: "2h", status: "Confirmado", value: "" });

export function AgendaSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveAgenda, removeAgenda, closeSheet, hoje, salvando, servicos } = useAppData();

  const { control, handleSubmit, getValues, setValue } = useForm({ defaultValues: toDefaults(editing, hoje) });

  /**
   * Escolher o serviço sugere valor e duração dele — e, como na entrada, nunca
   * por cima do que já estava preenchido por ela.
   *
   * Aqui não há convite para fixar preço: agendamento é previsão, e o preço
   * padrão deve nascer do que foi de fato cobrado.
   */
  function aoTrocarServico(novoId, anteriorId) {
    const anterior = servicos.find((s) => s.id === anteriorId);
    const novo = servicos.find((s) => s.id === novoId);

    const valorAtual = getValues("value");
    const valorVeioDeSugestao = anterior?.precoPadrao != null && valorAtual === String(anterior.precoPadrao);
    if ((!valorAtual || valorVeioDeSugestao) && novo?.precoPadrao != null) {
      setValue("value", String(novo.precoPadrao));
    }

    // A duração nunca está vazia (o formulário abre com "2h"), então o critério
    // é só não sobrescrever uma escolha diferente da sugestão anterior.
    const duracaoAtual = getValues("dur");
    const duracaoVeioDeSugestao = !anterior || duracaoAtual === anterior.duracaoPadrao || duracaoAtual === "2h";
    if (duracaoVeioDeSugestao && novo?.duracaoPadrao) {
      setValue("dur", novo.duracaoPadrao);
    }
  }

  return (
    <SheetFrame title={isEdit ? "Editar agendamento" : "Novo agendamento"} onClose={closeSheet}>
      <FormTextField
        control={control}
        name="name"
        label="Cliente"
        placeholder="Nome da cliente"
        autoFocus
        reserveHelperText
        rules={{ validate: (v) => v.trim().length > 0 || "Informe o nome da cliente." }}
      />

      <FormServicoField
        control={control}
        name="service"
        label="Serviço"
        onAfterChange={aoTrocarServico}
        rules={{ required: "Escolha ou crie um serviço." }}
      />

      <Stack direction="row" spacing={1.5}>
        <FormTextField
          control={control}
          name="date"
          label="Data"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormTextField
          control={control}
          name="hour"
          label="Início"
          type="time"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <FormSegmented control={control} name="dur" label="Duração" options={DUR_OPTIONS} />

      <FormMoneyField control={control} name="value" label="Valor do serviço" />

      <FormOptionGroup control={control} name="status" label="Status" options={STATUS_OPTIONS} />

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {isEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeAgenda}
            disabled={salvando}
            aria-label="Cancelar agendamento"
            sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} disabled={salvando} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(saveAgenda)} disabled={salvando} sx={{ flex: 2 }}>
          {salvando ? "Salvando…" : "Salvar agendamento"}
        </Button>
      </Stack>
    </SheetFrame>
  );
}

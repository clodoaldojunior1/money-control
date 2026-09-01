"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition } from "react";
import { BRL } from "../data/dominio";
import { noPeriodo, periodoAnterior, periodoDe, periodoSeguinte } from "../lib/periodo";
import { criarEntrada, atualizarEntrada, excluirEntrada } from "../actions/entradas";
import { criarGasto, atualizarGasto, excluirGasto } from "../actions/gastos";
import { criarMaterial, atualizarMaterial, excluirMaterial } from "../actions/materiais";
import { criarAgendamento, atualizarAgendamento, excluirAgendamento } from "../actions/agenda";
import { restaurarExemplo as restaurarExemploNoBanco, substituirDados } from "../actions/conta";

const AppDataContext = createContext(null);

/**
 * Tradutores entre as três formas que um registro assume: a do formulário, a
 * da tela e a das ações.
 *
 * `de*Formulario` prepara o que a usuária acabou de digitar; `de*Registro`
 * remonta os mesmos campos a partir do que está na tela, e existe para o
 * desfazer — voltar uma edição é regravar o registro anterior, e recriar um
 * excluído é gravá-lo de novo com o mesmo id.
 */
const entradaDeFormulario = (v) => ({ cliente: v.client, servico: v.service, metodo: v.method, data: v.date, valor: v.value });
const entradaDeRegistro = (e) => ({ cliente: e.client, servico: e.service, metodo: e.method, data: e.iso, valor: e.value });

const gastoDeFormulario = (v) => ({ titulo: v.desc, tipo: v.tipo, subtipo: v.sub, data: v.data, valor: v.valor });
const gastoDeRegistro = (g) => ({ titulo: g.title, tipo: g.tipo, subtipo: g.sub, data: g.iso, valor: g.value });

const materialDeFormulario = (v) => ({ nome: v.name, quantidade: v.qty, unidade: v.unit, custo: v.cost, minimo: v.min, compradoEm: v.date });
const materialDeRegistro = (m) => ({ nome: m.name, quantidade: m.qty, unidade: m.unit, custo: m.cost, minimo: m.min, compradoEm: m.iso });

const agendamentoDeFormulario = (v) => ({ cliente: v.name, servico: v.service, data: v.date, hora: v.hour, duracao: v.dur, status: v.status, valor: v.value });
const agendamentoDeRegistro = (a) => ({ cliente: a.name, servico: a.service, data: a.date, hora: a.hour, duracao: a.dur, status: a.status, valor: a.value });

const comId = (registro, converter) => ({ id: registro.id, ...converter(registro) });

// Qual sheet o FAB abre em cada aba. Na Home o padrão é registrar entrada —
// é a ação mais frequente de quem acabou de atender uma cliente.
const SHEET_POR_ABA = {
  home: "entrada",
  entradas: "entrada",
  gastos: "gasto",
  materiais: "material",
  agenda: "agenda",
};

/**
 * Estado do app. Os **dados** não estão aqui.
 *
 * `dados` chega do servidor a cada render (`src/server/leitura.js`) e é usado
 * direto, sem `useState`. Isso não é detalhe de estilo: as ações terminam em
 * `revalidatePath("/app")`, o servidor re-renderiza e manda a versão nova por
 * prop — e um `useState` inicializado uma vez ignoraria tudo isso, deixando a
 * tela parada num retrato antigo. Copiar para o estado traria de volta os dois
 * donos que a etapa 2 acabou de eliminar.
 *
 * O que continua sendo estado é o que só o cliente sabe: aba, sheet aberto,
 * período, filtro, snackbar.
 *
 * `hoje` vem do cliente, resolvido antes da montagem (ver `AppRoot`).
 */
export function AppDataProvider({ children, hoje, dados }) {
  const { conta, items, materiais, agendamentos } = dados;

  const [periodo, setPeriodo] = useState(() => periodoDe(hoje));

  const [tab, setTab] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [snack, setSnack] = useState(null);
  const snackTimer = useRef(null);

  // Qual sheet está aberto e qual registro ele edita (null = criação).
  // Só um sheet abre por vez, então um único `editing` cobre as 4 entidades.
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null);

  const [salvando, iniciarTransicao] = useTransition();

  const money = useCallback((n) => BRL(n), []);

  const toast = useCallback((text, undo) => {
    setSnack({ text, undo });
    clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(null), 4200);
  }, []);

  const undo = useCallback(() => {
    if (snack?.undo) snack.undo();
    setSnack(null);
  }, [snack]);

  /**
   * Executa uma ação do servidor e trata o resultado.
   *
   * A transição é o que mantém `salvando` verdadeiro **até a tela já ter os
   * dados novos** — ela cobre a ida ao banco e a re-renderização que o
   * `revalidatePath` provoca. Fechar o sheet antes disso mostraria por um
   * instante a lista sem o registro recém-salvo.
   *
   * Decisão registrada em 6.1: esperar a resposta em vez de atualizar
   * otimisticamente. São 100–200ms, e evita reconciliar ids temporários.
   */
  const executar = useCallback((acao, aoConcluir) => {
    iniciarTransicao(async () => {
      const resultado = await acao();
      if (resultado?.erro) {
        toast(resultado.erro);
        return;
      }
      aoConcluir?.(resultado);
    });
  }, [toast]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setEditing(null);
  }, []);

  const openSheet = useCallback((kind, record) => {
    setSheet(kind);
    setEditing(record ?? null);
    setDrawerOpen(false);
  }, []);

  const openGasto = useCallback((item) => openSheet("gasto", item), [openSheet]);
  const openAgenda = useCallback((ag) => openSheet("agenda", ag), [openSheet]);
  const openEntrada = useCallback((it) => openSheet("entrada", it), [openSheet]);
  const openMaterial = useCallback((m) => openSheet("material", m), [openSheet]);

  // — gastos —
  const saveGasto = useCallback((values) => {
    if (editing) {
      const anterior = editing;
      executar(() => atualizarGasto(anterior.id, gastoDeFormulario(values)), () => {
        closeSheet();
        toast("Gasto atualizado", () =>
          executar(() => atualizarGasto(anterior.id, gastoDeRegistro(anterior))));
      });
      return;
    }
    executar(() => criarGasto(gastoDeFormulario(values)), ({ id }) => {
      closeSheet();
      toast(`Gasto de ${BRL(Number(values.valor))} salvo`, () => executar(() => excluirGasto(id)));
    });
  }, [editing, closeSheet, toast, executar]);

  const removeGasto = useCallback(() => {
    const anterior = editing;
    if (!anterior) return;
    executar(() => excluirGasto(anterior.id), () => {
      closeSheet();
      // Recria com o mesmo id: o registro que volta é o mesmo, não um sósia.
      toast("Gasto excluído", () => executar(() => criarGasto(comId(anterior, gastoDeRegistro))));
    });
  }, [editing, closeSheet, toast, executar]);

  // — agenda —
  const saveAgenda = useCallback((values) => {
    if (editing) {
      const anterior = editing;
      executar(() => atualizarAgendamento(anterior.id, agendamentoDeFormulario(values)), () => {
        closeSheet();
        toast("Agendamento atualizado", () =>
          executar(() => atualizarAgendamento(anterior.id, agendamentoDeRegistro(anterior))));
      });
      return;
    }
    executar(() => criarAgendamento(agendamentoDeFormulario(values)), ({ id }) => {
      closeSheet();
      toast(`${values.name.trim()} agendada às ${values.hour}`, () =>
        executar(() => excluirAgendamento(id)));
    });
  }, [editing, closeSheet, toast, executar]);

  const removeAgenda = useCallback(() => {
    const anterior = editing;
    if (!anterior) return;
    executar(() => excluirAgendamento(anterior.id), () => {
      closeSheet();
      toast("Agendamento cancelado", () =>
        executar(() => criarAgendamento(comId(anterior, agendamentoDeRegistro))));
    });
  }, [editing, closeSheet, toast, executar]);

  // — entradas —
  const saveEntrada = useCallback((values) => {
    if (editing) {
      const anterior = editing;
      executar(() => atualizarEntrada(anterior.id, entradaDeFormulario(values)), () => {
        closeSheet();
        toast("Entrada atualizada", () =>
          executar(() => atualizarEntrada(anterior.id, entradaDeRegistro(anterior))));
      });
      return;
    }
    executar(() => criarEntrada(entradaDeFormulario(values)), ({ id }) => {
      closeSheet();
      toast(`Entrada de ${BRL(Number(values.value))} registrada`, () =>
        executar(() => excluirEntrada(id)));
    });
  }, [editing, closeSheet, toast, executar]);

  const removeEntrada = useCallback(() => {
    const anterior = editing;
    if (!anterior) return;
    executar(() => excluirEntrada(anterior.id), () => {
      closeSheet();
      toast("Entrada excluída", () =>
        executar(() => criarEntrada(comId(anterior, entradaDeRegistro))));
    });
  }, [editing, closeSheet, toast, executar]);

  // — materiais —
  const saveMaterial = useCallback((values) => {
    if (editing) {
      const anterior = editing;
      executar(() => atualizarMaterial(anterior.id, materialDeFormulario(values)), () => {
        closeSheet();
        toast("Material atualizado", () =>
          executar(() => atualizarMaterial(anterior.id, materialDeRegistro(anterior))));
      });
      return;
    }
    executar(() => criarMaterial(materialDeFormulario(values)), ({ id }) => {
      closeSheet();
      toast(`Material lançado nos gastos: ${BRL(Number(values.cost))}`, () =>
        executar(() => excluirMaterial(id)));
    });
  }, [editing, closeSheet, toast, executar]);

  const removeMaterial = useCallback(() => {
    const anterior = editing;
    if (!anterior) return;
    executar(() => excluirMaterial(anterior.id), () => {
      closeSheet();
      toast("Material excluído", () =>
        executar(() => criarMaterial(comId(anterior, materialDeRegistro))));
    });
  }, [editing, closeSheet, toast, executar]);

  /**
   * Volta aos dados de exemplo. Destrutivo, e o desfazer é o retrato que já
   * está na tela — é o cliente que tem o "antes" (ver `src/actions/conta.js`).
   */
  const restaurarExemplo = useCallback(() => {
    const retrato = {
      entradas: items.filter((i) => i.kind === "in").map((e) => comId(e, entradaDeRegistro)),
      gastos: items.filter((i) => i.kind === "out").map((g) => comId(g, gastoDeRegistro)),
      materiais: materiais.map((m) => comId(m, materialDeRegistro)),
      agendamentos: agendamentos.map((a) => comId(a, agendamentoDeRegistro)),
    };
    setDrawerOpen(false);
    executar(() => restaurarExemploNoBanco(hoje), () => {
      toast("Dados de exemplo restaurados", () => executar(() => substituirDados(retrato)));
    });
  }, [items, materiais, agendamentos, hoje, toast, executar]);

  const contextualSheet = SHEET_POR_ABA[tab] ?? "entrada";

  const openContextualSheet = useCallback(() => {
    openSheet(SHEET_POR_ABA[tab] ?? "entrada", null);
  }, [tab, openSheet]);

  // — navegação de período —
  const irParaPeriodoAnterior = useCallback(() => setPeriodo((p) => periodoAnterior(p)), []);
  const irParaPeriodoSeguinte = useCallback(() => setPeriodo((p) => periodoSeguinte(p)), []);
  const voltarAoMesAtual = useCallback(() => setPeriodo(periodoDe(hoje)), [hoje]);
  const ehMesAtual = !!hoje && periodo === periodoDe(hoje);

  // — agregados, todos com escopo no período selecionado —
  const soma = (lista) => lista.reduce((a, b) => a + b.value, 0);

  /**
   * A agenda é do dia, não do período.
   *
   * O filtro é novo: com o seed mockado só existiam agendamentos de hoje, e a
   * lista inteira já era "o dia". Vindo do banco ela traz todos os dias, e sem
   * o recorte a tela de hoje mostraria o histórico inteiro.
   */
  const agenda = useMemo(
    () => agendamentos.filter((a) => a.date === hoje),
    [agendamentos, hoje],
  );

  /** Materiais projetados como gasto de trabalho/variável (ver 3.3). */
  const materiaisComoGasto = useMemo(() => materiais.map((m) => ({
    id: `mx${m.id}`, kind: "out", tipo: "trabalho", sub: "variavel", cat: "Material",
    title: `${m.name} · ${m.qty} ${m.unit}`, value: m.cost, date: m.date, iso: m.iso, material: m,
  })), [materiais]);

  const ledgerOut = useMemo(() => {
    if (!periodo) return [];
    const doPeriodo = noPeriodo(periodo);
    return [...items.filter((i) => i.kind === "out"), ...materiaisComoGasto].filter(doPeriodo);
  }, [items, materiaisComoGasto, periodo]);

  const entradas = useMemo(() => {
    if (!periodo) return [];
    return items.filter((i) => i.kind === "in").filter(noPeriodo(periodo));
  }, [items, periodo]);

  const totals = useMemo(() => ({
    trabalho: soma(ledgerOut.filter((i) => i.tipo === "trabalho")),
    pessoal: soma(ledgerOut.filter((i) => i.tipo === "pessoal")),
    materiaisTotal: soma(ledgerOut.filter((i) => i.cat === "Material")),
    faturamento: soma(entradas),
  }), [ledgerOut, entradas]);

  /** Faturamento do mês anterior ao selecionado — base da comparação da Home. */
  const faturamentoAnterior = useMemo(() => {
    if (!periodo) return 0;
    const anterior = noPeriodo(periodoAnterior(periodo));
    return soma(items.filter((i) => i.kind === "in").filter(anterior));
  }, [items, periodo]);

  const value = useMemo(() => ({
    money,
    hoje, conta,
    periodo, ehMesAtual,
    irParaPeriodoAnterior, irParaPeriodoSeguinte, voltarAoMesAtual,

    items, materiais, agenda,
    ledgerOut, entradas, totals, faturamentoAnterior,

    tab, setTab,
    sheet, editing, isEdit: !!editing,
    drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
    restaurarExemplo, salvando,
    filtro, setFiltro,
    snack, undo,

    openGasto, saveGasto, removeGasto,
    openAgenda, saveAgenda, removeAgenda,
    openEntrada, saveEntrada, removeEntrada,
    openMaterial, saveMaterial, removeMaterial,
  }), [
    money, hoje, conta, periodo, ehMesAtual,
    irParaPeriodoAnterior, irParaPeriodoSeguinte, voltarAoMesAtual,
    items, materiais, agenda, ledgerOut, entradas, totals, faturamentoAnterior,
    tab, sheet, editing, drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
    restaurarExemplo, salvando,
    filtro, snack, undo,
    openGasto, saveGasto, removeGasto,
    openAgenda, saveAgenda, removeAgenda,
    openEntrada, saveEntrada, removeEntrada,
    openMaterial, saveMaterial, removeMaterial,
  ]);

  return <AppDataContext value={value}>{children}</AppDataContext>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}

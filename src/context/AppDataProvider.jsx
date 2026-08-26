"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BRL, CAT_POR_SUB, gerarSeed } from "../data/dominio";
import { diaCurto, noPeriodo, periodoAnterior, periodoDe, periodoSeguinte } from "../lib/periodo";
import { lerDados, salvarDados } from "../lib/armazenamento";

const AppDataContext = createContext(null);

const byHour = (x, y) => x.hour.localeCompare(y.hour);

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
 * `hoje` chega como prop já resolvida no cliente (ver `useHoje` e o layout de
 * /app). O provider só é montado depois disso, então os inicializadores de
 * estado abaixo podem semear os dados direto — sem efeito, sem estado nulo.
 */
export function AppDataProvider({ children, hoje }) {
  // Dados salvos têm precedência sobre o seed. `lerDados()` devolve null só
  // quando não há nada aproveitável — um conjunto vazio (a usuária apagou
  // tudo) volta como arrays vazios e é respeitado.
  const [inicial] = useState(() => lerDados() ?? gerarSeed(hoje));
  const [items, setItems] = useState(inicial.items);
  const [materiais, setMateriais] = useState(inicial.materiais);
  const [agenda, setAgenda] = useState(inicial.agenda);

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

  // Sonda de escrita, feita uma vez: se a primeira gravação falha (aba
  // privada, cota estourada), ela vai falhar a sessão inteira. Guardar o
  // resultado como constante deixa o aviso ser renderizado de forma
  // declarativa, sem precisar de setState dentro de efeito.
  const [podeSalvar] = useState(() => salvarDados(inicial));

  // Uso canônico de efeito: sincronizar com um sistema externo.
  useEffect(() => {
    salvarDados({ items, materiais, agenda });
  }, [items, materiais, agenda]);

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
    const value = parseFloat(values.valor);
    const patch = {
      tipo: values.tipo,
      sub: values.sub,
      title: values.desc.trim() || "Gasto sem descrição",
      cat: CAT_POR_SUB[values.sub],
      value,
    };

    if (editing) {
      const prev = editing;
      setItems((cur) => cur.map((i) => (i.id === prev.id ? { ...i, ...patch } : i)));
      closeSheet();
      toast("Gasto atualizado", () => setItems((cur) => cur.map((i) => (i.id === prev.id ? prev : i))));
      return;
    }
    const item = { id: `g${Date.now()}`, kind: "out", iso: values.data, date: diaCurto(values.data), ...patch };
    setItems((cur) => [item, ...cur]);
    closeSheet();
    toast(`Gasto de ${BRL(value)} salvo`, () => setItems((cur) => cur.filter((i) => i.id !== item.id)));
  }, [editing, closeSheet, toast]);

  const removeGasto = useCallback(() => {
    const prev = editing;
    if (!prev) return;
    const idx = items.findIndex((i) => i.id === prev.id);
    setItems((cur) => cur.filter((i) => i.id !== prev.id));
    closeSheet();
    toast("Gasto excluído", () => setItems((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [editing, items, closeSheet, toast]);

  // — agenda —
  const saveAgenda = useCallback((values) => {
    const patch = {
      name: values.name.trim(),
      service: values.service,
      date: values.date,
      hour: values.hour,
      dur: values.dur,
      status: values.status,
      value: parseFloat(values.value) || 0,
    };

    if (editing) {
      const prev = editing;
      setAgenda((cur) => cur.map((a) => (a.id === prev.id ? { ...a, ...patch } : a)).sort(byHour));
      closeSheet();
      toast("Agendamento atualizado", () => setAgenda((cur) => cur.map((a) => (a.id === prev.id ? prev : a)).sort(byHour)));
      return;
    }
    const ag = { id: `a${Date.now()}`, ...patch };
    setAgenda((cur) => [...cur, ag].sort(byHour));
    closeSheet();
    toast(`${patch.name} agendada às ${patch.hour}`, () => setAgenda((cur) => cur.filter((a) => a.id !== ag.id)));
  }, [editing, closeSheet, toast]);

  const removeAgenda = useCallback(() => {
    const prev = editing;
    if (!prev) return;
    setAgenda((cur) => cur.filter((a) => a.id !== prev.id));
    closeSheet();
    toast("Agendamento cancelado", () => setAgenda((cur) => [...cur, prev].sort(byHour)));
  }, [editing, closeSheet, toast]);

  // — entradas —
  const saveEntrada = useCallback((values) => {
    const value = parseFloat(values.value);
    const patch = { client: values.client.trim(), service: values.service, method: values.method, value };

    if (editing) {
      const prev = editing;
      setItems((cur) => cur.map((i) => (i.id === prev.id ? { ...i, ...patch } : i)));
      closeSheet();
      toast("Entrada atualizada", () => setItems((cur) => cur.map((i) => (i.id === prev.id ? prev : i))));
      return;
    }
    const it = { id: `e${Date.now()}`, kind: "in", iso: values.date, date: diaCurto(values.date), ...patch };
    setItems((cur) => [it, ...cur]);
    closeSheet();
    toast(`Entrada de ${BRL(value)} registrada`, () => setItems((cur) => cur.filter((i) => i.id !== it.id)));
  }, [editing, closeSheet, toast]);

  const removeEntrada = useCallback(() => {
    const prev = editing;
    if (!prev) return;
    const idx = items.findIndex((i) => i.id === prev.id);
    setItems((cur) => cur.filter((i) => i.id !== prev.id));
    closeSheet();
    toast("Entrada excluída", () => setItems((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [editing, items, closeSheet, toast]);

  // — materiais —
  const saveMaterial = useCallback((values) => {
    const cost = parseFloat(values.cost);
    const patch = {
      name: values.name.trim(),
      qty: parseFloat(values.qty),
      unit: values.unit,
      cost,
      min: parseFloat(values.min) || 0,
    };

    if (editing) {
      const prev = editing;
      setMateriais((cur) => cur.map((m) => (m.id === prev.id ? { ...m, ...patch } : m)));
      closeSheet();
      toast("Material atualizado", () => setMateriais((cur) => cur.map((m) => (m.id === prev.id ? prev : m))));
      return;
    }
    const mat = { id: `m${Date.now()}`, iso: values.date, date: diaCurto(values.date), ...patch };
    setMateriais((cur) => [mat, ...cur]);
    closeSheet();
    toast(`Material lançado nos gastos: ${BRL(cost)}`, () => setMateriais((cur) => cur.filter((m) => m.id !== mat.id)));
  }, [editing, closeSheet, toast]);

  const removeMaterial = useCallback(() => {
    const prev = editing;
    if (!prev) return;
    const idx = materiais.findIndex((m) => m.id === prev.id);
    setMateriais((cur) => cur.filter((m) => m.id !== prev.id));
    closeSheet();
    toast("Material excluído", () => setMateriais((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [editing, materiais, closeSheet, toast]);

  /** Volta aos dados de exemplo. Destrutivo, mas reversível pelo snackbar. */
  const restaurarExemplo = useCallback(() => {
    const anterior = { items, materiais, agenda };
    const novo = gerarSeed(hoje);
    setItems(novo.items);
    setMateriais(novo.materiais);
    setAgenda(novo.agenda);
    setDrawerOpen(false);
    toast("Dados de exemplo restaurados", () => {
      setItems(anterior.items);
      setMateriais(anterior.materiais);
      setAgenda(anterior.agenda);
    });
  }, [items, materiais, agenda, hoje, toast]);

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
    hoje,
    periodo, ehMesAtual,
    irParaPeriodoAnterior, irParaPeriodoSeguinte, voltarAoMesAtual,

    items, materiais, agenda,
    ledgerOut, entradas, totals, faturamentoAnterior,

    tab, setTab,
    sheet, editing, isEdit: !!editing,
    drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
    restaurarExemplo, podeSalvar,
    filtro, setFiltro,
    snack, undo,

    openGasto, saveGasto, removeGasto,
    openAgenda, saveAgenda, removeAgenda,
    openEntrada, saveEntrada, removeEntrada,
    openMaterial, saveMaterial, removeMaterial,
  }), [
    money, hoje, periodo, ehMesAtual,
    irParaPeriodoAnterior, irParaPeriodoSeguinte, voltarAoMesAtual,
    items, materiais, agenda, ledgerOut, entradas, totals, faturamentoAnterior,
    tab, sheet, editing, drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
    restaurarExemplo, podeSalvar,
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

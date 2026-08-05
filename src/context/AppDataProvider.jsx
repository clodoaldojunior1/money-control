"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  BRL,
  ENTRADAS_SEED,
  AGENDA_SEED,
  MATERIAIS_SEED,
  GASTOS_SEED,
  MES_ANTERIOR,
  HOJE_ISO,
  fmtDia,
} from "../data/seed";

const AppDataContext = createContext(null);

const CAT_POR_SUB = { fixo: "Fixo", variavel: "Material", superfluo: "Supérfluo", necessario: "Necessário" };

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

export function AppDataProvider({ children }) {
  const [items, setItems] = useState(() => [...ENTRADAS_SEED, ...GASTOS_SEED]);
  const [materiais, setMateriais] = useState(MATERIAIS_SEED);
  const [agenda, setAgenda] = useState(AGENDA_SEED);

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
    const item = { id: `g${Date.now()}`, kind: "out", iso: values.data, date: fmtDia(values.data), ...patch };
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
    const it = { id: `e${Date.now()}`, kind: "in", iso: values.date, date: fmtDia(values.date), ...patch };
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
    const mat = { id: `m${Date.now()}`, iso: values.date, date: fmtDia(values.date), ...patch };
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

  const contextualSheet = SHEET_POR_ABA[tab] ?? "entrada";

  const openContextualSheet = useCallback(() => {
    openSheet(SHEET_POR_ABA[tab] ?? "entrada", null);
  }, [tab, openSheet]);

  // — cross-cutting derived aggregates —
  const ledgerOut = useMemo(() => {
    const mats = materiais.map((m) => ({
      id: `mx${m.id}`, kind: "out", tipo: "trabalho", sub: "variavel", cat: "Material",
      title: `${m.name} · ${m.qty} ${m.unit}`, value: m.cost, date: m.date, iso: m.iso, material: m,
    }));
    return [...items.filter((i) => i.kind === "out"), ...mats];
  }, [items, materiais]);

  const entradas = useMemo(() => items.filter((i) => i.kind === "in"), [items]);

  const totals = useMemo(() => {
    const trabalho = ledgerOut.filter((i) => i.tipo === "trabalho").reduce((a, b) => a + b.value, 0);
    const pessoal = ledgerOut.filter((i) => i.tipo === "pessoal").reduce((a, b) => a + b.value, 0);
    const materiaisTotal = ledgerOut.filter((i) => i.cat === "Material").reduce((a, b) => a + b.value, 0);
    const faturamento = entradas.reduce((a, b) => a + b.value, 0);
    return { trabalho, pessoal, materiaisTotal, faturamento };
  }, [ledgerOut, entradas]);

  const value = useMemo(() => ({
    money,
    mesAnterior: MES_ANTERIOR,
    hoje: HOJE_ISO,

    items, materiais, agenda,
    ledgerOut, entradas, totals,

    tab, setTab,
    sheet, editing, isEdit: !!editing,
    drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
    filtro, setFiltro,
    snack, undo,

    openGasto, saveGasto, removeGasto,
    openAgenda, saveAgenda, removeAgenda,
    openEntrada, saveEntrada, removeEntrada,
    openMaterial, saveMaterial, removeMaterial,
  }), [
    money, items, materiais, agenda, ledgerOut, entradas, totals,
    tab, sheet, editing, drawerOpen, openDrawer, closeDrawer, closeSheet,
    openContextualSheet, contextualSheet,
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

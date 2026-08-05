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

const blankGasto = () => ({ valor: "", desc: "", tipo: "trabalho", sub: "variavel", data: HOJE_ISO });
const blankAgenda = () => ({ name: "", service: "Volume russo", date: HOJE_ISO, hour: "09:00", dur: "2h", status: "Confirmado", value: "" });
const blankEntrada = () => ({ client: "", service: "Volume russo", value: "", method: "Pix", date: HOJE_ISO });
const blankMaterial = () => ({ name: "", qty: "1", unit: "un", cost: "", min: "1", date: HOJE_ISO });

export function AppDataProvider({ children }) {
  const [items, setItems] = useState(() => [...ENTRADAS_SEED, ...GASTOS_SEED]);
  const [materiais, setMateriais] = useState(MATERIAIS_SEED);
  const [agenda, setAgenda] = useState(AGENDA_SEED);

  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [snack, setSnack] = useState(null);
  const snackTimer = useRef(null);

  const [form, setForm] = useState(blankGasto);
  const [aform, setAForm] = useState(blankAgenda);
  const [eform, setEForm] = useState(blankEntrada);
  const [mform, setMForm] = useState(blankMaterial);

  const [touched, setTouched] = useState(false);
  const [aTouched, setATouched] = useState(false);
  const [eTouched, setETouched] = useState(false);
  const [mTouched, setMTouched] = useState(false);

  const [gEdit, setGEdit] = useState(null);
  const [aEdit, setAEdit] = useState(null);
  const [eEdit, setEEdit] = useState(null);
  const [mEdit, setMEdit] = useState(null);

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
    setTouched(false);
    setATouched(false);
    setETouched(false);
    setMTouched(false);
    setGEdit(null);
    setAEdit(null);
    setEEdit(null);
    setMEdit(null);
  }, []);

  // — gastos —
  const setFormField = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  const openGasto = useCallback((item) => {
    setSheet("gasto");
    setDrawerOpen(false);
    setTouched(false);
    setGEdit(item ? item.id : null);
    setForm(item ? { valor: String(item.value), desc: item.title, tipo: item.tipo, sub: item.sub, data: HOJE_ISO } : blankGasto());
  }, []);

  const saveGasto = useCallback(() => {
    const v = parseFloat(form.valor);
    if (!(v > 0)) { setTouched(true); return; }
    const catMap = { fixo: "Fixo", variavel: "Material", superfluo: "Supérfluo", necessario: "Necessário" };
    const patch = { tipo: form.tipo, sub: form.sub, title: form.desc || "Gasto sem descrição", cat: catMap[form.sub], value: v };

    if (gEdit) {
      const prev = items.find((i) => i.id === gEdit);
      setItems((cur) => cur.map((i) => (i.id === gEdit ? { ...i, ...patch } : i)));
      closeSheet();
      toast("Gasto atualizado", () => setItems((cur) => cur.map((i) => (i.id === prev.id ? prev : i))));
      return;
    }
    const item = { id: `g${Date.now()}`, kind: "out", iso: form.data, date: fmtDia(form.data), ...patch };
    setItems((cur) => [item, ...cur]);
    closeSheet();
    toast(`Gasto de ${BRL(v)} salvo`, () => setItems((cur) => cur.filter((i) => i.id !== item.id)));
  }, [form, gEdit, items, closeSheet, toast]);

  const removeGasto = useCallback(() => {
    const prev = items.find((i) => i.id === gEdit);
    if (!prev) return;
    const idx = items.indexOf(prev);
    setItems((cur) => cur.filter((i) => i.id !== gEdit));
    closeSheet();
    toast("Gasto excluído", () => setItems((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [items, gEdit, closeSheet, toast]);

  // — agenda —
  const setAFormField = useCallback((k, v) => setAForm((f) => ({ ...f, [k]: v })), []);

  const openAgenda = useCallback((ag) => {
    setSheet("agenda");
    setDrawerOpen(false);
    setATouched(false);
    setAEdit(ag ? ag.id : null);
    setAForm(ag ? { name: ag.name, service: ag.service, date: ag.date, hour: ag.hour, dur: ag.dur, status: ag.status, value: String(ag.value) } : blankAgenda());
  }, []);

  const saveAgenda = useCallback(() => {
    if (!aform.name.trim()) { setATouched(true); return; }
    const patch = { name: aform.name.trim(), service: aform.service, date: aform.date, hour: aform.hour, dur: aform.dur, status: aform.status, value: parseFloat(aform.value) || 0 };

    if (aEdit) {
      const prev = agenda.find((a) => a.id === aEdit);
      setAgenda((cur) => cur.map((a) => (a.id === aEdit ? { ...a, ...patch } : a)).sort((x, y) => x.hour.localeCompare(y.hour)));
      closeSheet();
      toast("Agendamento atualizado", () => setAgenda((cur) => cur.map((a) => (a.id === prev.id ? prev : a))));
      return;
    }
    const ag = { id: `a${Date.now()}`, ...patch };
    setAgenda((cur) => [...cur, ag].sort((x, y) => x.hour.localeCompare(y.hour)));
    closeSheet();
    toast(`${patch.name} agendada às ${patch.hour}`, () => setAgenda((cur) => cur.filter((a) => a.id !== ag.id)));
  }, [aform, aEdit, agenda, closeSheet, toast]);

  const removeAgenda = useCallback(() => {
    const prev = agenda.find((a) => a.id === aEdit);
    if (!prev) return;
    setAgenda((cur) => cur.filter((a) => a.id !== aEdit));
    closeSheet();
    toast("Agendamento cancelado", () => setAgenda((cur) => [...cur, prev].sort((x, y) => x.hour.localeCompare(y.hour))));
  }, [agenda, aEdit, closeSheet, toast]);

  // — entradas —
  const setEFormField = useCallback((k, v) => setEForm((f) => ({ ...f, [k]: v })), []);

  const openEntrada = useCallback((it) => {
    setSheet("entrada");
    setDrawerOpen(false);
    setETouched(false);
    setEEdit(it ? it.id : null);
    setEForm(it ? { client: it.client, service: it.service, value: String(it.value), method: it.method, date: HOJE_ISO } : blankEntrada());
  }, []);

  const saveEntrada = useCallback(() => {
    const v = parseFloat(eform.value);
    if (!eform.client.trim() || !(v > 0)) { setETouched(true); return; }
    const patch = { client: eform.client.trim(), service: eform.service, method: eform.method, value: v };

    if (eEdit) {
      const prev = items.find((i) => i.id === eEdit);
      setItems((cur) => cur.map((i) => (i.id === eEdit ? { ...i, ...patch } : i)));
      closeSheet();
      toast("Entrada atualizada", () => setItems((cur) => cur.map((i) => (i.id === prev.id ? prev : i))));
      return;
    }
    const it = { id: `e${Date.now()}`, kind: "in", iso: eform.date, date: fmtDia(eform.date), ...patch };
    setItems((cur) => [it, ...cur]);
    closeSheet();
    toast(`Entrada de ${BRL(v)} registrada`, () => setItems((cur) => cur.filter((i) => i.id !== it.id)));
  }, [eform, eEdit, items, closeSheet, toast]);

  const removeEntrada = useCallback(() => {
    const prev = items.find((i) => i.id === eEdit);
    if (!prev) return;
    const idx = items.indexOf(prev);
    setItems((cur) => cur.filter((i) => i.id !== eEdit));
    closeSheet();
    toast("Entrada excluída", () => setItems((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [items, eEdit, closeSheet, toast]);

  // — materiais —
  const setMFormField = useCallback((k, v) => setMForm((f) => ({ ...f, [k]: v })), []);

  const openMaterial = useCallback((m) => {
    setSheet("material");
    setDrawerOpen(false);
    setMTouched(false);
    setMEdit(m ? m.id : null);
    setMForm(m ? { name: m.name, qty: String(m.qty), unit: m.unit, cost: String(m.cost), min: String(m.min), date: HOJE_ISO } : blankMaterial());
  }, []);

  const saveMaterial = useCallback(() => {
    const cost = parseFloat(mform.cost);
    const qty = parseFloat(mform.qty);
    if (!mform.name.trim() || !(cost > 0) || !(qty > 0)) { setMTouched(true); return; }
    const patch = { name: mform.name.trim(), qty, unit: mform.unit, cost, min: parseFloat(mform.min) || 0 };

    if (mEdit) {
      const prev = materiais.find((m) => m.id === mEdit);
      setMateriais((cur) => cur.map((m) => (m.id === mEdit ? { ...m, ...patch } : m)));
      closeSheet();
      toast("Material atualizado", () => setMateriais((cur) => cur.map((m) => (m.id === prev.id ? prev : m))));
      return;
    }
    const mat = { id: `m${Date.now()}`, iso: mform.date, date: fmtDia(mform.date), ...patch };
    setMateriais((cur) => [mat, ...cur]);
    closeSheet();
    toast(`Material lançado nos gastos: ${BRL(cost)}`, () => setMateriais((cur) => cur.filter((m) => m.id !== mat.id)));
  }, [mform, mEdit, materiais, closeSheet, toast]);

  const removeMaterial = useCallback(() => {
    const prev = materiais.find((m) => m.id === mEdit);
    if (!prev) return;
    const idx = materiais.indexOf(prev);
    setMateriais((cur) => cur.filter((m) => m.id !== mEdit));
    closeSheet();
    toast("Material excluído", () => setMateriais((cur) => {
      const arr = cur.slice();
      arr.splice(idx, 0, prev);
      return arr;
    }));
  }, [materiais, mEdit, closeSheet, toast]);

  const openContextualSheet = useCallback(() => {
    if (tab === "agenda") openAgenda(null);
    else if (tab === "entradas") openEntrada(null);
    else if (tab === "materiais") openMaterial(null);
    else openGasto(null);
  }, [tab, openAgenda, openEntrada, openMaterial, openGasto]);

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
    sheet, drawerOpen, openDrawer, closeDrawer, closeSheet, openContextualSheet,
    filtro, setFiltro,
    snack, undo,

    form, setFormField, touched, gEdit,
    openGasto, saveGasto, removeGasto,

    aform, setAFormField, aTouched, aEdit,
    openAgenda, saveAgenda, removeAgenda,

    eform, setEFormField, eTouched, eEdit,
    openEntrada, saveEntrada, removeEntrada,

    mform, setMFormField, mTouched, mEdit,
    openMaterial, saveMaterial, removeMaterial,
  }), [
    money, items, materiais, agenda, ledgerOut, entradas, totals,
    tab, sheet, drawerOpen, openDrawer, closeDrawer, closeSheet, openContextualSheet, filtro, snack, undo,
    form, setFormField, touched, gEdit, openGasto, saveGasto, removeGasto,
    aform, setAFormField, aTouched, aEdit, openAgenda, saveAgenda, removeAgenda,
    eform, setEFormField, eTouched, eEdit, openEntrada, saveEntrada, removeEntrada,
    mform, setMFormField, mTouched, mEdit, openMaterial, saveMaterial, removeMaterial,
  ]);

  return <AppDataContext value={value}>{children}</AppDataContext>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}

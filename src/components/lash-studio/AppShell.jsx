"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import Fab from "@mui/material/Fab";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { useTheme } from "@mui/material/styles";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

import { useColorMode } from "../../context/ColorModeProvider";
import { useAppData } from "../../context/AppDataProvider";
import { HeaderIconButton } from "./ui/HeaderIconButton";

import { HomeTab } from "./tabs/HomeTab";
import { GastosTab } from "./tabs/GastosTab";
import { AgendaTab } from "./tabs/AgendaTab";
import { EntradasTab } from "./tabs/EntradasTab";
import { MateriaisTab } from "./tabs/MateriaisTab";

import { GastoSheet } from "./sheets/GastoSheet";
import { AgendaSheet } from "./sheets/AgendaSheet";
import { EntradaSheet } from "./sheets/EntradaSheet";
import { MaterialSheet } from "./sheets/MaterialSheet";

const TABS = [
  { value: "home", label: "Início", icon: HomeRoundedIcon },
  { value: "entradas", label: "Entradas", icon: TrendingUpRoundedIcon },
  { value: "gastos", label: "Gastos", icon: ReceiptLongRoundedIcon },
  { value: "materiais", label: "Materiais", icon: Inventory2RoundedIcon },
  { value: "agenda", label: "Agenda", icon: EventRoundedIcon },
];

const MENU_ITEMS = [
  { value: "home", label: "Início", icon: HomeRoundedIcon },
  { value: "gastos", label: "Gastos", icon: ReceiptLongRoundedIcon },
  { value: "agenda", label: "Agenda", icon: EventRoundedIcon },
  { value: "entradas", label: "Entradas", icon: TrendingUpRoundedIcon },
  { value: "materiais", label: "Materiais", icon: Inventory2RoundedIcon },
  { value: "clientes", label: "Clientes", icon: GroupsRoundedIcon, soon: true },
  { value: "relatorios", label: "Relatórios", icon: BarChartRoundedIcon, soon: true },
  { value: "config", label: "Configurações", icon: SettingsRoundedIcon, soon: true },
];

// Chaveado pelo tipo de sheet (não pela aba) para não divergir do
// SHEET_POR_ABA que define a ação no AppDataProvider.
const FAB_LABEL = {
  entrada: "Registrar entrada",
  gasto: "Adicionar gasto",
  material: "Novo material",
  agenda: "Agendar cliente",
};

export const LARGURA_APP = 480;

const TAB_COMPONENTS = {
  home: HomeTab,
  gastos: GastosTab,
  agenda: AgendaTab,
  entradas: EntradasTab,
  materiais: MateriaisTab,
};

const SHEET_COMPONENTS = {
  gasto: GastoSheet,
  agenda: AgendaSheet,
  entrada: EntradaSheet,
  material: MaterialSheet,
};

export function AppShell() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { isDark, toggleColorMode } = useColorMode();
  const {
    tab, setTab, sheet, closeSheet, drawerOpen, openDrawer, closeDrawer,
    openContextualSheet, contextualSheet, snack, undo,
  } = useAppData();

  const TabComponent = TAB_COMPONENTS[tab] ?? HomeTab;
  const SheetComponent = sheet ? SHEET_COMPONENTS[sheet] : null;
  const fabLabel = FAB_LABEL[contextualSheet];

  return (
    <Box sx={{ minHeight: "100dvh", backgroundColor: t.pageBg, display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: t.bg,
          color: t.text,
          boxShadow: { xs: "none", sm: t.shadow.lg },
        }}
      >
        {/* Top bar */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", px: 2.75, pt: 2.25, pb: 1.5 }}>
          <HeaderIconButton aria-label="Abrir menu" onClick={openDrawer}>
            <MenuRoundedIcon sx={{ fontSize: 19 }} />
          </HeaderIconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: t.accent }}>
              Sábado, 1 de agosto
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1.15 }}>
              Olá, Manu
            </Typography>
          </Box>
          <HeaderIconButton aria-label="Alternar tema" onClick={toggleColorMode}>
            {isDark ? <LightModeRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
          </HeaderIconButton>
          <HeaderIconButton aria-label="Notificações">
            <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
          </HeaderIconButton>
        </Stack>

        {/* Content */}
        {/* A página rola no documento; nav e FAB são fixos, então o padding
            inferior reserva o espaço deles. */}
        <Box sx={{ flex: 1, px: 2.75, pb: 20 }}>
          <TabComponent />
        </Box>

        {/* FAB — fixo na viewport, mas alinhado à direita do container
            centralizado. O wrapper não captura cliques; só o botão. */}
        <Box
          sx={{
            position: "fixed",
            bottom: 88,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: LARGURA_APP,
            px: 2.5,
            display: "flex",
            justifyContent: "flex-end",
            pointerEvents: "none",
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          <Fab
            color="primary"
            aria-label={fabLabel}
            title={fabLabel}
            onClick={openContextualSheet}
            sx={{ pointerEvents: "auto" }}
          >
            <AddRoundedIcon />
          </Fab>
        </Box>

        {/* Bottom nav — também fixa, para não sumir ao rolar listas longas */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: LARGURA_APP,
            zIndex: (theme) => theme.zIndex.appBar,
            borderTop: `1px solid ${t.divider}`,
            backgroundColor: `${t.bg}e0`,
            backdropFilter: "blur(14px)",
          }}
        >
          <BottomNavigation
            value={tab}
            onChange={(_, next) => setTab(next)}
            showLabels
            sx={{ height: 64 }}
          >
            {TABS.map(({ value, label, icon: Icon }) => (
              <BottomNavigationAction key={value} value={value} label={label} icon={<Icon sx={{ fontSize: 21 }} />} />
            ))}
          </BottomNavigation>
        </Box>

        {/* Nav drawer */}
        <Drawer anchor="left" open={drawerOpen} onClose={closeDrawer} slotProps={{ paper: { sx: { width: 296 } } }}>
          <Stack sx={{ height: "100%", p: 2.25, pt: 6.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pb: 2.25 }}>
              <Avatar sx={{ width: 46, height: 46, bgcolor: t.accent, color: t.onAccent, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                M
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>Manuela Reis</Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Studio Manu Lashes · Plano Pro</Typography>
              </Box>
            </Stack>
            <Box sx={{ height: "1px", backgroundColor: t.divider, mb: 1.5 }} />

            <Stack component="nav" spacing={0.5}>
              {MENU_ITEMS.map(({ value, label, icon: Icon, soon }) => {
                const active = tab === value;
                return (
                  <Button
                    key={value}
                    onClick={soon ? undefined : () => { setTab(value); closeDrawer(); }}
                    disabled={soon}
                    startIcon={<Icon sx={{ fontSize: 20 }} />}
                    sx={{
                      justifyContent: "flex-start", gap: 0.5, px: 1.75, py: 1.25,
                      color: active ? t.accent : t.text,
                      backgroundColor: active ? `${t.accent}1a` : "transparent",
                      "&.Mui-disabled": { color: t.neutral[500] },
                    }}
                  >
                    <Box component="span" sx={{ flex: 1, textAlign: "left" }}>{label}</Box>
                    {soon && <Chip label="Em breve" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: t.neutral[100], color: t.neutral[800] }} />}
                  </Button>
                );
              })}
            </Stack>

            <Box sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ height: "1px", backgroundColor: t.divider }} />
              <Button
                onClick={toggleColorMode}
                startIcon={isDark ? <LightModeRoundedIcon sx={{ fontSize: 19 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 19 }} />}
                sx={{ justifyContent: "flex-start", px: 1.75, py: 1.25, color: t.text }}
              >
                {isDark ? "Tema claro" : "Tema escuro"}
              </Button>
              <Button
                onClick={closeDrawer}
                startIcon={<LogoutRoundedIcon sx={{ fontSize: 19 }} />}
                sx={{ justifyContent: "flex-start", px: 1.75, py: 1.25, color: t.neutral[600] }}
              >
                Sair
              </Button>
            </Box>
          </Stack>
        </Drawer>

        {/* Bottom sheet */}
        <Drawer
          anchor="bottom"
          open={!!sheet}
          onClose={closeSheet}
          slotProps={{ paper: { sx: { borderRadius: "28px 28px 0 0", maxHeight: "88%", maxWidth: 480, mx: "auto" } } }}
        >
          {SheetComponent && <SheetComponent />}
        </Drawer>

        {/* Undo snackbar */}
        <Snackbar
          open={!!snack}
          message={
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <CheckRoundedIcon sx={{ fontSize: 18 }} />
              <span>{snack?.text}</span>
            </Stack>
          }
          action={
            snack?.undo && (
              <Button color="inherit" size="small" onClick={undo} sx={{ fontWeight: 600 }}>
                Desfazer
              </Button>
            )
          }
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{
            position: "fixed", bottom: 88,
            left: "50%", right: "auto",
            transform: "translateX(-50%)",
            width: "100%", maxWidth: LARGURA_APP - 36,
            "& .MuiSnackbarContent-root": {
              width: "100%", borderRadius: 22,
              backgroundColor: t.neutral[800], color: "#f5f8fa",
            },
          }}
        />
      </Box>
    </Box>
  );
}

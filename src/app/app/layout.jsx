"use client";

import { AppDataProvider } from "../../context/AppDataProvider";

export default function AppLayout({ children }) {
  return <AppDataProvider>{children}</AppDataProvider>;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Clients from "./pages/Clients";
import LiquidityHub from "./pages/LiquidityHub";
import SpreadAnalytics from "./pages/SpreadAnalytics";
import Settings from "./pages/Settings";
import FXTrader from "./pages/FXTrader";
import BaaS from "./pages/BaaS";
import Allies from "./pages/Allies";
import Compliance from "./pages/Compliance";
import PublicCapture from "./pages/PublicCapture";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import ShiftGate from "./components/ShiftGate";
import { RoleLevel } from "./types/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "dashboard";
  });

  if (activeTab === "public-capture") {
    return <PublicCapture />;
  }

  return (
    <AuthProvider>
      <ShiftGate>
        <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === "dashboard" && <Dashboard />}
        
        {activeTab === "baas" && (
          <AuthGuard minLevel={RoleLevel.CAJERO_PRINCIPAL}>
            <BaaS />
          </AuthGuard>
        )}

        {activeTab === "fx-trader" && (
          <AuthGuard minLevel={RoleLevel.CAJA}>
            <FXTrader />
          </AuthGuard>
        )}

        {activeTab === "liquidity" && (
          <AuthGuard minLevel={RoleLevel.GERENTE}>
            <LiquidityHub />
          </AuthGuard>
        )}

        {activeTab === "analytics" && (
          <AuthGuard minLevel={RoleLevel.GERENTE}>
            <SpreadAnalytics />
          </AuthGuard>
        )}

        {activeTab === "transactions" && (
          <AuthGuard minLevel={RoleLevel.CAJA}>
            <Transactions />
          </AuthGuard>
        )}

        {activeTab === "clients" && (
          <AuthGuard minLevel={RoleLevel.GERENTE}>
            <Clients />
          </AuthGuard>
        )}

        {activeTab === "allies" && (
          <AuthGuard minLevel={RoleLevel.GERENTE}>
            <Allies />
          </AuthGuard>
        )}

        {activeTab === "compliance" && (
          <AuthGuard minLevel={RoleLevel.GERENTE}>
            <Compliance />
          </AuthGuard>
        )}

        {activeTab === "settings" && (
          <AuthGuard minLevel={RoleLevel.SUPER_ADMIN}>
            <Settings />
          </AuthGuard>
        )}
      </DashboardLayout>
      </ShiftGate>
    </AuthProvider>
  );
}

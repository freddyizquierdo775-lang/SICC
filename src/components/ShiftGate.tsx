import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RoleLevel } from "../types/auth";
import ShiftOpeningCount from "./ShiftOpeningCount";
import { RefreshCw } from "lucide-react";

const ShiftGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();
  const [shiftStatus, setShiftStatus] = useState<string>("LOADING");

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <RefreshCw className="animate-spin text-binance-yellow mb-4" size={48} />
        <p className="text-gray-400 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <p className="text-gray-400">Sin sesión activa</p>
      </div>
    );
  }

  const isCashier = profile.role_level <= RoleLevel.CAJERO_PRINCIPAL;

  // Check shift status
  useEffect(() => {
    if (!isCashier) return;
    let cancelled = false;
    (async () => {
      try {
        const userId = localStorage.getItem("mock_user_id") || profile.auth_user_id;
        const res = await fetch("/api/shifts/status", { headers: { "x-user-id": userId } });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.shift && data.shift.status !== "CLOSED") {
            setShiftStatus(data.shift.status);
          } else {
            setShiftStatus("CLOSED");
          }
        } else if (!cancelled) {
          setShiftStatus("CLOSED");
        }
      } catch (e) {
        if (!cancelled) setShiftStatus("CLOSED");
      }
    })();
    return () => { cancelled = true; };
  }, [profile.auth_user_id, isCashier]);

  // Non-cashiers or open shift: just show dashboard
  const showDashboard = !isCashier || shiftStatus === "OPEN";
  const showGate = isCashier && (shiftStatus === "CLOSED" || shiftStatus === "PENDING_AUTHORIZATION");
  const showLoading = shiftStatus === "LOADING" && isCashier;

  return (
    <>
      {/* Dashboard always mounted, hidden when gate is active */}
      <div style={{ display: showDashboard ? "block" : "none", minHeight: "100vh" }}>
        {children}
      </div>

      {/* Loading overlay */}
      {showLoading && (
        <div className="fixed inset-0 z-50 bg-[#0b0e11] flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-binance-yellow mb-4" size={48} />
          <p className="text-gray-400 font-medium">Verificando turno activo...</p>
          <p className="text-gray-600 text-xs mt-2">{profile.nickname} — {profile.puesto}</p>
        </div>
      )}

      {/* Shift opening gate overlay */}
      {showGate && (
        <div className="fixed inset-0 z-50 bg-[#0b0e11] overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <ShiftOpeningCount
                onShiftStatusChange={(status) => setShiftStatus(status || "CLOSED")}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftGate;

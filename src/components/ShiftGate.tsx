import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RoleLevel } from "../types/auth";
import ShiftOpeningCount from "./ShiftOpeningCount";
import { RefreshCw } from "lucide-react";

/**
 * ShiftGate — Post-login gate for cashiers.
 * 
 * After authentication, if the user is a cashier (role_level ≤ 3),
 * this gate checks if there's an active shift. If not, it blocks
 * access to the dashboard and forces the shift opening flow.
 * 
 * Users with role_level ≥ 4 (Gerente, Super Admin) skip the gate.
 */
const ShiftGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();
  const [shiftStatus, setShiftStatus] = useState<string>("LOADING");

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <RefreshCw className="animate-spin text-binance-yellow mb-4" size={48} />
        <p className="text-gray-400 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  // No profile → should not happen (AuthProvider handles this)
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <p className="text-gray-400">Sin sesión activa</p>
      </div>
    );
  }

  // Not a cashier → skip gate
  const isCashier = profile.role_level <= RoleLevel.CAJERO_PRINCIPAL;
  if (!isCashier) {
    return <>{children}</>;
  }

  // Check shift status
  useEffect(() => {
    const checkShift = async () => {
      try {
        const userId = localStorage.getItem("mock_user_id") || profile.auth_user_id;
        const res = await fetch("/api/shifts/status", {
          headers: { "x-user-id": userId }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shift && data.shift.status !== "CLOSED") {
            setShiftStatus(data.shift.status);
          } else {
            setShiftStatus("CLOSED");
          }
        } else {
          setShiftStatus("CLOSED");
        }
      } catch (e) {
        console.error("ShiftGate: error checking shift", e);
        setShiftStatus("CLOSED");
      }
    };
    checkShift();
  }, [profile.auth_user_id]);

  // Loading shift status
  if (shiftStatus === "LOADING") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <RefreshCw className="animate-spin text-binance-yellow mb-4" size={48} />
        <p className="text-gray-400 font-medium">Verificando turno activo...</p>
        <p className="text-gray-600 text-xs mt-2">
          {profile.nickname} — {profile.puesto}
        </p>
      </div>
    );
  }

  // Shift open → show dashboard
  if (shiftStatus === "OPEN") {
    return <>{children}</>;
  }

  // Shift closed or PENDING_AUTHORIZATION → show shift opening gate
  if (shiftStatus === "PENDING_AUTHORIZATION") {
    return (
      <div className="min-h-screen bg-[#0b0e11]">
        <ShiftOpeningCount
          onShiftStatusChange={(status) => setShiftStatus(status || "CLOSED")}
        />
      </div>
    );
  }

  // Default: CLOSED or null → show shift opening gate
  return (
    <div className="min-h-screen bg-[#0b0e11]">
      <ShiftOpeningCount
        onShiftStatusChange={(status) => setShiftStatus(status || "CLOSED")}
      />
    </div>
  );
};

export default ShiftGate;

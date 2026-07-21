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
 * access to the dashboard and forces the shift opening flow:
 * 
 *   1. Blind count of physical denominations
 *   2. Validation against inherited balance
 *   3. Deviation protocol (if mismatch) with manager authorization
 *   4. Once shift is OPEN → access granted to dashboard
 * 
 * Users with role_level ≥ 4 (Gerente, Super Admin) skip the gate.
 */
const ShiftGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [shiftStatus, setShiftStatus] = useState<string | null>("LOADING");
  const [activeShift, setActiveShift] = useState<any>(null);

  // Only cashiers need to open a shift
  const isCashier = profile && profile.role_level <= RoleLevel.CAJERO_PRINCIPAL;

  useEffect(() => {
    if (!isCashier) {
      setShiftStatus("OPEN"); // Skip gate for non-cashiers
      return;
    }

    // Check current shift status
    const checkShift = async () => {
      try {
        const userId = localStorage.getItem("mock_user_id") || "user_cajero_1";
        const res = await fetch("/api/shifts/status", {
          headers: { "x-user-id": userId }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shift && data.shift.status !== "CLOSED") {
            setShiftStatus(data.shift.status);
            setActiveShift(data.shift);
          } else {
            setShiftStatus("CLOSED");
            setActiveShift(null);
          }
        } else {
          setShiftStatus("CLOSED");
        }
      } catch (e) {
        console.error("ShiftGate: error checking shift status", e);
        setShiftStatus("CLOSED"); // Default to requiring a shift
      }
    };

    checkShift();
  }, [profile]);

  // Loading state while checking shift
  if (shiftStatus === "LOADING") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e11] text-white">
        <RefreshCw className="animate-spin text-binance-yellow mb-4" size={48} />
        <p className="text-gray-400 font-medium">Verificando turno activo...</p>
        <p className="text-gray-600 text-xs mt-2">
          {profile?.nickname} — {profile?.puesto}
        </p>
      </div>
    );
  }

  // Not a cashier → skip gate entirely
  if (!isCashier) {
    return <>{children}</>;
  }

  // Shift already open → pass through
  if (shiftStatus === "OPEN") {
    return <>{children}</>;
  }

  // Shift closed or pending authorization → show shift opening gate
  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <ShiftOpeningCount
          onShiftStatusChange={(status, shift) => {
            setShiftStatus(status);
            setActiveShift(shift);
          }}
        />
      </div>
    </div>
  );
};

export default ShiftGate;

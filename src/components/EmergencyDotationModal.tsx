import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Coins, AlertCircle, ShieldCheck, Clock, Plus, Minus, X } from "lucide-react";

interface EmergencyDotationModalProps {
  onClose: () => void;
  cajeroId: string;
}

export function EmergencyDotationModal({ onClose, cajeroId }: EmergencyDotationModalProps) {
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [breakdown, setBreakdown] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedTarget = useMemo(() => {
    const val = parseFloat(requestedAmount);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [requestedAmount]);

  const totalBreakdown = useMemo(() => {
    return Object.entries(breakdown).reduce<number>((sum, [val, qty]) => {
      const denomVal = parseFloat(val);
      const quantity = Number(qty) || 0;
      return sum + (denomVal * quantity);
    }, 0);
  }, [breakdown]);

  const diff = Math.abs(totalBreakdown - parsedTarget);
  const isValid = parsedTarget > 0 && diff < 0.01 && totalBreakdown === parsedTarget;

  const handleUpdate = (denom: number, value: number) => {
    setBreakdown(prev => ({
      ...prev,
      [denom]: value
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/liquidity/dotaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cajero_id: cajeroId,
          monto_mxn: parsedTarget,
          tipo_dotacion: "EMERGENCIA",
          desglose_json: JSON.stringify(breakdown)
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        alert(`✅ SOLICITUD DE DOTACIÓN ENVIADA\nID: ${json.data.id}\nMonto: $${parsedTarget.toLocaleString()} MXN\nPor favor solicite a su Gerente autorizar esta dotación en el Liquidity Hub.`);
        onClose();
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (err) {
      alert("Error de red al registrar la dotación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const denominations = [1000, 500, 200, 100, 50, 20];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#1e2329] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/5 text-left"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#181a20]/50">
          <div className="flex items-center gap-3 bg-[#181a20]/50 text-left">
            <div className="p-2 bg-binance-yellow text-black rounded-xl">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Desglose de Dotación de Emergencia</h2>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider">
                Efectivo por Denominación (MXN)
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-[#161b22] border border-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Step 1: Input target amount */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              1. Ingrese el Monto Total a Solicitar (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-binance-yellow">$</span>
              <input
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-[#181a20] border border-white/5 rounded-xl text-lg font-bold text-binance-yellow focus:outline-none focus:border-binance-yellow"
                autoFocus
              />
            </div>
          </div>

          {/* Step 2: Denomination Breakdown */}
          {parsedTarget > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                2. Ingrese la Cantidad de Billetes para Cuadrar el Monto
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {denominations.map((denom) => {
                  const qty = breakdown[denom] || 0;
                  return (
                    <div 
                      key={denom}
                      className="flex items-center justify-between p-3 bg-[#181a20]/60 rounded-xl border border-white/5"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-extrabold text-white">${denom} MXN</span>
                        <span className="text-[10px] text-gray-500 font-mono">Subtotal: ${(denom * qty).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(denom, Math.max(0, qty - 1))}
                          className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={qty || ""}
                          onChange={(e) => handleUpdate(denom, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 bg-transparent text-center border-b border-white/10 font-bold text-white focus:outline-none focus:border-binance-yellow"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate(denom, qty + 1)}
                          className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status comparison bar */}
          {parsedTarget > 0 && (
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-4">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Solicitado</span>
                  <span className="text-sm font-bold text-white font-mono">${parsedTarget.toLocaleString()}</span>
                </div>
                <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Desglosado</span>
                  <span className={`text-sm font-bold font-mono ${isValid ? 'text-emerald-500' : 'text-binance-yellow'}`}>
                    ${totalBreakdown.toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Diferencia</span>
                  <span className={`text-sm font-bold font-mono ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${diff.toLocaleString()}
                  </span>
                </div>
              </div>

              {!isValid && (
                <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-amber-400 text-xs">
                  <AlertCircle size={14} />
                  <span>El desglose debe cuadrar exactamente</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#181a20]/50">
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              isValid && !isSubmitting
                ? "bg-binance-yellow text-black hover:bg-yellow-400 shadow-lg shadow-binance-yellow/10 cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
            }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="animate-spin" size={14} />
                <span>Enviando...</span>
              </>
            ) : isValid ? (
              <>
                <ShieldCheck size={16} />
                <span>Enviar Solicitud de Dotación</span>
              </>
            ) : (
              <span>Ingrese Monto y Complete el Desglose</span>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

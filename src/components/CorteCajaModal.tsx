import React, { useState, useEffect } from "react";
import { 
  X, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Minus, 
  UserCheck, 
  ShieldAlert, 
  DollarSign, 
  Upload, 
  Save, 
  Download,
  Receipt,
  ArrowRight,
  RefreshCw,
  Eye,
  Check
} from "lucide-react";
import { jsPDF } from "jspdf";

// Catalog of bill denominations for MXN, USD, EUR
const DENOMINATIONS_CATALOG = {
  MXN: [
    { value: 1000, label: "Mil Pesos" },
    { value: 500, label: "Quinientos Pesos" },
    { value: 200, label: "Doscientos Pesos" },
    { value: 100, label: "Cien Pesos" },
    { value: 50, label: "Cincuenta Pesos" },
    { value: 20, label: "Veinte Pesos" },
    { value: 10, label: "Moneda de $10", isCoin: true },
    { value: 5, label: "Moneda de $5", isCoin: true },
    { value: 2, label: "Moneda de $2", isCoin: true },
    { value: 1, label: "Moneda de $1", isCoin: true }
  ],
  USD: [
    { value: 100, label: "One Hundred" },
    { value: 50, label: "Fifty Dollars" },
    { value: 20, label: "Twenty Dollars" },
    { value: 10, label: "Ten Dollars" },
    { value: 5, label: "Five Dollars" },
    { value: 2, label: "Two Dollars" },
    { value: 1, label: "One Dollar" }
  ],
  EUR: [
    { value: 500, label: "Five Hundred Euro" },
    { value: 200, label: "Two Hundred Euro" },
    { value: 100, label: "One Hundred Euro" },
    { value: 50, label: "Fifty Euro" },
    { value: 20, label: "Twenty Euro" },
    { value: 10, label: "Ten Euro" },
    { value: 5, label: "Five Euro" }
  ]
};

interface CorteCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: any;
  onShiftClosed: () => void;
}

export default function CorteCajaModal({ isOpen, onClose, activeShift, onShiftClosed }: CorteCajaModalProps) {
  const [step, setStep] = useState<"BLIND_COUNT" | "EXPENSES" | "RECONCILIATION" | "REPORT_PREVIEW">("BLIND_COUNT");
  const [activeCurrency, setActiveCurrency] = useState<"MXN" | "USD" | "EUR">("MXN");
  
  // Declared counts state: currency -> denomination -> count
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({
    MXN: { "1000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0 },
    USD: { "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0 },
    EUR: { "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0 }
  });

  // Expenses State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseConcept, setExpenseConcept] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState<"MXN" | "USD" | "EUR">("MXN");
  const [expenseReceipt, setExpenseReceipt] = useState<File | null>(null);
  const [addingExpense, setAddingExpense] = useState(false);

  // Reconciliation Results
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [heredarSaldos, setHeredarSaldos] = useState(true);

  // Loading States
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingCount, setSubmittingCount] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Report URLs
  const [reportUrl, setReportUrl] = useState("");

  useEffect(() => {
    if (isOpen && activeShift) {
      fetchCloseDetails();
    }
  }, [isOpen, activeShift]);

  const fetchCloseDetails = async () => {
    try {
      setLoadingDetails(true);
      const userId = localStorage.getItem("mock_user_id") || "user_cajero_1";
      const res = await fetch("/api/shifts/close-details", {
        headers: { "x-user-id": userId }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching close details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!isOpen || !activeShift) return null;

  const handleCountChange = (currency: string, denom: string, value: number) => {
    if (value < 0) return;
    setCounts(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [denom]: value
      }
    }));
  };

  const handleIncrement = (currency: string, denom: string) => {
    const current = counts[currency]?.[denom] || 0;
    handleCountChange(currency, denom, current + 1);
  };

  const handleDecrement = (currency: string, denom: string) => {
    const current = counts[currency]?.[denom] || 0;
    if (current > 0) {
      handleCountChange(currency, denom, current - 1);
    }
  };

  const getCurrencyTotal = (currency: "MXN" | "USD" | "EUR") => {
    const curCounts = counts[currency] || {};
    return Object.entries(curCounts).reduce((sum, [denom, count]) => {
      return sum + (Number(denom) * Number(count));
    }, 0);
  };

  // Expense Submission with Multipart Form Data
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseConcept || !expenseAmount) return;

    setAddingExpense(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("concept", expenseConcept);
      formData.append("amount", expenseAmount);
      formData.append("currency", expenseCurrency);
      formData.append("authorized_by", "ADMIN_MASTER");
      if (expenseReceipt) {
        formData.append("receipt", expenseReceipt);
      }

      const userId = localStorage.getItem("mock_user_id") || "user_cajero_1";
      const res = await fetch("/api/shifts/add-expense", {
        method: "POST",
        headers: {
          "x-user-id": userId
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setExpenses(prev => [
          {
            id: data.id,
            concept: expenseConcept,
            amount: parseFloat(expenseAmount),
            currency: expenseCurrency,
            authorized_by: "ADMIN_MASTER",
            receipt_image_url: data.receipt_image_url,
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
        setExpenseConcept("");
        setExpenseAmount("");
        setExpenseReceipt(null);
        setSuccessMsg("Gasto registrado y comprobante cargado en Supabase.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Error al agregar gasto");
      }
    } catch (error) {
      setErrorMsg("Error de comunicación al registrar gasto.");
    } finally {
      setAddingExpense(false);
    }
  };

  // Submit Blind Count
  const handleSubmitBlindCount = async () => {
    setSubmittingCount(true);
    setErrorMsg("");
    try {
      const userId = localStorage.getItem("mock_user_id") || "user_cajero_1";
      const res = await fetch("/api/shifts/close-blind", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({
          shift_id: activeShift.id,
          counts,
          heredarSaldos
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReconciliation(data.deviations);
        if (data.status === "PENDING_CLOSE_AUTHORIZATION") {
          setIsLocked(true);
          setStep("RECONCILIATION");
        } else {
          setIsLocked(false);
          setStep("RECONCILIATION");
        }
      } else {
        setErrorMsg(data.error || "No se pudo procesar el cuadre de caja.");
      }
    } catch (e) {
      setErrorMsg("Error de red al procesar el cuadre.");
    } finally {
      setSubmittingCount(false);
    }
  };

  // Handle Admin authorization
  const handleAuthorizeClose = async () => {
    setAuthorizing(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const managerId = "user_gerente_1"; // Level 5 admin profile
      const res = await fetch("/api/shifts/authorize-close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": managerId
        },
        body: JSON.stringify({
          shift_id: activeShift.id,
          heredarSaldos
        })
      });

      if (res.ok) {
        setSuccessMsg("¡Desviación Autorizada por Oficial de Cumplimiento! Generando arqueo final...");
        setIsLocked(false);
        setTimeout(() => {
          setStep("REPORT_PREVIEW");
          generateAndUploadPDF();
        }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "No se pudo autorizar el cierre.");
      }
    } catch (e) {
      setErrorMsg("Error de red al autorizar.");
    } finally {
      setAuthorizing(false);
    }
  };

  // Generate jsPDF Report and upload to Supabase Storage
  const generateAndUploadPDF = async () => {
    setGeneratingReport(true);
    try {
      // 1. Fetch closing details
      const userId = localStorage.getItem("mock_user_id") || "user_cajero_1";
      const resDetails = await fetch("/api/shifts/close-details", {
        headers: { "x-user-id": userId }
      });
      const details = await resDetails.json();

      const doc = new jsPDF();
      
      // Document styling & margins
      doc.setFillColor(30, 35, 41); // Deep slate banner
      doc.rect(0, 0, 210, 35, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("PAQUETE DIGITAL - CORTE DE CAJA GENERAL", 14, 22);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Folio Interno: ${activeShift.folio_documento}   |   Cajero: ${activeShift.nickname || activeShift.cajero_id}`, 14, 29);

      // Section 1: Desglose de Existencias
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.setFont("Helvetica", "bold");
      doc.text("I. DESGLOSE DE EXISTENCIAS (Inventario Físico Validado)", 14, 48);

      let currentY = 56;
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.text("Divisa", 14, currentY);
      doc.text("Cantidad Física", 50, currentY);
      doc.text("Saldo Esperado", 100, currentY);
      doc.text("Desviación", 150, currentY);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, currentY + 2, 196, currentY + 2);
      currentY += 8;

      doc.setFont("Helvetica", "normal");
      const currenciesList = ["MXN", "USD", "EUR", "USDT"];
      currenciesList.forEach(curr => {
        const dec = details.expectedBalances[curr] || 0;
        let physical = 0;
        if (counts[curr]) {
          Object.entries(counts[curr]).forEach(([denom, qty]) => {
            physical += Number(denom) * Number(qty);
          });
        }
        if (curr === "USDT") physical = dec; // auto-match for non-cash tokens

        const diff = physical - dec;

        doc.text(curr, 14, currentY);
        doc.text(`$${physical.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 50, currentY);
        doc.text(`$${dec.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 100, currentY);
        doc.text(`${diff >= 0 ? "+" : ""}$${diff.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 150, currentY);
        
        currentY += 6;
      });

      // Section 2: Resumen de Operaciones
      currentY += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("II. RESUMEN DE OPERACIONES (Compras y Ventas con Tipo de Cambio)", 14, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.text("Tipo", 14, currentY);
      doc.text("Cliente", 40, currentY);
      doc.text("Entrada", 80, currentY);
      doc.text("Salida", 120, currentY);
      doc.text("Tasa Cambio", 160, currentY);
      doc.line(14, currentY + 2, 196, currentY + 2);
      currentY += 8;

      doc.setFont("Helvetica", "normal");
      const allOps = [
        ...details.purchases.map((p: any) => ({ ...p, type: "COMPRA" })),
        ...details.sales.map((s: any) => ({ ...s, type: "VENTA" }))
      ];

      if (allOps.length === 0) {
        doc.text("No se realizaron operaciones en este turno.", 14, currentY);
        currentY += 8;
      } else {
        allOps.slice(0, 15).forEach((op: any) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(op.type, 14, currentY);
          doc.text((op.client_name || "Ventanilla General").substring(0, 18), 40, currentY);
          doc.text(`${op.amount_in.toLocaleString()} ${op.currency_in}`, 80, currentY);
          doc.text(`${op.amount_out.toLocaleString()} ${op.currency_out}`, 120, currentY);
          doc.text(`$${op.rate.toFixed(4)}`, 160, currentY);
          currentY += 6;
        });
      }

      // Section 3: Resumen de Gastos
      currentY += 10;
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("III. RESUMEN DE GASTOS / EGRESOS AUTORIZADOS", 14, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.text("Concepto", 14, currentY);
      doc.text("Monto", 100, currentY);
      doc.text("Comprobante", 140, currentY);
      doc.line(14, currentY + 2, 196, currentY + 2);
      currentY += 8;

      doc.setFont("Helvetica", "normal");
      if (expenses.length === 0) {
        doc.text("No se registraron egresos de caja en este turno.", 14, currentY);
        currentY += 8;
      } else {
        expenses.forEach((exp: any) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(exp.concept.substring(0, 45), 14, currentY);
          doc.text(`$${exp.amount.toLocaleString()} ${exp.currency}`, 100, currentY);
          doc.text(exp.receipt_image_url ? "CARGADO EN SUPABASE" : "SIN COMPROBANTE", 140, currentY);
          currentY += 6;
        });
      }

      // Bottom Footer Signatures
      currentY = 260;
      doc.line(20, currentY, 80, currentY);
      doc.line(130, currentY, 190, currentY);
      doc.setFontSize(8);
      doc.text("Firma de Cajero / Operador", 32, currentY + 4);
      doc.text("Firma de Auditor / Administrador", 140, currentY + 4);

      // Convert PDF to Blob
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], "reporte_cierre.pdf", { type: "application/pdf" });

      // Post PDF to server to trigger storage save
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("shift_id", activeShift.id);
      formData.append("sucursal_id", activeShift.branch_id || "MAIN_BRANCH");
      
      const today = new Date().toISOString().slice(0, 10);
      formData.append("fecha", today);

      const resPdf = await fetch("/api/shifts/save-pdf", {
        method: "POST",
        body: formData
      });

      if (resPdf.ok) {
        const resData = await resPdf.json();
        setReportUrl(resData.url);
        setSuccessMsg("¡Arqueo final guardado y respaldado exitosamente en Supabase Storage!");
      } else {
        // Local fallback url
        setReportUrl(`/uploads/cortes/${today}/${activeShift.branch_id || "MAIN_BRANCH"}/turno_${activeShift.id}.pdf`);
      }
    } catch (e) {
      console.error("PDF generation/upload failed:", e);
      setErrorMsg("Error al compilar el reporte digital final.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleFinalizeClose = () => {
    onShiftClosed();
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1e2329] border border-[#2b3139] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header banner */}
        <div className="flex items-center justify-between p-5 bg-[#181a20] border-b border-[#2b3139]">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-binance-yellow/10 rounded-xl text-binance-yellow">
              <Receipt size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">Corte de Caja General</h2>
              <p className="text-gray-400 text-[11px] font-mono">Folio: {activeShift.folio_documento} • {activeShift.nickname}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Progress bar */}
        <div className="grid grid-cols-4 border-b border-[#2b3139] text-xs font-bold text-gray-500 bg-[#12161a]/40 select-none">
          <div className={`p-3 text-center border-r border-[#2b3139] transition-all flex items-center justify-center gap-1 ${step === "BLIND_COUNT" ? "bg-binance-yellow text-black" : ""}`}>
            <Coins size={14} /> 1. Arqueo Ciego
          </div>
          <div className={`p-3 text-center border-r border-[#2b3139] transition-all flex items-center justify-center gap-1 ${step === "EXPENSES" ? "bg-binance-yellow text-black" : ""}`}>
            <Receipt size={14} /> 2. Registro Gastos
          </div>
          <div className={`p-3 text-center border-r border-[#2b3139] transition-all flex items-center justify-center gap-1 ${step === "RECONCILIATION" ? "bg-binance-yellow text-black" : ""}`}>
            <ShieldAlert size={14} /> 3. Cuadre Contable
          </div>
          <div className={`p-3 text-center transition-all flex items-center justify-center gap-1 ${step === "REPORT_PREVIEW" ? "bg-binance-yellow text-black" : ""}`}>
            <FileText size={14} /> 4. Reporte Digital
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5 font-semibold">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 font-semibold">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: BLIND COUNTING ("Arqueo Final") */}
          {step === "BLIND_COUNT" && (
            <div>
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-xs text-red-400 mb-6 font-medium">
                ⚠️ <strong>Auditoría Ciega Activa:</strong> Registre el conteo de existencias físicas reales en caja. No verá el saldo estimado del sistema para garantizar honestidad en el cierre.
              </div>

              {/* Currency selectors */}
              <div className="flex gap-2 mb-6 border-b border-[#2b3139]/40 pb-4">
                {(["MXN", "USD", "EUR"] as const).map(curr => {
                  const total = getCurrencyTotal(curr);
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setActiveCurrency(curr)}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center border ${
                        activeCurrency === curr 
                          ? "bg-binance-yellow text-black border-binance-yellow shadow-lg shadow-binance-yellow/10" 
                          : "bg-[#181a20] text-gray-400 border-[#2b3139] hover:bg-[#1e2329] hover:text-white"
                      }`}
                    >
                      <span>{curr}</span>
                      <span className={`text-[10px] mt-0.5 font-mono ${activeCurrency === curr ? "text-black/70" : "text-gray-500"}`}>
                        Declarado: ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Denominations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DENOMINATIONS_CATALOG[activeCurrency].map(item => {
                  const denomStr = String(item.value);
                  const qty = counts[activeCurrency]?.[denomStr] || 0;
                  const itemTotal = item.value * qty;

                  return (
                    <div 
                      key={item.value}
                      className="p-4 bg-[#181a20] rounded-xl border border-[#2b3139] hover:border-gray-500/40 transition-all flex flex-col justify-between h-32"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-lg font-extrabold tracking-tight">
                          {activeCurrency} ${item.value}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400 font-mono font-bold uppercase">
                          {item.isCoin ? "Moneda" : "Billete"}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-500 mt-1 truncate">{item.label}</div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs font-mono font-bold text-binance-yellow">
                          ${itemTotal.toLocaleString("es-MX")}
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#12161a] border border-[#2b3139] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleDecrement(activeCurrency, denomStr)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            value={qty || ""}
                            placeholder="0"
                            onChange={(e) => handleCountChange(activeCurrency, denomStr, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-10 bg-transparent text-center text-white font-bold font-mono text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(activeCurrency, denomStr)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: EXPENSES LOGGING */}
          {step === "EXPENSES" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Add Expense Form */}
              <div className="bg-[#181a20] p-6 rounded-2xl border border-[#2b3139] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#2b3139] pb-3 mb-2">
                  <Receipt className="text-binance-yellow" size={18} />
                  <h3 className="font-bold text-sm text-white">Declarar Egreso de Caja</h3>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Concepto / Motivo de Gasto</label>
                    <input
                      type="text"
                      required
                      value={expenseConcept}
                      onChange={e => setExpenseConcept(e.target.value)}
                      placeholder="Ej: Pago de papelería, limpieza o comisiones"
                      className="w-full bg-[#12161a] border border-[#2b3139] focus:border-binance-yellow p-3 rounded-xl text-xs text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto del Gasto</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#12161a] border border-[#2b3139] focus:border-binance-yellow p-3 rounded-xl text-xs font-mono text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Divisa</label>
                      <select
                        value={expenseCurrency}
                        onChange={e => setExpenseCurrency(e.target.value as any)}
                        className="w-full bg-[#12161a] border border-[#2b3139] focus:border-binance-yellow p-3 rounded-xl text-xs font-mono text-white focus:outline-none transition-colors"
                      >
                        <option value="MXN">MXN</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Comprobante de Pago (Imagen/PDF)</label>
                    <div className="relative border-2 border-dashed border-[#2b3139] hover:border-gray-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#12161a]/30">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={e => setExpenseReceipt(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-gray-400">
                        <Upload size={20} className="text-gray-500" />
                        {expenseReceipt ? (
                          <span className="text-binance-yellow font-medium">{expenseReceipt.name}</span>
                        ) : (
                          <span>Cargar comprobante digital</span>
                        )}
                        <span className="text-[10px] text-gray-500">Imágenes PNG, JPG o PDF</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingExpense}
                    className="w-full py-3 bg-binance-yellow text-black hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-400 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addingExpense ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    Registrar y Autorizar Egreso
                  </button>
                </form>
              </div>

              {/* Expenses List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2b3139] pb-3">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">Gastos Registrados en Turno</h3>
                  <span className="px-2.5 py-0.5 bg-binance-yellow/10 text-binance-yellow rounded-full font-mono text-[10px] font-bold">
                    {expenses.length} Gastos
                  </span>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181a20]/20 rounded-xl border border-dashed border-[#2b3139] text-gray-500">
                      <Receipt size={32} className="mb-2 text-gray-600" />
                      <p className="text-xs">No hay gastos ni retiros registrados en este turno.</p>
                    </div>
                  ) : (
                    expenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center p-3.5 bg-[#181a20] rounded-xl border border-[#2b3139] text-xs">
                        <div>
                          <div className="font-bold text-white mb-0.5">{exp.concept}</div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span>Aut: {exp.authorized_by}</span>
                            <span>•</span>
                            <span>{new Date(exp.created_at).toLocaleTimeString("es-MX")}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-mono font-bold text-red-400">
                            -${exp.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {exp.currency}
                          </span>
                          {exp.receipt_image_url && (
                            <a 
                              href={exp.receipt_image_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                              title="Ver comprobante"
                            >
                              <Eye size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECONCILIATION RESULT */}
          {step === "RECONCILIATION" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="text-center p-6 bg-[#181a20] rounded-2xl border border-[#2b3139]">
                {isLocked ? (
                  <>
                    <div className="inline-flex p-4 bg-red-500/10 text-red-500 rounded-full mb-3">
                      <ShieldAlert size={36} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">¡DIFERENCIAS DETECTADAS EN CAJA!</h3>
                    <p className="text-gray-400 text-xs mt-1.5 max-w-md mx-auto">
                      El arqueo físico declarado no coincide con los saldos del libro mayor (Partida Doble). Se requiere la firma y autorización de un Administrador (Nivel 5) para forzar el cierre.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-3">
                      <CheckCircle2 size={36} />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">CAJA CUADRADA EXITOSAMENTE</h3>
                    <p className="text-gray-400 text-xs mt-1.5">
                      Todo coincide perfectamente con las transacciones auditadas del turno actual. Puede proceder a resguardar el corte.
                    </p>
                  </>
                )}
              </div>

              {/* Dev Breakdown Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cuadre por Divisas:</h4>
                {reconciliation && Object.entries(reconciliation).map(([curr, info]: [string, any]) => {
                  const hasDiff = Math.abs(info.diff) > 0.01;
                  return (
                    <div 
                      key={curr} 
                      className={`flex justify-between items-center p-4 rounded-xl border ${
                        hasDiff ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white font-mono">{curr}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            hasDiff ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {hasDiff ? "Diferencia" : "Cuadrado"}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">
                          Físico: ${info.declared.toLocaleString()} vs Sistema: ${info.expected.toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-xs font-bold ${
                          info.diff > 0 ? "text-emerald-400" : info.diff < 0 ? "text-red-400" : "text-gray-400"
                        }`}>
                          {info.diff > 0 ? "+" : ""}{info.diff.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                        {hasDiff && (
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                            Equiv. {info.valueDiff > 0 ? "+" : ""}${info.valueDiff.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Heredar balances option */}
              <div className="p-4 bg-[#181a20] border border-[#2b3139] rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">Heredar saldos para el siguiente turno</h5>
                  <p className="text-[10px] text-gray-500">Inicializa la caja del siguiente cajero con los valores físicos actuales.</p>
                </div>
                <input
                  type="checkbox"
                  checked={heredarSaldos}
                  onChange={e => setHeredarSaldos(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2b3139] text-binance-yellow bg-[#12161a] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Authorization form or Continue button */}
              <div className="border-t border-[#2b3139] pt-6">
                {isLocked ? (
                  <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl text-center space-y-4">
                    <div className="flex items-center gap-2 justify-center text-red-400 font-bold text-xs uppercase tracking-wider">
                      <UserCheck size={16} /> Firma Digital de Oficial de Cumplimiento / Supervisor
                    </div>
                    <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                      Se registrará una desviación en la tabla <code className="text-red-300 font-mono">cash_deviations</code>. El supervisor con rol de Administrador Nivel 5 debe autorizar el asiento contable de ajuste.
                    </p>

                    <button
                      type="button"
                      onClick={handleAuthorizeClose}
                      disabled={authorizing}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      {authorizing ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} /> Autorizando en Core...
                        </>
                      ) : (
                        <>
                          <Check size={14} /> Autorizar Diferencias y Forzar Cierre
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("REPORT_PREVIEW");
                      generateAndUploadPDF();
                    }}
                    className="w-full py-4 bg-binance-yellow text-black hover:bg-yellow-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Guardar Corte y Generar Paquete Digital <ArrowRight size={16} />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* STEP 4: DIGITAL REPORT PREVIEW */}
          {step === "REPORT_PREVIEW" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                  <FileText size={28} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">PAQUETE DIGITAL COMPILADO</h3>
                <p className="text-gray-400 text-xs max-w-md mx-auto">
                  El reporte oficial en PDF ha sido encriptado y guardado de manera permanente en el repositorio de Supabase Storage.
                </p>
              </div>

              {/* Report links */}
              {generatingReport ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181a20] rounded-2xl border border-[#2b3139]">
                  <RefreshCw className="animate-spin text-binance-yellow mb-3" size={32} />
                  <p className="text-xs text-gray-400 font-medium">Generando PDF y respaldando en Supabase Storage...</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="p-4 bg-[#181a20] rounded-xl border border-[#2b3139] text-xs space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Estatus Repositorio</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sincronizado en Supabase
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Ruta Almacenada</span>
                      <span className="font-mono text-[10px] text-gray-300">/cortes/{new Date().toISOString().slice(0, 10)}/{activeShift.branch_id || "MAIN_BRANCH"}/turno_{activeShift.id}.pdf</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-[#2b3139] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} /> Ver PDF Digital
                    </a>
                    <a
                      href={reportUrl}
                      download={`Corte_Caja_Turno_${activeShift.id}.pdf`}
                      className="flex-1 py-3.5 px-4 bg-[#12161a] hover:bg-[#181a20] border border-binance-yellow text-binance-yellow rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Descargar PDF
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizeClose}
                    className="w-full mt-2 py-4 bg-binance-yellow text-black hover:bg-yellow-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-binance-yellow/10"
                  >
                    Cerrar Turno e Imprimir Acta <Check size={16} />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer with navigation */}
        <div className="p-5 bg-[#181a20] border-t border-[#2b3139] flex justify-between items-center text-xs">
          <div>
            {step === "BLIND_COUNT" && (
              <span className="text-gray-400">Paso 1 de 4</span>
            )}
            {step === "EXPENSES" && (
              <span className="text-gray-400">Paso 2 de 4</span>
            )}
            {step === "RECONCILIATION" && (
              <span className="text-gray-400">Paso 3 de 4</span>
            )}
            {step === "REPORT_PREVIEW" && (
              <span className="text-gray-400 font-bold text-emerald-400">Paso 4 de 4 - Finalizado</span>
            )}
          </div>

          <div className="flex gap-2">
            {step === "EXPENSES" && (
              <button
                type="button"
                onClick={() => setStep("BLIND_COUNT")}
                className="px-4 py-2 border border-[#2b3139] text-white hover:bg-white/5 rounded-lg font-bold"
              >
                Atrás
              </button>
            )}
            {step === "BLIND_COUNT" && (
              <button
                type="button"
                onClick={() => setStep("EXPENSES")}
                className="px-5 py-2.5 bg-[#12161a] hover:bg-[#181a20] text-binance-yellow border border-[#2b3139] rounded-lg font-bold flex items-center gap-1"
              >
                Registrar Gastos / Egresos <ArrowRight size={14} />
              </button>
            )}
            {step === "EXPENSES" && (
              <button
                type="button"
                onClick={handleSubmitBlindCount}
                disabled={submittingCount}
                className="px-5 py-2.5 bg-binance-yellow text-black hover:bg-yellow-500 rounded-lg font-bold flex items-center gap-1"
              >
                {submittingCount ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> Cuadrando...
                  </>
                ) : (
                  <>
                    Comparar y Cuadrar Caja <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

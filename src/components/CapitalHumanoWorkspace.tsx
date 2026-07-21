import React, { useState, useEffect } from 'react';
import { 
  Save, ShieldCheck, Fingerprint, RefreshCw, AlertCircle, UserPlus, CheckCircle2, 
  Briefcase, FileText, Lock, Download, ChevronRight, ChevronLeft, 
  UserCheck, FileCheck, Eye, History, User, Building, Upload, X, Globe, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CapitalHumanoWorkspaceProps {
  // Authentication & Profile
  profile: any;
  
  // Vault / Onboarding state
  vaultRecords: any[];
  loadingVault: boolean;
  fetchVaultRecords: () => Promise<void>;
  
  // Wizard state & operations
  wizardStep: number;
  setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  wizardData: any;
  setWizardData: React.Dispatch<React.SetStateAction<any>>;
  handleGenerateContracts: () => Promise<void>;
  isGenerating: boolean;
  generationResponse: any;
  setGenerationResponse: React.Dispatch<React.SetStateAction<any>>;
  formError: string | null;
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
  handleFinalizeOnboarding: () => Promise<void>;
  isFinalizing: boolean;
  finalSuccess: boolean;
  credentialsCreated: { auth_user_id: string; temp_password: string } | null;
  validateStep: (step: number) => boolean;

  // Branch state & operations
  branches: any[];
  selectedBranchId: string;
  handleBranchSelectChange: (id: string) => void;
  branchForm: any;
  setBranchForm: React.Dispatch<React.SetStateAction<any>>;
  logoPreview: string;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  savingBranch: boolean;
  handleSaveBranch: () => Promise<void>;
  branchError: string | null;
  branchSuccess: string | null;
  handleSyncInterface: () => Promise<void>;
  syncingInterface: boolean;
  handlePushFiscal: () => Promise<void>;
  syncingFiscal: boolean;
}

export default function CapitalHumanoWorkspace({
  profile,
  vaultRecords,
  loadingVault,
  fetchVaultRecords,
  wizardStep,
  setWizardStep,
  wizardData,
  setWizardData,
  handleGenerateContracts,
  isGenerating,
  generationResponse,
  setGenerationResponse,
  formError,
  setFormError,
  handleFinalizeOnboarding,
  isFinalizing,
  finalSuccess,
  credentialsCreated,
  validateStep,
  branches,
  selectedBranchId,
  handleBranchSelectChange,
  branchForm,
  setBranchForm,
  logoPreview,
  handleLogoChange,
  savingBranch,
  handleSaveBranch,
  branchError,
  branchSuccess,
  handleSyncInterface,
  syncingInterface,
  handlePushFiscal,
  syncingFiscal
}: CapitalHumanoWorkspaceProps) {
  // Navigation / Modal control state
  const [activeModal, setActiveModal] = useState<'pre-contratacion' | 'monitor-onboarding' | 'expediente-digital' | 'asignacion-operativa' | 'tipos-de-cambio' | 'alta-sucursal' | 'umbrales-seguridad' | null>(null);
  const [newCredentials, setNewCredentials] = useState<{auth_user_id: string; temp_password: string} | null>(null);
  
  // Security Threshold State
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [selectedThreshBranch, setSelectedThreshBranch] = useState<string>('MAIN_BRANCH');
  const [threshForm, setThreshForm] = useState({
    currency: 'USD',
    monto_maximo: ''
  });
  const [threshMessage, setThreshMessage] = useState<string | null>(null);
  const [isSavingThresh, setIsSavingThresh] = useState(false);
  const [branchTerminalStatus, setBranchTerminalStatus] = useState<any>(null);

  const fetchThresholds = async (branchId: string) => {
    setLoadingThresholds(true);
    setThreshMessage(null);
    try {
      const res = await fetch(`/api/security-thresholds?sucursal_id=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setThresholds(data.thresholds || []);
      }
    } catch (err) {
      console.error("Error fetching thresholds:", err);
    } finally {
      setLoadingThresholds(false);
    }
  };

  const fetchBranchTerminalStatus = async (branchId: string) => {
    try {
      const res = await fetch(`/api/terminal/status?sucursal_id=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setBranchTerminalStatus(data);
      }
    } catch (err) {
      console.error("Error fetching branch terminal status:", err);
    }
  };

  useEffect(() => {
    if (activeModal === 'umbrales-seguridad') {
      fetchThresholds(selectedThreshBranch);
      fetchBranchTerminalStatus(selectedThreshBranch);
    }
  }, [activeModal, selectedThreshBranch]);

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threshForm.monto_maximo || parseFloat(threshForm.monto_maximo) <= 0) {
      setThreshMessage("Error: Ingrese un monto máximo válido.");
      return;
    }
    setIsSavingThresh(true);
    setThreshMessage(null);
    try {
      const res = await fetch('/api/security-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sucursal_id: selectedThreshBranch,
          currency: threshForm.currency,
          monto_maximo: parseFloat(threshForm.monto_maximo)
        })
      });
      if (res.ok) {
        setThreshMessage("¡Umbral guardado exitosamente!");
        setThreshForm({ ...threshForm, monto_maximo: '' });
        fetchThresholds(selectedThreshBranch);
        fetchBranchTerminalStatus(selectedThreshBranch);
      } else {
        const err = await res.json();
        setThreshMessage(`Error: ${err.message || 'No se pudo guardar.'}`);
      }
    } catch (err) {
      setThreshMessage("Error de comunicación.");
    } finally {
      setIsSavingThresh(false);
    }
  };
  
  // Expediente digital local search state
  const [searchQuery, setSearchQuery] = useState('');

  // Asignación Operativa local states
  const [selectedCandidateCurp, setSelectedCandidateCurp] = useState<string>('');
  const [opBranch, setOpBranch] = useState<string>('MAIN_BRANCH');
  const [opRole, setOpRole] = useState<string>('Cajero de Ventanilla');

  // Interactive Live Currency Rates local state
  const [rates, setRates] = useState<any>({
    USD: { buy: 18.45, sell: 19.55 },
    EUR: { buy: 20.10, sell: 21.30 },
    GBP: { buy: 23.45, sell: 24.80 },
    CAD: { buy: 13.60, sell: 14.45 },
    USDT: { buy: 17.05, sell: 17.10 }
  });
  const [lastRatesUpdate, setLastRatesUpdate] = useState<string>('');
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSuccess, setRatesSuccess] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Fetch live market rates from the backend API
  const fetchLiveRates = async () => {
    setLoadingRates(true);
    setRatesError(null);
    try {
      const res = await fetch('/api/rates/live');
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const loadedRates: any = {};
          Object.keys(data.rates).forEach(key => {
            const code = key.split('_')[0];
            if (code !== 'MXN') {
              loadedRates[code] = {
                buy: data.rates[key].buy,
                sell: data.rates[key].sell
              };
            }
          });
          setRates(loadedRates);
          
          // Find the latest timestamp
          const timestamps = Object.values(data.rates).map((r: any) => r.timestamp);
          if (timestamps.length > 0) {
            const latest = new Date(Math.max(...timestamps.map((t: any) => new Date(t).getTime())));
            setLastRatesUpdate(latest.toLocaleTimeString() + ' ' + latest.toLocaleDateString());
          } else {
            setLastRatesUpdate(new Date().toLocaleString());
          }
        }
      }
    } catch (err) {
      console.error("Error loading rates from API:", err);
    } finally {
      setLoadingRates(false);
    }
  };

  // Sync and save edited Currency Rates via API
  const handleSaveRates = async () => {
    setSavingRates(true);
    setRatesError(null);
    setRatesSuccess(null);
    try {
      const res = await fetch('/api/rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates })
      });
      if (res.ok) {
        setRatesSuccess("¡Tipos de cambio actualizados exitosamente en caché de red (Redis/Core)!");
        await fetchLiveRates();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Error al actualizar los tipos de cambio en el servidor legado.");
      }
    } catch (err: any) {
      setRatesError(err.message || "Fallo en la comunicación remota con la Boveda.");
    } finally {
      setSavingRates(false);
    }
  };

  // Automatically fetch rates when Currency Rates modal opens
  useEffect(() => {
    if (activeModal === 'tipos-de-cambio') {
      fetchLiveRates();
    }
  }, [activeModal]);

  // Counts & calculations for UI badges
  const pendingFinalization = vaultRecords.filter(r => !r.is_finalized);
  const finalizedCount = vaultRecords.filter(r => r.is_finalized).length;

  // Wizard Step operations
  const handleNext = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setFormError(null);
    setWizardStep(prev => prev - 1);
  };

  // Branch data inheritance definitions
  const currentMatriz = branches.find(b => b.es_matriz === 1);
  const isSecondaryBranch = !branchForm.es_matriz || branchForm.es_matriz === 0;
  const displayRazonSocial = isSecondaryBranch ? (currentMatriz?.razon_social || '') : branchForm.razon_social;
  const displayRfc = isSecondaryBranch ? (currentMatriz?.rfc || '') : branchForm.rfc;
  const displayLicenciaCnbv = isSecondaryBranch ? (currentMatriz?.licencia_cnbv || '') : branchForm.licencia_cnbv;

  // Custom Finalization with override (Asignación Operativa)
  const handleAssignAndFinalize = async (candidate: any) => {
    setFormError(null);
    // Sync local state
    setWizardData((prev: any) => ({
      ...prev,
      curp: candidate.curp,
      nombre_completo: candidate.full_name,
      puesto: opRole,
      sucursal: opBranch
    }));

    try {
      const savedUserId = localStorage.getItem('mock_user_id') || 'user_gerente_1';
      const response = await fetch('/api/hr/vault/finalize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': savedUserId
        },
        body: JSON.stringify({ curp: candidate.curp })
      });

      const resData = await response.json();
      if (response.ok) {
        // Success: Save credentials & refresh
        if (resData.auth_user_id && resData.temp_password) {
          setNewCredentials({
            auth_user_id: resData.auth_user_id,
            temp_password: resData.temp_password
          });
        }
        await fetchVaultRecords();
        setActiveModal(null);
        setSelectedCandidateCurp('');
      } else {
        setFormError(resData.error || 'No se pudo consolidar la asignación en Supabase.');
      }
    } catch (err) {
      setFormError('Fallo en el canal de comunicación con el Core Bancario.');
    }
  };

  // ----------------------------------------------------
  // SECURITY CHECK: Soft Check for visualization
  // ----------------------------------------------------
  const isAuthorized = profile && profile.role_level >= 5;

  return (
    <div className="space-y-8 w-full">
      {/* CREDENTIALS SUCCESS OVERLAY — shown after onboarding finalization */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1117] border-2 border-emerald-500/40 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10"
          >
            <div className="text-center space-y-5">
              <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Alta Consolidada</h3>
                <p className="text-xs text-gray-400 mt-1">
                  El operador ha sido registrado en el sistema. Comparta estas credenciales de forma segura.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 space-y-3 text-left">
                <div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Usuario</span>
                  <div className="flex items-center gap-2 mt-1 bg-black/40 rounded-lg px-3 py-2 border border-[#21262d]">
                    <User size={14} className="text-blue-400 shrink-0" />
                    <code className="text-sm text-white font-mono break-all select-all">{newCredentials.auth_user_id}</code>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Contraseña Temporal</span>
                  <div className="flex items-center gap-2 mt-1 bg-black/40 rounded-lg px-3 py-2 border border-[#21262d]">
                    <Lock size={14} className="text-yellow-400 shrink-0" />
                    <code className="text-sm text-white font-mono select-all">{newCredentials.temp_password}</code>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-[10px] text-yellow-400 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>El operador deberá cambiar su contraseña en el primer inicio de sesión. Estas credenciales <strong>no se mostrarán de nuevo</strong>.</span>
                </p>
              </div>

              <button
                onClick={() => setNewCredentials(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Entendido — Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {!isAuthorized && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-left">
          <div className="flex items-center gap-2">
            <Lock size={16} className="shrink-0 animate-pulse text-binance-yellow" />
            <span>
              <strong>Acceso de Simulación / Vista Previa:</strong> Su rol actual ({profile?.nickname || 'Invitado'}) no cuenta con privilegios administrativos de <strong>Nivel 5 (Acceso Total)</strong>. Se le permite visualizar todos los módulos para pruebas de control y herencia fiscal.
            </span>
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('mock_user_id', 'user_gerente_1');
              window.location.reload();
            }}
            className="shrink-0 px-3 py-1 bg-binance-yellow text-black font-black rounded-lg text-[10px] uppercase hover:brightness-110 transition-all cursor-pointer"
          >
            Elevar Privilegios (ADMIN_MASTER)
          </button>
        </div>
      )}
      
      {/* ----------------------------------------------------------------------------------- */}
      {/* DASHBOARD PRINCIPAL: REDISEÑO DE DOS COLUMNAS DE SUB-MÓDULOS */}
      {/* ----------------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SUB-MÓDULO 1: CAPITAL HUMANO */}
        <div className="bg-gradient-to-b from-[#1c2227] to-[#151a1e] border border-[#2b3139] rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-binance-yellow/10 text-binance-yellow rounded-2xl border border-binance-yellow/20">
                <Briefcase size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-binance-yellow uppercase tracking-widest block">Módulo Talento</span>
                <h2 className="text-lg font-bold text-white mt-0.5">Capital Humano & LegalTech</h2>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Gestione con seguridad el ciclo de vida del personal en ventanilla y caja. Cree expedientes, automatice contratos de trabajo y vigile el estatus documental regulado.
            </p>

            {/* BOTONES DE ACCIÓN DE CAPITAL HUMANO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Botón 1: Pre-contratación */}
              <button
                id="btn-open-precontratacion"
                onClick={() => {
                  setWizardStep(1);
                  setFormError(null);
                  setActiveModal('pre-contratacion');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <UserPlus size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase tracking-wider">
                    Firma PDF
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Pre-contratación</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Wizard de 4 pasos para contratos</p>
                </div>
              </button>

              {/* Botón 2: Monitor de Onboarding */}
              <button
                id="btn-open-onboarding"
                onClick={() => {
                  setFormError(null);
                  setActiveModal('monitor-onboarding');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <History size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  {pendingFinalization.length > 0 && (
                    <span className="text-[9px] px-2 py-0.5 bg-amber-500/15 text-amber-500 border border-amber-500/20 rounded-full font-bold">
                      {pendingFinalization.length} pendientes
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Monitor Onboarding</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Pipeline visual de candidatos</p>
                </div>
              </button>

              {/* Botón 3: Expediente Digital */}
              <button
                id="btn-open-expedientes"
                onClick={() => {
                  setFormError(null);
                  setActiveModal('expediente-digital');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FileText size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-binance-yellow/10 text-binance-yellow border border-binance-yellow/20 rounded-full font-bold">
                    {finalizedCount} activos
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Expediente Digital</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Bóveda de Supabase Storage</p>
                </div>
              </button>

              {/* Botón 4: Asignación Operativa */}
              <button
                id="btn-open-asignacion"
                onClick={() => {
                  setFormError(null);
                  setActiveModal('asignacion-operativa');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <UserCheck size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-black uppercase tracking-wider">
                    Asignar
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Asignación Operativa</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Enlazar personal a sucursal y rol</p>
                </div>
              </button>

            </div>
          </div>
          <div className="mt-8 border-t border-[#2b3139]/50 pt-4 flex items-center justify-between text-[11px] text-gray-500">
            <span>Repositorio LegalTech Cifrado</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Supabase Storage Online
            </span>
          </div>
        </div>

        {/* SUB-MÓDULO 2: CONFIGURACIÓN DE SISTEMA */}
        <div className="bg-gradient-to-b from-[#1c2227] to-[#151a1e] border border-[#2b3139] rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-binance-yellow/10 text-binance-yellow rounded-2xl border border-binance-yellow/20">
                <Building size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-binance-yellow uppercase tracking-widest block">Módulo Técnico</span>
                <h2 className="text-lg font-bold text-white mt-0.5">Configuración de Sistema</h2>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              Administre la infraestructura técnica y los parámetros de divisas del Core. Gestione la red de sucursales físicas, la herencia de datos fiscales y la previsualización del ticket de caja.
            </p>

            {/* BOTONES DE CONFIGURACIÓN DE SISTEMA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Botón 1: Tipos de Cambio */}
              <button
                id="btn-open-rates"
                onClick={() => {
                  setRatesSuccess(null);
                  setRatesError(null);
                  setActiveModal('tipos-de-cambio');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <RefreshCw size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-yellow-500/10 text-binance-yellow border border-yellow-500/20 rounded-full font-black uppercase tracking-wider">
                    Core FX
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Tipos de Cambio</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Tasas de compra/venta divisas</p>
                </div>
              </button>

              {/* Botón 2: Alta de Sucursal */}
              <button
                id="btn-open-branch"
                onClick={() => {
                  setFormError(null);
                  setActiveModal('alta-sucursal');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Building size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-bold">
                    {branches.length} Sucursales
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Alta de Sucursal</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Identidad de nodos CNBV & Ticket</p>
                </div>
              </button>

              {/* Botón 3: Umbrales de Seguridad */}
              <button
                id="btn-open-umbrales"
                onClick={() => {
                  setFormError(null);
                  setThreshMessage(null);
                  setActiveModal('umbrales-seguridad');
                }}
                className="group p-5 bg-[#1e2329]/70 hover:bg-[#1e2329] border border-[#2b3139]/80 hover:border-binance-yellow/50 rounded-2xl text-left transition-all flex flex-col justify-between h-32 focus:outline-none"
              >
                <div className="flex items-center justify-between w-full">
                  <ShieldCheck size={20} className="text-gray-400 group-hover:text-binance-yellow transition-colors" />
                  <span className="text-[9px] px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-black uppercase tracking-wider">
                    VaaS Shield
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-binance-yellow transition-colors">Umbrales de Caja</h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">Límites y Bloqueos de Seguridad</p>
                </div>
              </button>

            </div>
          </div>
          <div className="mt-8 border-t border-[#2b3139]/50 pt-4 flex items-center justify-between text-[11px] text-gray-500">
            <span>Sincronización de Terminales Activa</span>
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Nodos de Liquidez Sincronizados
            </span>
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------------------------------------- */}
      {/* SECCIÓN DE MODALES DE PANTALLA COMPLETA (OVERLAYS EXCLUSIVOS) */}
      {/* ----------------------------------------------------------------------------------- */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#080b0e]/95 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-[#151a1e] border border-[#2b3139] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
              
              {/* Cabecera del Modal */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#2b3139] bg-black/25">
                <div>
                  <span className="text-[9px] font-black uppercase text-binance-yellow tracking-widest block">Módulo de Configuración Bancaria</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    {activeModal === 'pre-contratacion' && <><UserPlus size={18} className="text-binance-yellow" /> Pre-contratación y Generación Documental</>}
                    {activeModal === 'monitor-onboarding' && <><History size={18} className="text-binance-yellow" /> Monitor de Onboarding (Pipeline Board)</>}
                    {activeModal === 'expediente-digital' && <><FileText size={18} className="text-binance-yellow" /> Bóveda de Expedientes (Supabase Storage)</>}
                    {activeModal === 'asignacion-operativa' && <><UserCheck size={18} className="text-binance-yellow" /> Asignación Operativa y Alta Definitiva</>}
                    {activeModal === 'tipos-de-cambio' && <><RefreshCw size={18} className="text-binance-yellow" /> Captura Legada de Tipos de Cambio Core</>}
                    {activeModal === 'alta-sucursal' && <><Building size={18} className="text-binance-yellow" /> Alta de Sucursal y Registro Corporativo CNBV</>}
                    {activeModal === 'umbrales-seguridad' && <><ShieldCheck size={18} className="text-binance-yellow" /> Umbrales de Seguridad Física y Bloqueos Automáticos (VaaS)</>}
                  </h3>
                </div>
                
                {/* Botón Cerrar */}
                <button
                  id="modal-close-button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-[#1e2329] hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cuerpo del Modal (Scrollable) */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* Error Banner General */}
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-3">
                    <AlertCircle className="shrink-0 animate-pulse" size={16} />
                    <span className="break-words font-medium">{formError}</span>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 1. PRE-CONTRATACIÓN */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'pre-contratacion' && (
                  <div className="space-y-6">
                    {/* Stepper horizontal elegante */}
                    <div className="flex items-center justify-between pb-4 max-w-xl mx-auto border-b border-[#2b3139]/40 mb-6">
                      {[
                        { step: 1, label: 'Identidad' },
                        { step: 2, label: 'Laboral' },
                        { step: 3, label: 'Referencias' },
                        { step: 4, label: 'Generación' }
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            wizardStep === item.step 
                              ? 'bg-binance-yellow text-black font-black ring-4 ring-binance-yellow/20' 
                              : wizardStep > item.step 
                              ? 'bg-emerald-500 text-black font-bold' 
                              : 'bg-[#2b3139] text-gray-400'
                          }`}>
                            {wizardStep > item.step ? '✓' : item.step}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider hidden md:block ${
                            wizardStep === item.step ? 'text-white' : 'text-gray-500'
                          }`}>
                            {item.label}
                          </span>
                          {item.step < 4 && <div className="h-0.5 w-6 bg-[#2b3139]" />}
                        </div>
                      ))}
                    </div>

                    {/* PASO 1: CAPTURA DE IDENTIDAD */}
                    {wizardStep === 1 && (
                      <div className="space-y-4 max-w-4xl mx-auto">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#2b3139]/40 pb-2 mb-4">
                          Paso 1: Información de Identidad del Colaborador
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Nombre Completo (como figura en ID)</label>
                            <input
                              type="text"
                              required
                              value={wizardData.nombre_completo}
                              onChange={(e) => setWizardData({...wizardData, nombre_completo: e.target.value.toUpperCase()})}
                              placeholder="EJ. FRANCISCO JAVIER HERNÁNDEZ LÓPEZ"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lugar de Nacimiento (Entidad Federativa)</label>
                            <input
                              type="text"
                              required
                              value={wizardData.lugar_nacimiento}
                              onChange={(e) => setWizardData({...wizardData, lugar_nacimiento: e.target.value.toUpperCase()})}
                              placeholder="EJ. CIUDAD DE MÉXICO"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Fecha de Nacimiento</label>
                            <input
                              type="date"
                              required
                              value={wizardData.fecha_nacimiento}
                              onChange={(e) => setWizardData({...wizardData, fecha_nacimiento: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none [color-scheme:dark]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado Civil</label>
                            <select
                              value={wizardData.estado_civil}
                              onChange={(e) => setWizardData({...wizardData, estado_civil: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            >
                              <option value="SOLTERO(A)">SOLTERO(A)</option>
                              <option value="CASADO(A)">CASADO(A)</option>
                              <option value="DIVORCIADO(A)">DIVORCIADO(A)</option>
                              <option value="VIUDO(A)">VIUDO(A)</option>
                              <option value="UNIÓN LIBRE">UNIÓN LIBRE</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">RFC (con homoclave)</label>
                            <input
                              type="text"
                              maxLength={13}
                              value={wizardData.rfc}
                              onChange={(e) => setWizardData({...wizardData, rfc: e.target.value.toUpperCase()})}
                              placeholder="EJ. HELF891204H30"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CURP (18 caracteres)</label>
                            <input
                              type="text"
                              maxLength={18}
                              value={wizardData.curp}
                              onChange={(e) => setWizardData({...wizardData, curp: e.target.value.toUpperCase()})}
                              placeholder="EJ. HELF891204HDFNRS02"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Domicilio Completo Actual</label>
                            <input
                              type="text"
                              value={wizardData.domicilio}
                              onChange={(e) => setWizardData({...wizardData, domicilio: e.target.value.toUpperCase()})}
                              placeholder="CALLE, NUMERO, COLONIA, ALCALDÍA, ESTADO, C.P."
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASO 2: CONDICIONES LABORALES */}
                    {wizardStep === 2 && (
                      <div className="space-y-4 max-w-4xl mx-auto">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#2b3139]/40 pb-2 mb-4">
                          Paso 2: Condiciones y Parámetros del Puesto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Puesto Operativo asignado</label>
                            <select
                              value={wizardData.puesto}
                              onChange={(e) => setWizardData({...wizardData, puesto: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            >
                              <option value="Cajero de Ventanilla">CAJERO DE VENTANILLA</option>
                              <option value="Cajero Principal">CAJERO PRINCIPAL / BOVEDERO</option>
                              <option value="Gerente de Sucursal">GERENTE DE SUCURSAL</option>
                              <option value="Oficial de Cumplimiento">OFICIAL DE CUMPLIMIENTO</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Sueldo Bruto Mensual (MXN)</label>
                            <input
                              type="number"
                              value={wizardData.sueldo_mensual}
                              onChange={(e) => setWizardData({...wizardData, sueldo_mensual: e.target.value})}
                              placeholder="EJ. 18000"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Sucursal de Asignación Física</label>
                            <select
                              value={wizardData.sucursal}
                              onChange={(e) => setWizardData({...wizardData, sucursal: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            >
                              {branches.map(b => (
                                <option key={b.sucursal_id} value={b.sucursal_id}>{b.nombre}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Fecha de Inicio de Labores</label>
                            <input
                              type="date"
                              value={wizardData.fecha_inicio}
                              onChange={(e) => setWizardData({...wizardData, fecha_inicio: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none [color-scheme:dark]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Número de Seguridad Social (NSS - 11 dígitos)</label>
                            <input
                              type="text"
                              maxLength={11}
                              value={wizardData.nss}
                              onChange={(e) => setWizardData({...wizardData, nss: e.target.value.replace(/\D/g, '')})}
                              placeholder="EJ. 34128945672"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estatus de Crédito INFONAVIT / FONACOT</label>
                            <select
                              value={wizardData.infonavit_fonacot}
                              onChange={(e) => setWizardData({...wizardData, infonavit_fonacot: e.target.value})}
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            >
                              <option value="NINGUNO">NINGUNO</option>
                              <option value="INFONAVIT ACTIVO">CRÉDITO INFONAVIT ACTIVO</option>
                              <option value="FONACOT ACTIVO">CRÉDITO FONACOT ACTIVO</option>
                              <option value="AMBOS ACTIVOS">AMBOS ACTIVOS</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Prestaciones y Beneficios Extra-Legales</label>
                            <input
                              type="text"
                              value={wizardData.prestaciones}
                              onChange={(e) => setWizardData({...wizardData, prestaciones: e.target.value.toUpperCase()})}
                              placeholder="VALES DE DESPENSA, FONDO DE AHORRO, COBERTURA DE SEGURO MEDICO"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 ring-binance-yellow/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASO 3: REFERENCIAS Y COMPROBACIONES */}
                    {wizardStep === 3 && (
                      <div className="space-y-4 max-w-4xl mx-auto">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#2b3139]/40 pb-2 mb-4">
                          Paso 3: Referencias y Expediente Físico
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/10 p-5 rounded-2xl border border-[#2b3139]/60">
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest text-binance-yellow">Referencia Personal 1</h4>
                            <input
                              type="text"
                              value={wizardData.referencia1_nombre}
                              onChange={(e) => setWizardData({...wizardData, referencia1_nombre: e.target.value.toUpperCase()})}
                              placeholder="Nombre Completo"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                maxLength={10}
                                value={wizardData.referencia1_telefono}
                                onChange={(e) => setWizardData({...wizardData, referencia1_telefono: e.target.value.replace(/\D/g, '')})}
                                placeholder="Teléfono"
                                className="bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                              />
                              <input
                                type="text"
                                value={wizardData.referencia1_parentesco}
                                onChange={(e) => setWizardData({...wizardData, referencia1_parentesco: e.target.value.toUpperCase()})}
                                placeholder="Parentesco"
                                className="bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest text-binance-yellow">Referencia Personal 2</h4>
                            <input
                              type="text"
                              value={wizardData.referencia2_nombre}
                              onChange={(e) => setWizardData({...wizardData, referencia2_nombre: e.target.value.toUpperCase()})}
                              placeholder="Nombre Completo"
                              className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                maxLength={10}
                                value={wizardData.referencia2_telefono}
                                onChange={(e) => setWizardData({...wizardData, referencia2_telefono: e.target.value.replace(/\D/g, '')})}
                                placeholder="Teléfono"
                                className="bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                              />
                              <input
                                type="text"
                                value={wizardData.referencia2_parentesco}
                                onChange={(e) => setWizardData({...wizardData, referencia2_parentesco: e.target.value.toUpperCase()})}
                                placeholder="Parentesco"
                                className="bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Acreditación de Documentos de Soporte</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { key: 'doc_id_oficial', label: 'Identificación Oficial INE', desc: 'Obligatorio.' },
                              { key: 'doc_acta_nacimiento', label: 'Acta de Nacimiento Certificada', desc: 'Regulación CNBV.' },
                              { key: 'doc_comprobante_domicilio', label: 'Comprobante de Domicilio (< 3 meses)', desc: 'Validación de residencia.' },
                              { key: 'doc_cartas_recomendacion', label: 'Cartas de Recomendación Laboral (2)', desc: 'Validación histórica.' }
                            ].map(d => (
                              <label key={d.key} className="flex items-center gap-3 p-3 bg-black/20 border border-[#2b3139] rounded-xl cursor-pointer hover:bg-white/5">
                                <input
                                  type="checkbox"
                                  checked={wizardData[d.key]}
                                  onChange={(e) => setWizardData({...wizardData, [d.key]: e.target.checked})}
                                  className="w-4 h-4 accent-binance-yellow rounded"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white block">{d.label}</span>
                                  <span className="text-[10px] text-gray-500">{d.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASO 4: GENERACIÓN AUTOMATIZADA DE PDFS (CONTRATO, PRIVACIDAD, CONTRATACIÓN) */}
                    {wizardStep === 4 && (
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <p className="text-xs text-gray-300">
                          Haga clic en el botón a continuación para inyectar los metadatos de <strong className="text-binance-yellow">{wizardData.nombre_completo}</strong> en las plantillas legales y emitir los tres instrumentos legalTech obligatorios para firma digital.
                        </p>

                        {!generationResponse ? (
                          <div className="p-8 text-center border border-dashed border-[#2b3139] rounded-2xl bg-black/10">
                            <button
                              onClick={handleGenerateContracts}
                              disabled={isGenerating}
                              className="px-6 py-3 bg-binance-yellow hover:bg-yellow-500 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 mx-auto transition-all shadow-lg"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                  GENERANDO EXPEDIENTE LEGAL EN SUPABASE...
                                </>
                              ) : (
                                <>
                                  <Fingerprint size={16} /> GENERAR DOCUMENTOS JURÍDICOS
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-3">
                              <CheckCircle2 size={16} /> Contrato de trabajo y avisos regulatorios resguardados y vinculados al candidato.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-black/20 border border-[#2b3139] p-4 rounded-xl flex flex-col justify-between h-36">
                                <div>
                                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold uppercase rounded-full">
                                    Contrato de Trabajo
                                  </span>
                                  <h4 className="text-xs font-bold text-white mt-2">Contrato Individual</h4>
                                </div>
                                <a
                                  href={generationResponse.contrato}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#2b3139] hover:bg-[#363c44] text-white font-bold py-1.5 rounded-lg text-[10px] text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Eye size={12} /> Ver Contrato
                                </a>
                              </div>

                              <div className="bg-black/20 border border-[#2b3139] p-4 rounded-xl flex flex-col justify-between h-36">
                                <div>
                                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold uppercase rounded-full">
                                    Aviso de Privacidad
                                  </span>
                                  <h4 className="text-xs font-bold text-white mt-2">Uso de Biometría</h4>
                                </div>
                                <a
                                  href={generationResponse.aviso_privacidad}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#2b3139] hover:bg-[#363c44] text-white font-bold py-1.5 rounded-lg text-[10px] text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Eye size={12} /> Ver Privacidad
                                </a>
                              </div>

                              <div className="bg-black/20 border border-[#2b3139] p-4 rounded-xl flex flex-col justify-between h-36">
                                <div>
                                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold uppercase rounded-full">
                                    Aviso de Contratación
                                  </span>
                                  <h4 className="text-xs font-bold text-white mt-2">Acreditación CNBV</h4>
                                </div>
                                <a
                                  href={generationResponse.aviso_contratacion}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#2b3139] hover:bg-[#363c44] text-white font-bold py-1.5 rounded-lg text-[10px] text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Eye size={12} /> Ver Aviso
                                </a>
                              </div>
                            </div>

                            <div className="p-4 bg-[#1e2329] border border-[#2b3139] rounded-xl text-center">
                              <p className="text-[10px] text-gray-400">
                                El expediente electrónico ha sido generado exitosamente. Cierre esta ventana y acceda a <strong>Monitor de Onboarding</strong> o <strong>Asignación Operativa</strong> para su adscripción física y firma legal.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones de navegación del Wizard */}
                    <div className="pt-5 border-t border-[#2b3139]/40 flex justify-between items-center">
                      <button
                        onClick={handleBack}
                        disabled={wizardStep === 1 || isGenerating}
                        className="px-4 py-2 bg-[#2b3139] hover:bg-[#363c44] disabled:opacity-20 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft size={14} /> Atrás
                      </button>

                      {wizardStep < 4 ? (
                        <button
                          onClick={handleNext}
                          className="px-5 py-2 bg-binance-yellow hover:bg-yellow-500 text-black font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                        >
                          Siguiente <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setWizardStep(1);
                            setGenerationResponse(null);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-colors"
                        >
                          Reiniciar Wizard
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 2. MONITOR DE ONBOARDING */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'monitor-onboarding' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-black/20 border border-[#2b3139] rounded-2xl">
                      <p className="text-xs text-gray-400">
                        Vigile el estatus legal de los colaboradores. La columna <strong>Firma Pendiente</strong> muestra los colaboradores que ya cuentan con contratos emitidos en Supabase pero no han sido adscritos físicamente.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* COLUMNA 1: CAPTURA E INDUCCIÓN */}
                      <div className="bg-black/15 border border-[#2b3139]/60 rounded-2xl p-4 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2b3139]/40">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Captura e Inducción</span>
                          <span className="text-[9px] px-2 py-0.5 bg-binance-yellow/15 border border-binance-yellow/20 text-binance-yellow font-black rounded">
                            En Proceso
                          </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {wizardData.nombre_completo ? (
                            <div className="bg-[#1e2329]/60 border border-binance-yellow/20 p-3 rounded-xl space-y-2 text-left w-full min-w-0">
                              <div className="font-bold text-white text-xs truncate break-all block w-full whitespace-normal leading-normal">
                                {wizardData.nombre_completo}
                              </div>
                              <div className="text-[9px] text-gray-400 font-mono truncate block w-full">
                                CURP: {wizardData.curp || 'PENDIENTE'}
                              </div>
                              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#2b3139]/30">
                                <span className="text-binance-yellow uppercase font-bold truncate max-w-[100px] block">
                                  {wizardData.puesto}
                                </span>
                                <span className="text-gray-500 font-semibold shrink-0">Paso {wizardStep}/4</span>
                              </div>
                            </div>
                          ) : null}

                          <div className="bg-[#1e2329]/20 border border-dashed border-[#2b3139]/50 p-4 rounded-xl text-center text-gray-500 text-[10px] leading-relaxed">
                            Formulario activo en el sub-módulo de Pre-contratación.
                          </div>
                        </div>
                      </div>

                      {/* COLUMNA 2: PRE-CONTRATO EMITIDO */}
                      <div className="bg-black/15 border border-[#2b3139]/60 rounded-2xl p-4 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2b3139]/40">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Pre-contrato Emitido</span>
                          <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black rounded">
                            Firma Pendiente
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {pendingFinalization.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 text-xs">Sin perfiles en espera de adscripción.</div>
                          ) : (
                            pendingFinalization.map((candidate) => (
                              <div key={candidate.id} className="bg-[#1e2329] border border-[#2b3139] p-3 rounded-xl space-y-2 hover:border-binance-yellow/30 transition-all text-left w-full min-w-0">
                                <div className="font-bold text-white text-xs truncate break-all block w-full whitespace-normal leading-normal" title={candidate.full_name}>
                                  {candidate.full_name}
                                </div>
                                <div className="text-[9px] text-gray-400 font-mono truncate block w-full">
                                  CURP: {candidate.curp}
                                </div>
                                <div className="flex justify-between items-center text-[9px] pt-1 border-t border-[#2b3139]/30 gap-2 overflow-hidden">
                                  <span className="text-gray-400 truncate block max-w-[100px]">{candidate.puesto}</span>
                                  <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 text-[8px] font-bold uppercase">
                                    PDF Listo
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* COLUMNA 3: ALTA CONSOLIDADA (OPERATIVO) */}
                      <div className="bg-black/15 border border-[#2b3139]/60 rounded-2xl p-4 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2b3139]/40">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. Alta Consolidada</span>
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded">
                            Activo / Operativo
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {vaultRecords.filter(r => r.is_finalized).length === 0 ? (
                            <div className="py-12 text-center text-gray-500 text-xs">Ningún operador acreditado en la sesión actual.</div>
                          ) : (
                            vaultRecords.filter(r => r.is_finalized).map((candidate) => (
                              <div key={candidate.id} className="bg-[#1e2329] border border-emerald-500/10 p-3 rounded-xl space-y-2 text-left w-full min-w-0">
                                <div className="font-bold text-white text-xs truncate break-all block w-full whitespace-normal leading-normal" title={candidate.full_name}>
                                  {candidate.full_name}
                                </div>
                                <div className="text-[9px] text-gray-400 font-mono truncate block w-full">
                                  CURP: {candidate.curp}
                                </div>
                                <div className="flex justify-between items-center text-[9px] pt-1 border-t border-[#2b3139]/30 gap-2 overflow-hidden">
                                  <span className="text-gray-400 truncate block max-w-[90px]">{candidate.puesto}</span>
                                  <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/20 text-[8px] font-bold uppercase">
                                    Acreditado
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 3. EXPEDIENTE DIGITAL */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'expediente-digital' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-black/20 border border-[#2b3139] rounded-2xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" /> Repositorio Corporativo de Contratos resguardados en Supabase Storage
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-normal">
                        La documentación contractual y las cartas de recomendación están firmadas digitalmente y resguardadas bajo encriptación simétrica AES-256. El acceso de visualización de cada expediente es auditado bajo los requerimientos del Manual de Cumplimiento PLD/FT de la CNBV.
                      </p>
                    </div>

                    {/* Caja de Búsqueda */}
                    <div className="relative max-w-md">
                      <input
                        type="text"
                        placeholder="Buscar colaborador por nombre o CURP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-binance-yellow placeholder-gray-500"
                      />
                    </div>

                    {loadingVault ? (
                      <div className="py-12 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-binance-yellow border-t-transparent rounded-full animate-spin" />
                        Sincronizando expedientes con la nube privada de Supabase...
                      </div>
                    ) : vaultRecords.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-[#2b3139] rounded-2xl text-gray-500 text-xs">
                        Sin registros cargados. Complete el wizard de contratación para visualizar contratos en el repositorio.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#2b3139]/60">
                        <table className="w-full text-left text-xs text-gray-300">
                          <thead className="bg-black/40 text-gray-400 font-bold uppercase border-b border-[#2b3139]">
                            <tr>
                              <th className="py-3 px-4 min-w-[200px]">Colaborador / CURP</th>
                              <th className="py-3 px-4">Puesto y Sucursal</th>
                              <th className="py-3 px-4">Sueldo Bruto</th>
                              <th className="py-3 px-4">Estatus de Resguardo</th>
                              <th className="py-3 px-4 text-right">Instrumentos Legales</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2b3139]/40 bg-[#1e2329]/20">
                            {vaultRecords
                              .filter(r => 
                                r.full_name?.toUpperCase().includes(searchQuery.toUpperCase()) ||
                                r.curp?.toUpperCase().includes(searchQuery.toUpperCase())
                              )
                              .map((rec) => (
                                <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-4 max-w-[240px]">
                                    <div className="font-bold text-white break-words overflow-hidden whitespace-normal leading-normal">
                                      {rec.full_name}
                                    </div>
                                    <div className="text-[10px] text-binance-yellow font-mono break-all w-full">{rec.curp}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold">{rec.puesto}</div>
                                    <div className="text-[10px] text-gray-500 truncate max-w-[150px] block">
                                      {rec.sucursal === 'MAIN_BRANCH' ? 'MATRIZ - CENTRO' : rec.sucursal}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                                    ${Number(rec.sueldo_mensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sincronizado en Supabase
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2 flex-wrap max-w-[280px]">
                                      <a
                                        href={rec.documents_json.contrato}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-[#2b3139] hover:bg-binance-yellow hover:text-black text-binance-yellow border border-white/5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shrink-0"
                                      >
                                        <FileText size={11} /> Contrato
                                      </a>
                                      <a
                                        href={rec.documents_json.aviso_contratacion}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-[#2b3139] hover:bg-[#363c44] text-gray-300 border border-white/5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 transition-all shrink-0"
                                      >
                                        <FileCheck size={11} /> Acreditación
                                      </a>
                                      <a
                                        href={rec.documents_json.aviso_privacidad}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-[#2b3139] hover:bg-[#363c44] text-gray-300 border border-white/5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 transition-all shrink-0"
                                      >
                                        <ShieldCheck size={11} /> Privacidad
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 4. ASIGNACIÓN OPERATIVA */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'asignacion-operativa' && (
                  <div className="space-y-6">
                    {pendingFinalization.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-[#2b3139] rounded-2xl text-gray-400 text-xs bg-black/10">
                        No hay colaboradores pendientes de adscripción ni alta definitiva en la sesión actual. Todos los expedientes en Supabase están activos y vinculados a un Nodo de Liquidez.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-300">
                          Seleccione a continuación un candidato con pre-contrato para configurar su nodo físico de adscripción, asignar su nivel de atribuciones técnicas en ventanilla y autorizar su alta:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          
                          {/* Lista de candidatos en espera */}
                          <div className="space-y-3 bg-black/10 p-4 border border-[#2b3139]/60 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Candidatos en Espera de Adscripción</span>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                              {pendingFinalization.map((cand) => (
                                <div
                                  key={cand.id}
                                  onClick={() => {
                                    setSelectedCandidateCurp(cand.curp);
                                    setOpBranch(cand.sucursal || 'MAIN_BRANCH');
                                    setOpRole(cand.puesto || 'Cajero de Ventanilla');
                                  }}
                                  className={`p-4 border rounded-xl cursor-pointer text-left transition-all ${
                                    selectedCandidateCurp === cand.curp
                                      ? 'bg-binance-yellow/5 border-binance-yellow shadow-md shadow-binance-yellow/5'
                                      : 'bg-black/20 border-[#2b3139] hover:bg-white/5'
                                  }`}
                                >
                                  <div className="font-bold text-white text-xs truncate break-all block w-full whitespace-normal leading-normal">
                                    {cand.full_name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">CURP: {cand.curp}</div>
                                  <div className="flex justify-between items-center text-[9px] mt-3 border-t border-[#2b3139]/30 pt-2 gap-2 overflow-hidden">
                                    <span className="text-binance-yellow uppercase font-bold truncate max-w-[120px] block">{cand.puesto}</span>
                                    <span className="text-gray-500 font-semibold truncate max-w-[120px] block">
                                      {cand.sucursal === 'MAIN_BRANCH' ? 'Matriz - Centro' : cand.sucursal}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Formulario de Asignación */}
                          <div>
                            {selectedCandidateCurp ? (() => {
                              const candidate = pendingFinalization.find(c => c.curp === selectedCandidateCurp);
                              return (
                                <div className="bg-[#1e2329]/50 border border-[#2b3139] p-5 rounded-2xl space-y-4 text-left">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#2b3139] pb-2 text-binance-yellow flex items-center gap-2">
                                    <Fingerprint size={14} /> Atribuciones y Permisos
                                  </h4>

                                  <div className="space-y-3.5 text-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#2b3139]/40 pb-2 overflow-hidden w-full">
                                      <span className="text-gray-400 shrink-0">Colaborador:</span>
                                      <span className="font-bold text-white text-left sm:text-right break-words overflow-hidden max-w-full leading-normal">
                                        {candidate?.full_name}
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Sucursal Física Adscrita</label>
                                      <select
                                        value={opBranch}
                                        onChange={(e) => setOpBranch(e.target.value)}
                                        className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-binance-yellow"
                                      >
                                        {branches.map(b => (
                                          <option key={b.sucursal_id} value={b.sucursal_id}>{b.nombre}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Nivel de Autorización / Rol Técnico</label>
                                      <select
                                        value={opRole}
                                        onChange={(e) => setOpRole(e.target.value)}
                                        className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-binance-yellow"
                                      >
                                        <option value="Cajero de Ventanilla">Caja / Operador (Nivel de Rol 2)</option>
                                        <option value="Cajero Principal">Bovedero / Cajero Principal (Nivel de Rol 2 - Privilegiado)</option>
                                        <option value="Gerente de Sucursal">Gerente de Sucursal (Nivel de Rol 3)</option>
                                        <option value="Oficial de Cumplimiento">Oficial de Cumplimiento (Nivel de Rol 5 - Control Total)</option>
                                      </select>
                                    </div>

                                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-1 text-[10px] leading-relaxed">
                                      <span className="font-bold text-binance-yellow block">✓ Parámetros Técnicos Listos</span>
                                      <p className="text-gray-400">
                                        Al consolidar el alta operativa, se registrará el operador en el Core SQLite de base, se archivará el expediente en Supabase y quedará listo para su inicio de turno técnico.
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => handleAssignAndFinalize(candidate)}
                                      className="w-full py-3 bg-gradient-to-r from-binance-yellow to-yellow-500 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all uppercase"
                                    >
                                      <UserCheck size={14} /> Consolidar Alta Operativa
                                    </button>
                                  </div>
                                </div>
                              );
                            })() : (
                              <div className="flex items-center justify-center border border-dashed border-[#2b3139] p-12 rounded-2xl text-gray-500 text-xs text-center h-full">
                                Seleccione un colaborador de la lista izquierda para configurar sus atribuciones físicas y autorizar su vinculación.
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 5. TIPOS DE CAMBIO (CORE RATE CAPTURE) */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'tipos-de-cambio' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-black/20 border border-[#2b3139] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Globe size={16} className="text-binance-yellow" /> Panel de Ajuste de Markup de Divisas (Core Legacy SoftExchange)
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1 max-w-2xl leading-normal">
                          Conforme a los lineamientos de la CNBV, este panel permite la captura directa del Tipo de Cambio (TC) para operaciones de mostrador. Modifique las tarifas y guarde para propagarlas a todas las terminales de caja en tiempo real.
                        </p>
                      </div>
                      <div className="shrink-0 bg-black/40 border border-[#2b3139] px-3 py-2 rounded-xl text-right">
                        <span className="text-[9px] text-gray-500 uppercase block font-black">Última Actualización</span>
                        <span className="text-xs font-mono font-bold text-binance-yellow block mt-0.5">
                          {lastRatesUpdate || 'Sincronizando...'}
                        </span>
                      </div>
                    </div>

                    {ratesSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={15} />
                        <span>{ratesSuccess}</span>
                      </div>
                    )}

                    {ratesError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>{ratesError}</span>
                      </div>
                    )}

                    {loadingRates ? (
                      <div className="py-12 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-binance-yellow border-t-transparent rounded-full animate-spin" />
                        Obteniendo cotizaciones en tiempo real del Core Redis...
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto border border-[#2b3139]/60 rounded-2xl overflow-hidden shadow-xl">
                        <div className="bg-black/30 px-4 py-3 border-b border-[#2b3139] grid grid-cols-3 text-left font-black uppercase text-[10px] text-gray-400 tracking-wider">
                          <span>Divisa de Referencia</span>
                          <span>TC Compra (Recibimos)</span>
                          <span>TC Venta (Entregamos)</span>
                        </div>
                        <div className="divide-y divide-[#2b3139]/40 bg-[#151a1e]">
                          {Object.keys(rates).map((currency) => (
                            <div key={currency} className="px-4 py-4 grid grid-cols-3 items-center hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-binance-yellow/10 border border-binance-yellow/20 rounded-lg flex items-center justify-center text-binance-yellow font-bold text-xs">
                                  {currency}
                                </div>
                                <div>
                                  <span className="text-xs font-black text-white block">{currency} / MXN</span>
                                  <span className="text-[9px] text-gray-500 uppercase">Markup integrado</span>
                                </div>
                              </div>
                              <div className="pr-4">
                                <div className="relative max-w-[140px]">
                                  <span className="absolute left-3 top-2.5 text-xs text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={rates[currency].buy}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setRates({
                                        ...rates,
                                        [currency]: { ...rates[currency], buy: val }
                                      });
                                    }}
                                    className="w-full bg-black/40 border border-[#2b3139] rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:border-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="relative max-w-[140px]">
                                  <span className="absolute left-3 top-2.5 text-xs text-gray-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={rates[currency].sell}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setRates({
                                        ...rates,
                                        [currency]: { ...rates[currency], sell: val }
                                      });
                                    }}
                                    className="w-full bg-black/40 border border-[#2b3139] rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-red-400 focus:border-red-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción del Modal de Tipos de Cambio */}
                    <div className="pt-4 border-t border-[#2b3139]/40 flex justify-end gap-3">
                      <button
                        onClick={fetchLiveRates}
                        disabled={loadingRates}
                        className="px-4 py-2 bg-[#2b3139] hover:bg-[#363c44] text-xs font-bold rounded-xl text-white transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} className={loadingRates ? 'animate-spin' : ''} /> Actualizar TC (Refrescar)
                      </button>
                      <button
                        onClick={handleSaveRates}
                        disabled={savingRates || loadingRates}
                        className="px-5 py-2 bg-binance-yellow hover:bg-yellow-500 text-xs font-black rounded-xl text-black transition-colors flex items-center gap-1.5 uppercase"
                      >
                        <Save size={12} className={savingRates ? 'animate-spin' : ''} /> Guardar Cambios
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 6. ALTA DE SUCURSAL */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'alta-sucursal' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-black/20 border border-[#2b3139] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Selector de Nodos de Sucursal</h4>
                        <p className="text-[10px] text-gray-500">Seleccione un nodo existente para editar sus metadatos fiscales, o registre un nuevo establecimiento.</p>
                      </div>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => handleBranchSelectChange(e.target.value)}
                        className="bg-black/50 border border-[#2b3139] rounded-xl px-4 py-2 text-xs text-binance-yellow focus:ring-1 focus:ring-binance-yellow outline-none shrink-0"
                      >
                        {branches.map(b => (
                          <option key={b.sucursal_id} value={b.sucursal_id}>{b.nombre}</option>
                        ))}
                        <option value="NEW">+ Registrar Nueva Sucursal</option>
                      </select>
                    </div>

                    {branchSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={15} />
                        <span>{branchSuccess}</span>
                      </div>
                    )}

                    {branchError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>{branchError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Formulario Izquierda (Campos Requeridos) */}
                      <div className="lg:col-span-7 space-y-4">
                        
                        {/* Lógica de Herencia */}
                        <div className="bg-[#1e2329]/40 border border-[#2b3139] p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Lógica de Herencia Fiscal</span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {branchForm.es_matriz === 1 
                                ? 'Este nodo es la Sucursal Matriz corporativa.' 
                                : 'Hereda automáticamente RFC, Razón Social y CNBV de la matriz activa.'}
                            </span>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-xs shrink-0">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Sucursal Matriz</span>
                            <input
                              type="checkbox"
                              checked={branchForm.es_matriz === 1}
                              onChange={(e) => setBranchForm({...branchForm, es_matriz: e.target.checked ? 1 : 0})}
                              className="w-4 h-4 accent-binance-yellow rounded"
                            />
                          </label>
                        </div>

                        {/* Campos del Formulario */}
                        <div className="bg-[#1e2329]/20 border border-[#2b3139]/70 p-5 rounded-2xl space-y-4">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-wider border-b border-[#2b3139]/40 pb-2">
                            Datos del Establecimiento
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400">Nombre de la Sucursal (Comercial) *</label>
                              <input
                                type="text"
                                placeholder="Ej. Sucursal Tijuana"
                                value={branchForm.nombre}
                                onChange={(e) => setBranchForm({...branchForm, nombre: e.target.value})}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white outline-none focus:border-binance-yellow"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 flex justify-between">
                                <span>Razón Social *</span>
                                {isSecondaryBranch && currentMatriz && <span className="text-[9px] text-binance-yellow">✓ Heredado de Matriz</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. SoftExchange S.A. de C.V."
                                value={displayRazonSocial}
                                onChange={(e) => setBranchForm({...branchForm, razon_social: e.target.value})}
                                readOnly={isSecondaryBranch && !!currentMatriz}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white read-only:opacity-50 outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400">Teléfono Corporativo *</label>
                              <input
                                type="text"
                                placeholder="Ej. 6641234567"
                                value={branchForm.telefono || ''}
                                onChange={(e) => setBranchForm({...branchForm, telefono: e.target.value})}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white outline-none focus:border-binance-yellow"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400">Email de Contacto *</label>
                              <input
                                type="email"
                                placeholder="Ej. sucursal@softexchange.com"
                                value={branchForm.email || ''}
                                onChange={(e) => setBranchForm({...branchForm, email: e.target.value})}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white outline-none focus:border-binance-yellow"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400">RFC (Firma Fiscal) *</label>
                              <input
                                type="text"
                                placeholder="Ej. SEX100914G31"
                                value={displayRfc}
                                onChange={(e) => setBranchForm({...branchForm, rfc: e.target.value.toUpperCase()})}
                                readOnly={isSecondaryBranch && !!currentMatriz}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white font-mono read-only:opacity-50 outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400">Número de Licencia CNBV *</label>
                              <input
                                type="text"
                                placeholder="Ej. CNBV-EXCH-2023-0092"
                                value={displayLicenciaCnbv}
                                onChange={(e) => setBranchForm({...branchForm, licencia_cnbv: e.target.value})}
                                readOnly={isSecondaryBranch && !!currentMatriz}
                                className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-2 text-white read-only:opacity-50 outline-none"
                              />
                            </div>
                          </div>

                          <div className="border-t border-[#2b3139]/40 pt-4 space-y-3 text-xs">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider block">Domicilio Físico (Ticket) *</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] text-gray-400 block">Calle *</label>
                                <input
                                  type="text"
                                  placeholder="Calle o Avenida"
                                  value={branchForm.calle}
                                  onChange={(e) => setBranchForm({...branchForm, calle: e.target.value})}
                                  className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-1.5 text-white outline-none focus:border-binance-yellow"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-400 block">Número *</label>
                                <input
                                  type="text"
                                  placeholder="No. Int/Ext"
                                  value={branchForm.numero}
                                  onChange={(e) => setBranchForm({...branchForm, numero: e.target.value})}
                                  className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-1.5 text-white outline-none focus:border-binance-yellow"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-400 block">Colonia *</label>
                                <input
                                  type="text"
                                  placeholder="Colonia"
                                  value={branchForm.colonia}
                                  onChange={(e) => setBranchForm({...branchForm, colonia: e.target.value})}
                                  className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-1.5 text-white outline-none focus:border-binance-yellow"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-400 block">Ciudad *</label>
                                <input
                                  type="text"
                                  placeholder="Ciudad"
                                  value={branchForm.ciudad}
                                  onChange={(e) => setBranchForm({...branchForm, ciudad: e.target.value})}
                                  className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-1.5 text-white outline-none focus:border-binance-yellow"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-400 block">Código Postal *</label>
                                <input
                                  type="text"
                                  placeholder="CP"
                                  value={branchForm.codigo_postal}
                                  onChange={(e) => setBranchForm({...branchForm, codigo_postal: e.target.value})}
                                  className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-3 py-1.5 text-white outline-none focus:border-binance-yellow"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Logotipo upload */}
                        <div className="bg-[#1e2329]/40 border border-[#2b3139] p-4 rounded-xl flex items-center gap-4">
                          <div className="w-14 h-14 bg-black/30 border border-dashed border-[#2b3139] rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Preview" className="w-full h-full object-contain filter grayscale" referrerPolicy="no-referrer" />
                            ) : (
                              <Building className="text-gray-600" size={24} />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[#2b3139] hover:bg-[#363c44] text-[10px] text-white font-bold rounded-lg transition-colors">
                              <Upload size={14} /> Subir Logotipo
                              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            </label>
                            <p className="text-[9px] text-gray-500 mt-1">Sube el logotipo corporativo para la previsualización del ticket térmico impreso.</p>
                          </div>
                        </div>

                      </div>

                      {/* Simulación Recibo Térmico Derecha */}
                      <div className="lg:col-span-5 space-y-2 text-left">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Encabezado de Ticket Impreso</span>
                        
                        <div className="bg-[#fdfdfc] text-black border border-[#d2d2c9] p-5 rounded-2xl shadow-lg font-mono text-[10px] space-y-3 min-h-[380px]">
                          <div className="text-center border-b border-dashed border-gray-400 pb-3 flex flex-col items-center space-y-1">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Ticket Logo" className="max-h-8 max-w-[100px] object-contain filter grayscale mb-1" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 border-2 border-black rounded-md flex items-center justify-center font-bold text-[9px] mb-1">LOGO</div>
                            )}
                            <h3 className="font-black uppercase tracking-tight text-xs">{branchForm.nombre || "SOPORTE CHANGE CLIENTE"}</h3>
                            <p className="text-[8px] text-gray-700 leading-tight uppercase font-bold">{displayRazonSocial || "SOFTEXTCHANGE S.A. DE C.V."}</p>
                            <p className="text-[8px] text-gray-600">RFC: {displayRfc || "SEX100914G31"}</p>
                            <p className="text-[8px] text-gray-600 text-center leading-normal">
                              {branchForm.calle || "Calle"} {branchForm.numero || "No"}, Col. {branchForm.colonia || "Col"}, CP {branchForm.codigo_postal || "00000"}
                            </p>
                            <p className="text-[8px] text-gray-600">
                              Tel: {branchForm.telefono || "664-000-0000"} | {branchForm.email || "contacto@softexchange.com"}
                            </p>
                            <p className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wide text-center mt-1">
                              Lic CNBV: {displayLicenciaCnbv || "REG-CNBV-2023"}
                            </p>
                          </div>

                          <div className="space-y-2 text-gray-800 leading-relaxed text-[9px]">
                            <div className="text-center font-black border-b border-gray-300 pb-1">COMPROBANTE COMPRA-VENTA</div>
                            <div className="flex justify-between"><span>FOLIO:</span><span className="font-bold">TKT-829371</span></div>
                            <div className="flex justify-between"><span>FECHA:</span><span>{new Date().toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>CAJERO:</span><span>{profile?.nickname || "Operador"}</span></div>
                            <div className="border-t border-dashed border-gray-400 pt-1.5">
                              <div className="flex justify-between font-bold"><span>RECIBIMOS:</span><span>1,000.00 USD</span></div>
                            </div>
                            <div className="border-t border-dashed border-gray-400 pt-1.5">
                              <div className="flex justify-between font-bold"><span>ENTREGAMOS:</span><span>17,450.00 MXN</span></div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Botones de acción del Modal de Alta de Sucursal */}
                    <div className="pt-4 border-t border-[#2b3139]/40 flex justify-end gap-3">
                      <button
                        onClick={handlePushFiscal}
                        disabled={syncingFiscal || !currentMatriz}
                        className="px-4 py-2 bg-binance-yellow/10 border border-binance-yellow/20 hover:bg-binance-yellow/20 text-binance-yellow text-xs font-bold rounded-xl uppercase flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} className={syncingFiscal ? 'animate-spin' : ''} /> Propagar Matriz
                      </button>
                      <button
                        onClick={handleSyncInterface}
                        disabled={syncingInterface}
                        className="px-4 py-2 bg-[#2b3139] hover:bg-[#363c44] text-xs font-bold rounded-xl text-white transition-colors flex items-center gap-1.5 uppercase"
                      >
                        <RefreshCw size={12} className={syncingInterface ? 'animate-spin' : ''} /> Sincronizar Interfaz
                      </button>
                      <button
                        onClick={handleSaveBranch}
                        disabled={savingBranch}
                        className="px-5 py-2 bg-binance-yellow hover:bg-yellow-500 text-xs font-black rounded-xl text-black transition-colors flex items-center gap-1.5 uppercase"
                      >
                        <Save size={12} className={savingBranch ? 'animate-spin' : ''} /> Guardar Sucursal
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODAL CONTENIDO: 7. UMBRALES DE SEGURIDAD */}
                {/* ---------------------------------------------------- */}
                {activeModal === 'umbrales-seguridad' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left Column: Branch selector and Status Monitor */}
                      <div className="md:col-span-1 space-y-6">
                        <div className="bg-black/20 border border-[#2b3139] p-5 rounded-2xl space-y-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sucursal a Configurar</h4>
                          <select
                            value={selectedThreshBranch}
                            onChange={(e) => setSelectedThreshBranch(e.target.value)}
                            className="w-full bg-black/40 border border-[#2b3139] rounded-xl px-4 py-3 text-xs text-binance-yellow focus:ring-1 focus:ring-binance-yellow outline-none"
                          >
                            {branches.map(b => (
                              <option key={b.sucursal_id} value={b.sucursal_id}>{b.nombre}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status Monitor card */}
                        <div className="bg-black/20 border border-[#2b3139] p-5 rounded-2xl space-y-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Estado de la Terminal</h4>
                          {branchTerminalStatus ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">Bloqueada:</span>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${branchTerminalStatus.locked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                  {branchTerminalStatus.locked ? 'SÍ (BLOQUEADA)' : 'NO (OPERATIVA)'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">Advertencias Activas:</span>
                                <span className={`text-xs font-mono font-bold ${branchTerminalStatus.warningCount > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
                                  {branchTerminalStatus.warningCount} / 3
                                </span>
                              </div>
                              {branchTerminalStatus.locked && (
                                <p className="text-[10px] text-red-400 leading-relaxed italic">
                                  La terminal de esta sucursal está bloqueada debido a que excedió el saldo máximo permitido por más de 30 minutos.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">Cargando estado...</div>
                          )}
                        </div>
                      </div>

                      {/* Middle Column: Current Thresholds List */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="bg-black/20 border border-[#2b3139] p-6 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center border-b border-[#2b3139]/40 pb-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Límites y Umbrales Activos</h4>
                            <span className="text-[10px] text-gray-500 uppercase">Regulación de Riesgos VaaS</span>
                          </div>

                          {loadingThresholds ? (
                            <div className="text-xs text-gray-500 py-8 text-center">Cargando umbrales de seguridad...</div>
                          ) : thresholds.length === 0 ? (
                            <div className="text-xs text-gray-500 py-8 text-center italic">
                              No hay umbrales de seguridad definidos para esta sucursal. El sistema usará balances ilimitados.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {thresholds.map((t: any) => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-black/30 border border-white/5 rounded-xl hover:border-binance-yellow/20 transition-all group">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-binance-yellow/10 text-binance-yellow rounded-lg font-black text-xs">
                                      {t.currency}
                                    </div>
                                    <div>
                                      <span className="text-white font-bold text-xs block">{t.currency} Limit</span>
                                      <span className="text-gray-500 text-[10px]">Sucursal ID: {t.sucursal_id}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-white font-mono text-xs font-bold bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                      Max: {t.monto_maximo.toLocaleString()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setThreshForm({
                                          currency: t.currency,
                                          monto_maximo: t.monto_maximo.toString()
                                        });
                                      }}
                                      className="text-[10px] text-binance-yellow hover:underline cursor-pointer"
                                    >
                                      Editar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Add / Edit Form */}
                          <div className="bg-black/35 p-4 rounded-xl border border-white/5 space-y-4">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Definir / Actualizar Umbral de Seguridad
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 uppercase font-bold">Divisa</label>
                                <select
                                  value={threshForm.currency}
                                  onChange={(e) => setThreshForm({ ...threshForm, currency: e.target.value })}
                                  className="w-full bg-[#181a20] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-white outline-none"
                                >
                                  {['USD', 'EUR', 'GBP', 'CAD', 'USDT'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 uppercase font-bold">Monto Máximo Permitido</label>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Ej. 10000"
                                  value={threshForm.monto_maximo}
                                  onChange={(e) => setThreshForm({ ...threshForm, monto_maximo: e.target.value })}
                                  className="w-full bg-[#181a20] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                                />
                              </div>
                            </div>

                            {threshMessage && (
                              <div className={`p-2.5 rounded-lg text-center text-xs font-bold ${threshMessage.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {threshMessage}
                              </div>
                            )}

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={handleSaveThreshold}
                                disabled={isSavingThresh}
                                className="px-4 py-2 bg-binance-yellow hover:bg-yellow-500 text-black font-black uppercase rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50 cursor-pointer animate-none"
                              >
                                {isSavingThresh ? 'GUARDANDO...' : 'REGISTRAR UMBRAL'}
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

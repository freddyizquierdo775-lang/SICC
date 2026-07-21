import React, { useState, useEffect } from 'react';
import { 
  Save, ShieldCheck, Fingerprint, RefreshCw, AlertCircle, UserPlus, CheckCircle2, 
  Briefcase, FileText, BookOpen, Lock, Unlock, Download, ChevronRight, ChevronLeft, 
  UserCheck, FileCheck, Eye, History, User, Building, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { RoleLevel, ROLE_NAMES } from '../types/auth';
import CapitalHumanoWorkspace from '../components/CapitalHumanoWorkspace';

interface CurrencyRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  lastUpdate: string;
}

export default function Settings() {
  const { profile, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pre-contratacion' | 'monitor-onboarding' | 'expediente-digital' | 'asignacion-operativa' | 'rates' | 'branch'>('pre-contratacion');
  const [activeModal, setActiveModal] = useState<'user' | 'rates' | 'branch' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  
  // Branch State Variables
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('MAIN_BRANCH');
  const [branchForm, setBranchForm] = useState({
    sucursal_id: 'MAIN_BRANCH',
    nombre: '',
    razon_social: '',
    rfc: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
    email: '',
    licencia_cnbv: '',
    logo_url: '',
    es_matriz: 0
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [savingBranch, setSavingBranch] = useState(false);
  const [syncingInterface, setSyncingInterface] = useState(false);
  const [syncingFiscal, setSyncingFiscal] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchSuccess, setBranchSuccess] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/sucursales');
      if (res.ok) {
        const body = await res.json();
        const data = body.data || [];
        setBranches(data);
        const main = data.find((b: any) => b.sucursal_id === selectedBranchId) || data[0];
        if (main) {
          setBranchForm({
            ...main,
            es_matriz: main.es_matriz || 0
          });
          setLogoPreview(main.logo_url || '');
        }
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const handleBranchSelectChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (branchId === 'NEW') {
      setBranchForm({
        sucursal_id: '',
        nombre: 'Nueva Sucursal',
        razon_social: '',
        rfc: '',
        calle: '',
        numero: '',
        colonia: '',
        ciudad: '',
        codigo_postal: '',
        telefono: '',
        email: '',
        licencia_cnbv: '',
        logo_url: '',
        es_matriz: 0
      });
      setLogoPreview('');
      setLogoFile(null);
    } else {
      const b = branches.find((x: any) => x.sucursal_id === branchId);
      if (b) {
        setBranchForm({
          ...b,
          es_matriz: b.es_matriz || 0
        });
        setLogoPreview(b.logo_url || '');
        setLogoFile(null);
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranch = async () => {
    setBranchError(null);
    setBranchSuccess(null);
    
    if (!branchForm.nombre.trim()) {
      setBranchError("El nombre de la sucursal es obligatorio.");
      return;
    }

    setSavingBranch(true);
    try {
      let finalLogoUrl = branchForm.logo_url;
      let targetId = branchForm.sucursal_id;
      
      if (!targetId) {
        targetId = `sucursal_${branchForm.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
      }

      if (logoPreview && logoPreview.startsWith('data:')) {
        const uploadRes = await fetch('/api/sucursales/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sucursal_id: targetId,
            logo_base64: logoPreview
          })
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalLogoUrl = uploadData.logo_url;
        } else {
          const errData = await uploadRes.json();
          throw new Error(errData.message || "Error al subir logotipo");
        }
      }

      // Modo Inteligente de Captura: si es secundaria, hereda los campos fiscales de la matriz existente antes de guardar
      let finalRazonSocial = branchForm.razon_social;
      let finalRfc = branchForm.rfc;
      let finalLicenciaCnbv = branchForm.licencia_cnbv;

      if (!branchForm.es_matriz) {
        const currentMatriz = branches.find(b => b.es_matriz === 1);
        if (currentMatriz) {
          finalRazonSocial = currentMatriz.razon_social;
          finalRfc = currentMatriz.rfc;
          finalLicenciaCnbv = currentMatriz.licencia_cnbv;
        }
      }

      const payload = {
        ...branchForm,
        sucursal_id: targetId,
        razon_social: finalRazonSocial,
        rfc: finalRfc,
        licencia_cnbv: finalLicenciaCnbv,
        logo_url: finalLogoUrl
      };

      const saveRes = await fetch('/api/sucursales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (saveRes.ok) {
        const saveData = await saveRes.json();
        setBranchSuccess("¡Sucursal guardada exitosamente en el sistema!");
        await fetchBranches();
        setSelectedBranchId(saveData.data.sucursal_id);
        setBranchForm(saveData.data);
      } else {
        const errData = await saveRes.json();
        throw new Error(errData.message || "Error al guardar sucursal");
      }
    } catch (err: any) {
      setBranchError(err.message || "Ocurrió un error al procesar el guardado.");
    } finally {
      setSavingBranch(false);
    }
  };

  const handlePushFiscal = async () => {
    setBranchError(null);
    setBranchSuccess(null);
    setSyncingFiscal(true);
    try {
      const res = await fetch('/api/sucursales/push-fiscal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setBranchSuccess(data.message || "Sincronización fiscal global exitosa.");
        await fetchBranches();
      } else {
        throw new Error(data.message || "Fallo al empujar datos fiscales.");
      }
    } catch (err: any) {
      setBranchError(err.message || "Error al propagar datos fiscales globales.");
    } finally {
      setSyncingFiscal(false);
    }
  };

  const handleSyncInterface = async () => {
    setBranchError(null);
    setBranchSuccess(null);
    setSyncingInterface(true);
    try {
      const res = await fetch('/api/sucursales/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBranchSuccess(data.message || "Interfaz sincronizada y caché invalidada.");
        window.dispatchEvent(new CustomEvent('sync-branches'));
      } else {
        throw new Error("Fallo en sincronización remota");
      }
    } catch (err: any) {
      setBranchError(err.message || "Error al sincronizar.");
    } finally {
      setSyncingInterface(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Vault Records State
  const [vaultRecords, setVaultRecords] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  // Contracting Wizard Steps & Form State
  const [wizardStep, setWizardStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [generationResponse, setGenerationResponse] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [finalSuccess, setFinalSuccess] = useState(false);
  const [credentialsCreated, setCredentialsCreated] = useState<{auth_user_id: string, temp_password: string} | null>(null);

  const [wizardData, setWizardData] = useState({
    // Paso 1: Datos de Identidad
    nombre_completo: '',
    lugar_nacimiento: '',
    fecha_nacimiento: '',
    nacionalidad: 'MEXICANA',
    estado_civil: 'SOLTERO(A)',
    rfc: '',
    curp: '',
    domicilio: '',

    // Paso 2: Información Laboral y Fiscal
    puesto: 'Cajero de Ventanilla',
    sueldo_mensual: '18000',
    prestaciones: 'Vales de despensa, Fondo de ahorro, Seguro de vida',
    fecha_inicio: new Date().toISOString().split('T')[0],
    nss: '',
    infonavit_fonacot: 'NINGUNO',
    sucursal: 'MAIN_BRANCH',

    // Paso 3: Referencias y Expediente
    referencia1_nombre: '',
    referencia1_telefono: '',
    referencia1_parentesco: '',
    referencia2_nombre: '',
    referencia2_telefono: '',
    referencia2_parentesco: '',

    doc_id_oficial: true,
    doc_acta_nacimiento: false, // Cajero requires this true
    doc_comprobante_domicilio: true,
    doc_cartas_recomendacion: true
  });

  // Fetch Vault history
  const fetchVaultRecords = async () => {
    if (!profile || profile.role_level < 5) return;
    setLoadingVault(true);
    try {
      const savedUserId = localStorage.getItem('mock_user_id') || 'user_gerente_1';
      const res = await fetch('/api/hr/vault', {
        headers: { 'x-user-id': savedUserId }
      });
      if (res.ok) {
        const data = await res.json();
        setVaultRecords(data.files || []);
      }
    } catch (err) {
      console.error("Error loading HR vault records:", err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    fetchVaultRecords();
  }, [profile]);

  // Form Validation per Step
  const validateStep = (step: number): boolean => {
    setFormError(null);
    const d = wizardData;

    if (step === 1) {
      if (!d.nombre_completo.trim()) return fail("El nombre completo es requerido.");
      if (!d.lugar_nacimiento.trim()) return fail("El lugar de nacimiento es requerido.");
      if (!d.fecha_nacimiento) return fail("La fecha de nacimiento es requerida.");
      if (!d.domicilio.trim()) return fail("El domicilio actual es requerido.");
      if (d.rfc.trim().length < 12 || d.rfc.trim().length > 13) {
        return fail("El RFC debe contener entre 12 y 13 caracteres alfanuméricos.");
      }
      if (d.curp.trim().length !== 18) {
        return fail("El CURP debe contener exactamente 18 caracteres.");
      }
    }

    if (step === 2) {
      if (!d.sueldo_mensual || parseFloat(d.sueldo_mensual) <= 0) {
        return fail("Ingrese un sueldo mensual válido mayor a $0.");
      }
      if (!d.nss.trim() || d.nss.trim().length !== 11) {
        return fail("El Número de Seguridad Social (NSS) debe contener exactamente 11 dígitos.");
      }
      if (!d.fecha_inicio) return fail("La fecha de inicio de labores es requerida.");
    }

    if (step === 3) {
      if (!d.referencia1_nombre.trim() || !d.referencia1_telefono.trim() || !d.referencia1_parentesco.trim()) {
        return fail("Complete la información de la Referencia Personal 1.");
      }
      if (!d.referencia2_nombre.trim() || !d.referencia2_telefono.trim() || !d.referencia2_parentesco.trim()) {
        return fail("Complete la información de la Referencia Personal 2.");
      }
      if (d.referencia1_telefono.trim().length !== 10 || d.referencia2_telefono.trim().length !== 10) {
        return fail("Los teléfonos de referencia deben contener exactamente 10 dígitos.");
      }

      // Strict Legal Requirement: Birth certificate original is mandatory for Cashiers
      const isCajero = d.puesto.toLowerCase().includes('cajero');
      if (isCajero && !d.doc_acta_nacimiento) {
        return fail("REQUISITO DE CUMPLIMIENTO: El Acta de Nacimiento Original es obligatoria y de carácter eliminatorio para puestos de Cajero.");
      }
    }

    return true;
  };

  const fail = (msg: string): boolean => {
    setFormError(msg);
    return false;
  };

  // Step 4: Generate Instruments
  const handleGenerateContracts = async () => {
    setFormError(null);
    setIsGenerating(true);
    try {
      const savedUserId = localStorage.getItem('mock_user_id') || 'user_gerente_1';
      const response = await fetch('/api/hr/vault/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': savedUserId
        },
        body: JSON.stringify(wizardData)
      });

      const resData = await response.json();
      if (response.ok) {
        setGenerationResponse(resData.data);
        fetchVaultRecords();
      } else {
        setFormError(resData.error || 'No se pudo generar el expediente digital.');
      }
    } catch (err) {
      setFormError('Fallo en la comunicación remota con el servidor de contratos.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeOnboarding = async () => {
    setFormError(null);
    setIsFinalizing(true);
    try {
      const savedUserId = localStorage.getItem('mock_user_id') || 'user_gerente_1';
      const response = await fetch('/api/hr/vault/finalize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': savedUserId
        },
        body: JSON.stringify({ curp: wizardData.curp })
      });

      const resData = await response.json();
      if (response.ok) {
        setFinalSuccess(true);
        setCredentialsCreated({
          auth_user_id: resData.auth_user_id,
          temp_password: resData.temp_password
        });
        fetchVaultRecords();
        setTimeout(() => {
          setFinalSuccess(false);
          setActiveTab('monitor-onboarding');
          // reset wizard
          setWizardStep(1);
          setGenerationResponse(null);
          setWizardData({
            nombre_completo: '',
            lugar_nacimiento: '',
            fecha_nacimiento: '',
            nacionalidad: 'MEXICANA',
            estado_civil: 'SOLTERO(A)',
            rfc: '',
            curp: '',
            domicilio: '',
            puesto: 'Cajero de Ventanilla',
            sueldo_mensual: '18000',
            prestaciones: 'Vales de despensa, Fondo de ahorro, Seguro de vida',
            fecha_inicio: new Date().toISOString().split('T')[0],
            nss: '',
            infonavit_fonacot: 'NINGUNO',
            sucursal: 'MAIN_BRANCH',
            referencia1_nombre: '',
            referencia1_telefono: '',
            referencia1_parentesco: '',
            referencia2_nombre: '',
            referencia2_telefono: '',
            referencia2_parentesco: '',
            doc_id_oficial: true,
            doc_acta_nacimiento: false,
            doc_comprobante_domicilio: true,
            doc_cartas_recomendacion: true
          });
        }, 3000);
      } else {
        setFormError(resData.error || 'No se pudo consolidar el alta del colaborador.');
      }
    } catch (err) {
      setFormError('Fallo en la comunicación final con el servidor.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 pb-20">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2b3139] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Centro de Control de Recursos Humanos y Configuración</h1>
          <p className="text-gray-400 text-xs mt-1">Módulo unificado para contratación automatizada, expedientes en Supabase, monitor de onboarding y alta de sucursales.</p>
        </div>

        {/* SIMULADOR DE PERFILES DE ACCESO */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-binance-yellow/10 rounded-xl text-binance-yellow">
            <User size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-black tracking-wider block">Perfil de Usuario Simulado</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-white">
                {profile ? `${profile.nickname} (Nivel ${profile.role_level})` : 'Cargando...'}
              </span>
              <select
                value={localStorage.getItem('mock_user_id') || 'user_cajero_1'}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-black/40 border border-[#2b3139] rounded-lg px-2 py-1 text-xs text-binance-yellow focus:outline-none"
              >
                <option value="user_gerente_1">ADMIN_MASTER (NIVEL 5 - ADMIN)</option>
                <option value="user_cajero_1">FREDDY (NIVEL 5 - SUPER_ADMIN)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE CENTRAL REESTRUCTURADO */}
      <CapitalHumanoWorkspace
        profile={profile}
        vaultRecords={vaultRecords}
        loadingVault={loadingVault}
        fetchVaultRecords={fetchVaultRecords}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        wizardData={wizardData}
        setWizardData={setWizardData}
        handleGenerateContracts={handleGenerateContracts}
        isGenerating={isGenerating}
        generationResponse={generationResponse}
        setGenerationResponse={setGenerationResponse}
        formError={formError}
        setFormError={setFormError}
        handleFinalizeOnboarding={handleFinalizeOnboarding}
        isFinalizing={isFinalizing}
        finalSuccess={finalSuccess}
        credentialsCreated={credentialsCreated}
        validateStep={validateStep}
        branches={branches}
        selectedBranchId={selectedBranchId}
        handleBranchSelectChange={handleBranchSelectChange}
        branchForm={branchForm}
        setBranchForm={setBranchForm}
        logoPreview={logoPreview}
        handleLogoChange={handleLogoChange}
        savingBranch={savingBranch}
        handleSaveBranch={handleSaveBranch}
        branchError={branchError}
        branchSuccess={branchSuccess}
        handleSyncInterface={handleSyncInterface}
        syncingInterface={syncingInterface}
        handlePushFiscal={handlePushFiscal}
        syncingFiscal={syncingFiscal}
      />
    </div>
  );
}

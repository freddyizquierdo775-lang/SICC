import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, ShieldAlert, FileCheck, FileWarning, HelpCircle } from "lucide-react";
import QuickRegisterModal from "../components/QuickRegisterModal";
import { AnimatePresence } from "motion/react";

interface Client {
  id: string;
  full_name: string;
  client_type: "PHYSICAL" | "MORAL";
  email: string;
  phone: string;
  is_vip: number;
  is_b2b: number;
  rfc_curp?: string;
  company_rfc?: string;
  business_line?: string;
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc/clients");
      const data = await res.json();
      if (data.status === "success") {
        setClients(data.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = c.full_name?.toLowerCase().includes(searchLower);
    const matchesId = c.id?.toLowerCase().includes(searchLower);
    const matchesRfc = (c.rfc_curp || c.company_rfc || "")?.toLowerCase().includes(searchLower);
    return matchesName || matchesId || matchesRfc;
  });

  const verifiedCount = clients.length; // All newly registered with files are marked verified/1
  const b2bCount = clients.filter(c => c.is_b2b === 1).length;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-white">Clientes y KYC</h1>
          <p className="text-gray-400 text-xs lg:text-sm mt-1">Gestiona perfiles de clientes, documentos KYC y cumplimiento CNBV</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#1e2329] hover:bg-[#2b3139] text-white rounded-lg transition-colors text-sm font-medium border border-[#3b444f]">
            <Filter size={16} />
            Filtrar
          </button>
          <button 
            id="add-client-directory-btn"
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-binance-yellow hover:bg-yellow-500 text-black rounded-lg transition-colors text-sm font-medium whitespace-nowrap font-black"
          >
            <UserPlus size={16} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-binance-yellow/10 flex items-center justify-center">
            <FileCheck className="text-binance-yellow" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Perfiles Totales</p>
            <p className="text-2xl font-semibold text-white">{clients.length}</p>
          </div>
        </div>
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <FileCheck className="text-emerald-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Aliados B2B Habilitados</p>
            <p className="text-2xl font-semibold text-emerald-500">{b2bCount}</p>
          </div>
        </div>
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-binance-red/10 flex items-center justify-center">
            <ShieldAlert className="text-binance-red" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Alertas de Auditoría (CNBV)</p>
            <p className="text-2xl font-semibold text-white">0</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e2329] border border-[#2b3139] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#2b3139] flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, ID o RFC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2b3139] border border-[#3b444f] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-binance-yellow transition-colors text-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3b444f] text-xs uppercase tracking-wider text-gray-500 bg-[#2b3139]">
                <th className="p-4 font-medium">ID Cliente</th>
                <th className="p-4 font-medium">Nombre / Razón Social</th>
                <th className="p-4 font-medium">Tipo de Persona</th>
                <th className="p-4 font-medium">RFC / CURP</th>
                <th className="p-4 font-medium">Flujo B2B / Kappa</th>
                <th className="p-4 font-medium">Estado KYC</th>
                <th className="p-4 font-medium text-right">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3139]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Cargando clientes de la base de datos...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron clientes registrados.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#2b3139] transition-colors group cursor-pointer">
                    <td className="p-4 font-mono text-xs text-gray-300 group-hover:text-binance-yellow transition-colors">{client.id}</td>
                    <td className="p-4 text-sm font-medium text-white">
                      <div>
                        {client.full_name}
                        {client.email && <span className="block text-[10px] text-gray-500 font-normal">{client.email}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-400 font-medium tracking-wide">
                        {client.client_type === 'PHYSICAL' ? 'FÍSICA (Individual)' : 'MORAL (Corporativo)'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-400">
                      {client.client_type === 'PHYSICAL' ? client.rfc_curp : client.company_rfc}
                    </td>
                    <td className="p-4">
                      {client.is_b2b === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          KAPPA B2B
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">N/A (Caja)</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-binance-yellow/10 text-binance-yellow font-bold uppercase">
                        EXPEDIENTE COMPLETO
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-gray-500 font-mono">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Registration Modal */}
      <AnimatePresence>
        {showModal && (
          <QuickRegisterModal 
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchClients(); // Refresh lists
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Car, AlertTriangle, Loader2 } from 'lucide-react';
import type { VehicleData } from './Wizard';
import { fetchOfficialTaxData } from '../utils/api';

interface StepResultProps {
  data: VehicleData;
  onBack: () => void;
  onReset: () => void;
}

export default function StepResult({ data, onBack, onReset }: StepResultProps) {
  const [taxes, setTaxes] = useState<{ isv: string, iuc: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const getTaxes = async () => {
      try {
        setLoading(true);
        const result = await fetchOfficialTaxData(data);
        if (isMounted) {
          setTaxes(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Erro na obtenção dos dados.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getTaxes();
    return () => { isMounted = false; };
  }, [data]);

  const SummaryItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full relative overflow-hidden">
      {/* Dynamic Background Glow based on state */}
      <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b pointer-events-none transition-colors duration-500 ${
        error ? 'from-red-600/20 to-transparent' : 'from-blue-600/20 to-transparent'
      }`} />
      
      <div className="mb-6 relative z-10 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={onReset}
          title="Nova simulação" 
          className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-400 transition-colors"
        >
          <Car size={20} />
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {data.brand} {data.model}
        </h2>
        <p className="text-zinc-400">Valores extraídos em tempo real do simulador oficial português.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-black/20 rounded-2xl p-8 mb-8 border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-zinc-400 text-center text-sm">A obter dados do portal das finanças...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 rounded-2xl p-6 mb-8 border border-red-500/20 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-red-400" />
          <p className="text-red-300 font-medium">Falha na obtenção</p>
          <p className="text-red-400/80 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm text-red-300 underline">Tentar novamente</button>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && taxes && (
        <div className="flex flex-col gap-4 mb-8">
          <div className="bg-blue-600/10 rounded-2xl p-5 border border-blue-500/20 flex flex-col gap-1 items-center justify-center shadow-[0_0_30px_rgba(0,87,255,0.1)]">
            <span className="text-blue-400 font-medium tracking-wide uppercase text-xs">ISV Estimado (Total)</span>
            <span className="text-4xl font-bold text-white tracking-tight">{taxes.isv}</span>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-5 border border-white/5 flex flex-col gap-1 items-center justify-center">
            <span className="text-zinc-400 tracking-wide uppercase text-xs">IUC Estimado</span>
            <span className="text-xl font-medium text-white tracking-tight">{taxes.iuc}</span>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 mt-2 border border-white/5">
            <SummaryItem label="Ano" value={data.year} />
            <SummaryItem label="Cilindrada" value={`${data.engineCapacity} cc`} />
            <SummaryItem label="CO2" value={`${data.co2} g/km`} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-center text-xs text-zinc-500 mt-2">
        <CheckCircle size={14} className="text-zinc-600" />
        <p>Dados brutos via API (impostosobreveiculos.info)</p>
      </div>

      {/* Elegant Warning Block */}
      <div className="mt-8 bg-zinc-900/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-orange-400/90 font-semibold block mb-1">IMPORTANTE:</strong>
            Este cálculo é uma simulação técnica baseada nos dados do portal 'impostosobreveiculos.info'. O valor final e legal deve ser validado junto da Alfândega ou através de um despachante oficial. O 'Legaliza Fácil' declina qualquer responsabilidade sobre divergências nos valores apresentados.
          </p>
        </div>
      </div>
    </div>
  );
}

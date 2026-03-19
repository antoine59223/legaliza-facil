import { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Wand2, CheckSquare, Square, Search, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { VehicleData, FuelType } from './Wizard';
import BottomSheet from './BottomSheet';
import { lookupCarSpec, lookupCO2, BRANDS, MODELS_BY_BRAND } from '../utils/carSpecs';

import PaymentModal from './PaymentModal';
import type { ProductId } from './PaymentModal';

interface StepProps {
  data: VehicleData;
  updateData: (data: Partial<VehicleData>) => void;
  onNext: () => void;
}

const FUEL_TYPES: FuelType[] = ['Gasolina', 'Gasóleo', 'Híbrido', 'Híbrido Plug-in', 'Elétrico', 'GPL / GNC'];

export default function StepVehicle({ data, updateData, onNext }: StepProps) {
  const [activeSheet, setActiveSheet] = useState<'brand' | 'model' | 'year' | 'fuel' | 'engineCapacity' | 'origin' | 'country' | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [availableSpecs, setAvailableSpecs] = useState<Partial<VehicleData>[]>([]);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [vinQuery, setVinQuery] = useState('');
  const [isSearchingVin, setIsSearchingVin] = useState(false);
  const [vinError, setVinError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<ProductId>('fullpack');
  const [isOfficialData, setIsOfficialData] = useState(false);

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 1980 }, (_, i) => (currentYear - i).toString());

  const getAvailableModels = () => {
    if (!data.brand) return [];
    return MODELS_BY_BRAND[data.brand] || [];
  };

  useEffect(() => {
    if (isOfficialData) return;
    if (data.brand.length > 2 && data.model.length >= 2 && data.year.length === 4) {
      const specs = lookupCarSpec(data.brand, data.model, data.year);
      
      // Filter by fuelType if the user has already selected one
      const filteredSpecs = data.fuelType 
        ? specs.filter(s => s.fuelType === data.fuelType)
        : specs;

      setAvailableSpecs(filteredSpecs.map(s => ({
        engineCapacity: String(s.engineCapacity || ''), // Ensure string
        co2: String(s.co2 || ''),
        fuelType: s.fuelType as FuelType
      })).filter(s => 
        s.engineCapacity && 
        s.engineCapacity.trim() !== '' && 
        s.engineCapacity !== 'undefined' && 
        s.engineCapacity !== 'null' && 
        s.engineCapacity !== '0'
      ));
      
      // If there's exactly one match and we haven't picked an engine yet, auto-fill it
      if (filteredSpecs.length === 1 && !data.engineCapacity && filteredSpecs[0].engineCapacity !== 'undefined' && filteredSpecs[0].engineCapacity !== undefined) {
         updateData({
            engineCapacity: filteredSpecs[0].engineCapacity,
            co2: filteredSpecs[0].co2,
            fuelType: filteredSpecs[0].fuelType as FuelType,
         });
         setAutoFilled(true);
      }
    } else {
      setAvailableSpecs([]);
    }
  }, [data.brand, data.model, data.year, data.fuelType]);

  const isComplete = data.brand && data.model && data.year && data.fuelType && data.engineCapacity && data.co2 && data.origin && data.acceptedTerms;

  const handleVinSearchClick = () => {
    if (!vinQuery.trim()) return;
    setVinError('');
    setIsOfficialData(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string, productId: string) => {
    setIsPaymentModalOpen(false); // Close Modal
    setIsSearchingVin(true); // Show loader on main button while fetching final data
    setVinError('');
    
    try {
      // 1. Fetch exact CarAPI data securely bypassing the mock/proxy logic
      const qs = new URLSearchParams({ vin: vinQuery, payment_intent_id: paymentIntentId });
      if (selectedCountry) qs.append('country', selectedCountry);
      const response = await fetch(`/api/carapi?${qs.toString()}`);

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Veículo não encontrado após pagamento');
      }
      
      // 2. Auto-fill Data & Unlock Status
      const newUnlocked = [...data.unlockedProducts];
      if (!newUnlocked.includes(productId)) newUnlocked.push(productId);
      
      // If fullpack is purchased, auto-grant both
      if (productId === 'fullpack') {
         if (!newUnlocked.includes('autofill')) newUnlocked.push('autofill');
         if (!newUnlocked.includes('pdf')) newUnlocked.push('pdf');
      }

      const rawCo2 = String(result.co2 || '');
      const rawFuelType = String(result.fuel_type || 'Gasolina');
      const rawMake = String(result.make || '');
      const rawModel = String(result.model || '');
      const rawYear = String(result.year || '');

      let finalFuelType = rawFuelType as FuelType;
      let finalEngineCapacity = String(result.engine_cc || '');

      // Use local database to correct API errors (e.g. Mild Hybrids like Audi S8 being wrongly detected as Plug-in/Hybrid)
      const exactSpecs = lookupCarSpec(rawMake, rawModel, rawYear);
      if (exactSpecs.length > 0) {
         // If all specs for this exact car agree on fuel type, force it.
         const allSameFuel = exactSpecs.every(s => s.fuelType === exactSpecs[0].fuelType);
         if (allSameFuel) {
            finalFuelType = exactSpecs[0].fuelType as FuelType;
         } else if (rawFuelType === 'Híbrido' || rawFuelType === 'Híbrido Plug-in') {
            // If API says hybrid but our database only has Gasolina/Gasóleo versions
            const hasHybridInDb = exactSpecs.some(s => s.fuelType === 'Híbrido' || s.fuelType === 'Híbrido Plug-in');
            if (!hasHybridInDb) {
               finalFuelType = exactSpecs[0].fuelType as FuelType; 
            }
         }
         
         // If engine capacity is missing, correct it if there's only one option
         if (!finalEngineCapacity && exactSpecs.length === 1) {
            finalEngineCapacity = String(exactSpecs[0].engineCapacity);
         }
      }

      // CO2 fallback: if RegCheck didn't return CO2, look it up in our local spec database
      const co2Value = rawCo2 || lookupCO2(rawMake, rawModel, rawYear, finalFuelType, finalEngineCapacity);

      updateData({
        brand: rawMake,
        model: rawModel,
        year: rawYear,
        fuelType: finalFuelType,
        engineCapacity: finalEngineCapacity,
        co2: co2Value,
        unlockedProducts: newUnlocked
      });

      
      setAutoFilled(true);
      setIsOfficialData(true);
      if (result.make && !BRANDS.includes(result.make)) setIsCustomBrand(true);
      if (result.model) setIsCustomModel(true); // Always use text input for model after official search for precision
      
    } catch (err: any) {
      setVinError(err.message || 'Erro ao preencher dados do veículo.');
    } finally {
      setIsSearchingVin(false);
    }
  };

  // Render a mobile-friendly text input field
  const renderInput = (label: string, value: string, onChange: (val: string) => void, type = "text", placeholder = "", rightElement?: React.ReactNode, readOnly: boolean = false) => (
    <div className="flex flex-col gap-1.5 mb-4 relative">
      <label className="text-sm font-medium text-zinc-400 ml-1 flex items-center gap-1.5">
        {label} 
        {readOnly && (
          <button 
            onClick={() => setAutoFilled(false)} 
            className="hover:text-blue-300 transition-colors"
            title="Clique para editar manualmente"
          >
            <Lock size={12} className="text-blue-400" />
          </button>
        )}
      </label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 ${readOnly ? 'text-blue-400 bg-blue-900/10 cursor-not-allowed' : 'text-white'} placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg`}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );

  // Render a mobile-friendly BottomSheet Trigger field
  const renderSelectTrigger = (label: string, value: string, placeholder: string, onClick: () => void, disabled: boolean = false) => (
    <div className={`flex flex-col gap-1.5 mb-4 ${disabled ? 'opacity-50' : ''}`}>
      <label className="text-sm font-medium text-zinc-400 ml-1">{label}</label>
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-left flex justify-between items-center group hover:border-white/20 transition-all cursor-pointer"
      >
        <span className={`text-lg ${value ? 'text-white font-medium' : 'text-zinc-600'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
      </button>
    </div>
  );
  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full relative isolation-isolate" style={{ isolation: 'isolate' }}>
      {/* Subtle glow inside the panel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Detalhes do Veículo</h2>
        <p className="text-zinc-400">Insira as informações básicas do veículo para a simulação.</p>
      </div>

      {/* VIN / License Plate Search Area - PREMIUM PAYWALL */}
      <div className="mb-8 p-5 bg-gradient-to-br from-blue-900/40 to-black/40 border border-blue-500/30 rounded-2xl relative group">
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-blue-400">Pesquisa Automática</label>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              <Lock size={10} /> Premium
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={vinQuery}
              onChange={(e) => {
                setVinQuery(e.target.value);
                setVinError('');
                setSelectedCountry('');

              }}
              placeholder="Ex: AB-123-CD (FR) • 1234-ABC (ES) • AB12 CDE (UK)"
              className="flex-1 bg-black/60 border border-blue-500/20 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400 uppercase font-medium shadow-inner"
              onKeyDown={(e) => e.key === 'Enter' && handleVinSearchClick()}
            />
            <button
              onClick={handleVinSearchClick}
              disabled={isSearchingVin || !vinQuery.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-white/10 disabled:to-white/10 disabled:text-zinc-500 text-white px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[56px] gap-2 font-bold"
            >
              {isSearchingVin ? <Loader2 size={20} className="animate-spin" /> : <><Search size={18} /> <span>{selectedProductId === 'fullpack' ? 'Desbloquear Pack Full' : 'Desbloquear Dados Simples'}</span></>}
            </button>
          </div>

          {/* Reassurance Elements */}
          {!isSearchingVin && (
            <div className="mt-4 flex flex-col items-center gap-3 animate-in fade-in duration-700">
              <div className="flex items-center gap-5 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              <div className="flex items-center gap-6 opacity-60">
                {/* Simplified White Icons for better mobile rendering */}
                <svg width="34" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto">
                  <path d="M13.8 15h.6l.4-2.3h-1.2l-.2.8H12l-.2.8h1.6l-.4 2.4l-.8-2.4H11.4l-.4 2.4h-.6l.4-2.4H8.6l-.2.8h.6l.1.5h-.6l-.1-.5H7.2l-.2.8h.6l.1.5h-.6l-.1-.5H5.8l-.2.8h-.6l.1-.5H4L3.8 15h.6l-.2.8h.6l.1.5h-.6l-.1-.5H5L4.8 15h.6l-.2.8h.6l.1.5h-.6l-.1-.5H6.2l-.2.8h-.6l.1-.5H3.8L4 13.8L3 13.8L3.2 13H4l.2-.8h.8l-.2.8h.8l.2-.8h.8l-.2.8h.8l.4-2.4h.8l-.4 2.4h.8l.2-.8h.8l-.2.8h.8l.2-.8h.8l-.2.8h.8L12 11h.8l-.2.8h.8l.2-.8h.8l-.2.8h.8l.2-.8h.8l-.2.8h.8l.4-2.4h.8l-.4 2.4z" fill="white"/>
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
                </svg>
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/40" />
                  </div>
                  <div className="w-5 h-5 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/80" />
                  </div>
                </div>
                <svg width="30" height="15" viewBox="0 0 30 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto">
                  <path d="M12.4 1.5c-2.3 0-4.2 1.8-4.2 4s1.9 4 4.2 4 4.2-1.8 4.2-4-1.9-4-4.2-4zm0 6.5c-1.5 0-2.7-1.1-2.7-2.5s1.2-2.5 2.7-2.5 2.7 1.1 2.7 2.5-1.2 2.5-2.7 2.5z" fill="white"/>
                  <path d="M22 15h1.5V0H22v15zm4.5 0H28l3-10h-1.5l-2.25 7.5L25 5h-1.5l3 10z" fill="white"/>
                </svg>
              </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full border border-white/5">
                  <ShieldCheck size={12} className="text-green-500" />
                  Pagamento Seguro SSL
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Dados oficiais provenientes dos registos de matrícula
                </p>
              </div>
            </div>
          )}
          {isSearchingVin && (
            <div className="flex items-center gap-2 text-blue-400 text-sm mt-1 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              A processar o pagamento e a pesquisar na base de dados europeia...
            </div>
          )}
          {/* Supported countries info */}
          {!vinError && !isSearchingVin && vinQuery.length < 4 && (
            <div className="text-zinc-500 text-xs mt-1 px-1">
              🇫🇷 🇩🇪 🇪🇸 🇬🇧 🇧🇪 🇳🇱 🇮🇹 🇵🇹 + mais países européus
            </div>
          )}
          {vinError && (
            <div className="text-red-400 text-sm mt-1 bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex flex-col gap-2">
              <span className="font-semibold">❌ {vinError}</span>
              <span className="text-xs text-red-400/70">Se a matrícula está correta, selecione manualmente o país de registo:</span>
              
              <button
                onClick={() => setActiveSheet('country')} 
                className="w-full bg-zinc-900 border border-red-400/30 rounded-xl px-4 py-3 text-left flex justify-between items-center text-white"
              >
                <span className="text-sm">{selectedCountry || 'Selecionar País'}</span>
                <ChevronDown size={16} className="text-red-400/50" />
              </button>
              
              <span className="text-xs text-red-400/50">Depois clique novamente na lupa para tentar de novo.</span>
            </div>
          )}

          {!isSearchingVin && (
            <div className="flex flex-col gap-3 mt-2">
              <div 
                onClick={() => setSelectedProductId('autofill')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  selectedProductId === 'autofill' ? 'bg-blue-600/20 border-blue-500 shadow-lg scale-[1.02]' : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">Dados Simples (Cilindrada + CO2)</span>
                  <span className="text-blue-400 text-xs font-medium">Preenchimento automático imediato</span>
                </div>
                <span className="text-white font-black text-lg">2,99€</span>
              </div>

              <div 
                onClick={() => setSelectedProductId('fullpack')}
                className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedProductId === 'fullpack' ? 'bg-amber-500/10 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02]' : 'bg-black/40 border-white/10 hover:border-white/20 opacity-80'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-[#d4af37] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Sparkles size={10} /> MAIS POPULAR
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-lg">PACK FULL</span>
                    <span className="text-amber-200/80 text-[11px] font-bold">Dados + Relatório PDF Oficial + ISV Estimado</span>
                  </div>
                  <span className="text-white font-black text-2xl">7,49€</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 blur-xl group-hover:opacity-20 transition-opacity pointer-events-none">
           <Wand2 size={120} className="text-blue-500" />
        </div>
      </div>

    <div className="flex flex-col gap-1 w-full">
        {isCustomBrand ? (
          renderInput("Marca (Texto livre)", data.brand, (val) => updateData({ brand: val }), "text", "Ex: Ferrari")
        ) : (
          renderSelectTrigger("Marca", data.brand, "Selecionar a marca", () => setActiveSheet('brand'))
        )}
        
        {isCustomModel ? (
          renderInput("Modelo (Texto livre)", data.model, (val) => updateData({ model: val }), "text", "Ex: 458 Italia")
        ) : (
          renderSelectTrigger("Modelo", data.model, "Selecionar o modelo", () => {
            if (data.brand) setActiveSheet('model');
          }, !data.brand)
        )}
        
        {renderSelectTrigger("Ano de matrícula", data.year, "Selecionar...", () => setActiveSheet('year'))}
        
        {renderSelectTrigger("Origem do Veículo", data.origin === 'UE' ? 'País da União Europeia' : 'Fora da União Europeia', "Selecionar origem", () => setActiveSheet('origin'))}

        {/* WLTP Toggle */}
        <div className="flex flex-col gap-2 mb-4">
          <div 
            className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
              data.wltp ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5'
            }`}
            onClick={() => updateData({ wltp: !data.wltp })}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${data.wltp ? 'bg-blue-600 border-blue-500' : 'bg-zinc-800 border-zinc-700'}`}>
                {data.wltp && <CheckSquare size={14} className="text-white" />}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">Norma WLTP</span>
                <span className="text-[11px] text-zinc-500 leading-tight mt-0.5">Ative apenas se homologado WLTP (geralmente carros após 2018). Em caso de dúvida, deixe desativado.</span>
              </div>
            </div>
          </div>
        </div>

        {renderSelectTrigger("Tipo de Combustível", data.fuelType, "Selecionar...", () => setActiveSheet('fuel'))}

        {(data.fuelType === 'Híbrido' || data.fuelType === 'Híbrido Plug-in') && (
          <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm leading-relaxed">
            <strong className="text-blue-400 block mb-1 font-semibold">Nota Importante sobre Híbridos:</strong>
            Para beneficiar das reduções fiscais de ISV em Portugal, a lei exige que o veículo cumpra <strong>dois critérios cumulativos</strong>: ter uma <strong>autonomia em modo puramente elétrico de pelo menos 50 km</strong> e <strong>emissões oficiais iguais ou inferiores a 50 g/km de CO2</strong>.
          </div>
        )}

        {renderInput(
          "Cilindrada (cc)", 
          data.engineCapacity, 
          (val) => { updateData({ engineCapacity: val }); setAutoFilled(false); }, 
          "number", 
          "Ex: 1995",
          availableSpecs.length > 0 && !autoFilled ? (
            <button
              onClick={() => setActiveSheet('engineCapacity')}
              className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
              title="Ver motorizações conhecidas"
            >
              <Wand2 size={18} />
              <span className="hidden sm:inline">Auto</span>
            </button>
          ) : undefined,
          autoFilled && !!data.engineCapacity
        )}

        {renderInput(
          "Emissões CO2 (g/km)", 
          data.co2, 
          (val) => { updateData({ co2: val }); setAutoFilled(false); }, 
          "number", 
          "Ex: 120", 
          undefined, 
          autoFilled && !!data.co2
        )}

        {/* CO2 missing hint: show for ALL vehicles when CO2 is empty after official search (registry doesn't include CO2) */}
        {autoFilled && !data.co2 && (
          <div className="-mt-2 mb-4 flex gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
            <span className="text-lg leading-none">⚠️</span>
            <span>
              <strong>CO2 não encontrado no registo.</strong> O registo português não inclui esta informação. Insira o valor do seu <strong>Certificado de Conformidade (Casa V.7)</strong> — geralmente indicado no documento em papel que acompanhou o veículo na importação.
            </span>
          </div>
        )}

        {autoFilled && availableSpecs.length === 1 && (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-1 mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Wand2 size={16} />
            Motorização única detetada e preenchida!
          </div>
        )}

        {/* Legal Checkbox */}
        <div 
          className="mt-4 flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => updateData({ acceptedTerms: !data.acceptedTerms })}
        >
          <div className="mt-0.5 text-blue-500">
            {data.acceptedTerms ? <CheckSquare size={22} /> : <Square size={22} className="text-zinc-500" />}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Compreendo que os valores exibidos são estimativas baseadas em simuladores externos e podem conter erros ou omissões. Não me responsabilizo por decisões baseadas nestes dados.
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isComplete}
        className={`mt-8 w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold transition-all duration-300 ${
          isComplete 
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(0,87,255,0.4)]' 
          : 'bg-white/5 text-zinc-500 cursor-not-allowed'
        }`}
      >
        <span>Próximo</span>
        <ArrowRight size={20} />
      </button>

      {/* iOS Style Action Sheets (Bottom Sheets) */}
      
      {/* 1. Brand Sheet */}
      <BottomSheet isOpen={activeSheet === 'brand'} onClose={() => setActiveSheet(null)} title="Marca">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {[...BRANDS, 'Outro...'].map(brand => (
            <button
              key={brand}
              onClick={() => {
                if (brand === 'Outro...') {
                  setIsCustomBrand(true);
                  setIsCustomModel(true);
                  updateData({ brand: '', model: '', year: '', fuelType: '', engineCapacity: '', co2: '' });
                  setActiveSheet(null);
                } else {
                  setIsCustomBrand(false);
                  setIsCustomModel(false);
                  updateData({ brand, model: '', year: '', fuelType: '', engineCapacity: '', co2: '' });
                  setActiveSheet(null);
                  setTimeout(() => setActiveSheet('model'), 300);
                }
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                data.brand === brand ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 2. Model Sheet */}
      <BottomSheet isOpen={activeSheet === 'model'} onClose={() => setActiveSheet(null)} title="Modelo">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-2">Modelos {data.brand}</div>
          {[...getAvailableModels(), 'Outro modelo...'].map(model => (
            <button
              key={model}
              onClick={() => {
                if (model === 'Outro modelo...') {
                  setIsCustomModel(true);
                  updateData({ model: '', fuelType: '', engineCapacity: '', co2: '' });
                  setActiveSheet(null);
                } else {
                  setIsCustomModel(false);
                  updateData({ model, fuelType: '', engineCapacity: '', co2: '' });
                  setActiveSheet(null);
                  if (!data.year) setTimeout(() => setActiveSheet('year'), 300);
                }
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                data.model === model ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 3. Year Sheet */}
      <BottomSheet isOpen={activeSheet === 'year'} onClose={() => setActiveSheet(null)} title="Ano">
        <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => {
                updateData({ year, engineCapacity: '', co2: '' });
                setActiveSheet(null);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all text-lg border-b border-white/5 last:border-0 whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                data.year === year ? 'text-blue-400 font-bold' : 'text-zinc-300 active:bg-white/5'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 4. Engine Capacity Sheet */}
      <BottomSheet isOpen={activeSheet === 'engineCapacity'} onClose={() => setActiveSheet(null)} title="Cilindrada (Motorização)">
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {Array.from(new Map(availableSpecs.map(spec => [spec.engineCapacity, spec])).values()).map((spec, index) => (
            <button
              key={index}
              onClick={() => {
                updateData({ 
                  engineCapacity: spec.engineCapacity,
                  co2: spec.co2,
                  fuelType: spec.fuelType as FuelType
                });
                setActiveSheet(null);
                setAutoFilled(true);
              }}
              className={`w-full text-left px-5 py-4 rounded-xl transition-all border flex justify-between items-center whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                data.engineCapacity === spec.engineCapacity
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_4px_20px_rgba(0,87,255,0.3)]' 
                : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-xl">{spec.engineCapacity} cc</span>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 5. Fuel Type Sheet */}
      <BottomSheet isOpen={activeSheet === 'fuel'} onClose={() => setActiveSheet(null)} title="Tipo de Combustível">
        <div className="flex flex-col gap-2">
          {FUEL_TYPES.map(fuel => {
            // Find all known specs for the selected Brand + Model (ignoring year for broader fuel matches)
            const allSpecsForCar = data.brand && data.model ? lookupCarSpec(data.brand, data.model, data.year || '2018') : [];
            const hasAnySpecs = allSpecsForCar.length > 0;
            const hasThisFuel = allSpecsForCar.some(s => s.fuelType === fuel);
            
            // If we have specs for this car in the DB, only show fuels that exist for it.
            // If we have NO specs for this car in the DB, show ALL fuels (fallback).
            if (hasAnySpecs && !hasThisFuel) return null;

            return (
              <button
                key={fuel}
                onClick={() => {
                  updateData({ fuelType: fuel, engineCapacity: '', co2: '' }); // reset capacity/co2 when changing fuel
                  setActiveSheet(null);
                }}
                className={`w-full text-left px-6 py-4 rounded-2xl transition-all tracking-wide whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                  data.fuelType === fuel 
                  ? 'bg-blue-600 shadow-[0_4px_20px_rgba(0,87,255,0.3)] text-white font-medium translate-x-2' 
                  : 'bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {fuel}
              </button>
            );
          })}
        </div>
      </BottomSheet>
      
      {/* 6. Origin Sheet */}
      <BottomSheet isOpen={activeSheet === 'origin'} onClose={() => setActiveSheet(null)} title="Origem do Veículo">
        <div className="flex flex-col gap-2">
          {[
            { id: 'UE', label: 'País da União Europeia' },
            { id: 'OUTRA', label: 'Fora da União Europeia (Importação Direta)' }
          ].map(origin => (
            <button
              key={origin.id}
              onClick={() => {
                updateData({ origin: origin.id as 'UE' | 'OUTRA' });
                setActiveSheet(null);
              }}
              className={`w-full text-left px-6 py-4 rounded-2xl transition-all whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                data.origin === origin.id 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {origin.label}
            </button>
          ))}
        </div>
      </BottomSheet>
      
      {/* 7. Country Sheet (for manual override) */}
      <BottomSheet isOpen={activeSheet === 'country'} onClose={() => setActiveSheet(null)} title="País de Registo">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {[
            { id: '', label: 'Auto-detectar pelo formato' },
            { id: 'France', label: '🇫🇷 França' },
            { id: 'Spain', label: '🇪🇸 Espanha' },
            { id: 'Germany', label: '🇩🇪 Alemanha' },
            { id: 'UK', label: '🇬🇧 Reino Unido' },
            { id: 'Belgium', label: '🇧🇪 Bélgica' },
            { id: 'Netherlands', label: '🇳🇱 Países Baixos' },
            { id: 'Italy', label: '🇮🇹 Itália' },
            { id: 'Portugal', label: '🇵🇹 Portugal' },
            { id: 'Switzerland', label: '🇨🇭 Suíça' },
            { id: 'Austria', label: '🇦🇹 Áustria' },
            { id: 'Sweden', label: '🇸🇪 Suécia' },
          ].map(country => (
            <button
              key={country.id}
              onClick={() => {
                setSelectedCountry(country.id);
                setActiveSheet(null);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all whitespace-normal text-left min-h-[60px] mb-2 selection-item-button ${
                selectedCountry === country.id ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              {country.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Stripe Payment Modal overlay */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        availableProducts={['autofill', 'fullpack']}
        directCheckoutProductId={selectedProductId}
        vin={vinQuery}
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={handlePaymentSuccess} 
      />
    </div>
  );
}

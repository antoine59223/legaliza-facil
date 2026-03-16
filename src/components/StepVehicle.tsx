import { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Wand2 } from 'lucide-react';
import type { VehicleData, FuelType } from './Wizard';
import BottomSheet from './BottomSheet';
import { lookupCarSpec } from '../utils/carSpecs';

interface StepProps {
  data: VehicleData;
  updateData: (data: Partial<VehicleData>) => void;
  onNext: () => void;
}

const FUEL_TYPES: FuelType[] = ['Gasolina', 'Gasóleo', 'Híbrido', 'Híbrido Plug-in', 'Elétrico'];

export default function StepVehicle({ data, updateData, onNext }: StepProps) {
  const [activeSheet, setActiveSheet] = useState<'brand' | 'model' | 'year' | 'fuel' | 'engineCapacity' | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [availableSpecs, setAvailableSpecs] = useState<Partial<VehicleData>[]>([]);

  const BRANDS = ['Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Renault', 'Volkswagen', 'Tesla', 'Peugeot', 'Toyota', 'Seat', 'Skoda', 'Volvo', 'Ford'].sort();
  const MODELS_BY_BRAND: Record<string, string[]> = {
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'Q3', 'Q5', 'e-tron'],
    'BMW': ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5', 'M3', 'M4', 'i4'],
    'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLC', 'S450', 'S500'],
    'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
    'Renault': ['Clio', 'Megane', 'Captur', 'Zoe'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'ID.3', 'ID.4'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X']
  };

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 1999 }, (_, i) => (currentYear - i).toString());

  const getAvailableModels = () => {
    if (!data.brand) return [];
    return MODELS_BY_BRAND[data.brand] || ['Autre modèle...'];
  };

  useEffect(() => {
    if (data.brand.length > 2 && data.model.length >= 2 && data.year.length === 4) {
      const specs = lookupCarSpec(data.brand, data.model, data.year);
      setAvailableSpecs(specs.map(s => ({
        engineCapacity: s.engineCapacity,
        co2: s.co2,
        fuelType: s.fuelType as FuelType
      })));
      
      // If there's exactly one match and we haven't picked an engine yet, auto-fill it
      if (specs.length === 1 && !data.engineCapacity) {
         updateData({
            engineCapacity: specs[0].engineCapacity,
            co2: specs[0].co2,
            fuelType: specs[0].fuelType as FuelType,
         });
         setAutoFilled(true);
      }
    } else {
      setAvailableSpecs([]);
    }
  }, [data.brand, data.model, data.year]);

  const isComplete = data.brand && data.model && data.year && data.fuelType && data.engineCapacity && data.co2;

  // Render a mobile-friendly text input field
  const renderInput = (label: string, value: string, onChange: (val: string) => void, type = "text", placeholder = "", rightElement?: React.ReactNode) => (
    <div className="flex flex-col gap-1.5 mb-4 relative">
      <label className="text-sm font-medium text-zinc-400 ml-1">{label}</label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
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
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full relative overflow-hidden">
      {/* Subtle glow inside the panel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Detalhes do Veículo</h2>
        <p className="text-zinc-400">Insira as informações de base do veículo para la simulación.</p>
      </div>

    <div className="flex flex-col gap-1 w-full">
        {renderSelectTrigger("Marque", data.brand, "Sélectionner la marque", () => setActiveSheet('brand'))}
        
        {renderSelectTrigger("Modèle", data.model, "Sélectionner le modèle", () => {
          if (data.brand) setActiveSheet('model');
        }, !data.brand)}
        
        {renderSelectTrigger("Année d'immatriculation", data.year, "Année", () => setActiveSheet('year'))}
        
        {renderInput(
          "Cylindrée (cc)", 
          data.engineCapacity, 
          (val) => { updateData({ engineCapacity: val }); setAutoFilled(false); }, 
          "number", 
          "Ex: 1995",
          availableSpecs.length > 0 ? (
            <button
              onClick={() => setActiveSheet('engineCapacity')}
              className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
              title="Voir les motorisations connues"
            >
              <Wand2 size={18} />
              <span className="hidden sm:inline">Auto</span>
            </button>
          ) : undefined
        )}

        {renderSelectTrigger("Type de Carburant", data.fuelType, "Sélectionner...", () => setActiveSheet('fuel'))}

        {renderInput("Émissions CO2 (g/km)", data.co2, (val) => { updateData({ co2: val }); setAutoFilled(false); }, "number", "Ex: 120")}
        
        {autoFilled && availableSpecs.length === 1 && (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-1 mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Wand2 size={16} />
            Motorisation unique détectée, pré-remplie automatiquement !
          </div>
        )}
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
      <BottomSheet isOpen={activeSheet === 'brand'} onClose={() => setActiveSheet(null)} title="Marque">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {BRANDS.map(brand => (
            <button
              key={brand}
              onClick={() => {
                updateData({ brand, model: '' }); // reset model when brand changes
                setActiveSheet(null);
                setTimeout(() => setActiveSheet('model'), 300); // auto-open model sheet
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all ${
                data.brand === brand ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 2. Model Sheet */}
      <BottomSheet isOpen={activeSheet === 'model'} onClose={() => setActiveSheet(null)} title="Modèle">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-2">Modèles {data.brand}</div>
          {getAvailableModels().map(model => (
            <button
              key={model}
              onClick={() => {
                updateData({ model });
                setActiveSheet(null);
                if (!data.year) setTimeout(() => setActiveSheet('year'), 300);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all ${
                data.model === model ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              {model}
            </button>
          ))}
          <div className="h-px bg-white/10 my-2"></div>
          <div className="px-3 py-2 text-sm text-zinc-500">
            D'autres modèles peuvent être écrits manuellement si non listés.
            (A implémenter: input libre)
          </div>
        </div>
      </BottomSheet>

      {/* 3. Year Sheet */}
      <BottomSheet isOpen={activeSheet === 'year'} onClose={() => setActiveSheet(null)} title="Année">
        <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => {
                updateData({ year });
                setActiveSheet(null);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all text-lg border-b border-white/5 last:border-0 ${
                data.year === year ? 'text-blue-400 font-bold' : 'text-zinc-300 active:bg-white/5'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 4. Engine Capacity Sheet */}
      <BottomSheet isOpen={activeSheet === 'engineCapacity'} onClose={() => setActiveSheet(null)} title="Cylindrée (Motorisation)">
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          {availableSpecs.map((spec, index) => (
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
              className={`w-full text-left px-5 py-4 rounded-xl transition-all border flex justify-between items-center ${
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
      <BottomSheet isOpen={activeSheet === 'fuel'} onClose={() => setActiveSheet(null)} title="Type de Carburant">
        <div className="flex flex-col gap-2">
          {FUEL_TYPES.map(fuel => (
            <button
              key={fuel}
              onClick={() => {
                updateData({ fuelType: fuel });
                setActiveSheet(null);
              }}
              className={`w-full text-left px-6 py-4 rounded-2xl transition-all tracking-wide ${
                data.fuelType === fuel 
                ? 'bg-blue-600 shadow-[0_4px_20px_rgba(0,87,255,0.3)] text-white font-medium translate-x-2' 
                : 'bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

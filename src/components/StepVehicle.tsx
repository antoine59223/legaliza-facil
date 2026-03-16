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
  const [isFuelSheetOpen, setIsFuelSheetOpen] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (data.brand.length > 2 && data.model.length >= 2 && data.year.length === 4) {
      const spec = lookupCarSpec(data.brand, data.model, data.year);
      if (spec && (!data.engineCapacity || autoFilled)) {
         updateData({
            engineCapacity: spec.engineCapacity,
            co2: spec.co2,
            fuelType: spec.fuelType as FuelType,
         });
         setAutoFilled(true);
      }
    }
  }, [data.brand, data.model, data.year]);

  const isComplete = data.brand && data.model && data.year && data.fuelType && data.engineCapacity && data.co2;

  // Render a mobile-friendly input field
  const renderInput = (label: string, value: string, onChange: (val: string) => void, type = "text", placeholder = "") => (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-medium text-zinc-400 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
      />
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
        {renderInput("Marque", data.brand, (val) => updateData({ brand: val }), "text", "Ex: BMW")}
        {renderInput("Modèle", data.model, (val) => updateData({ model: val }), "text", "Ex: Serie 1")}
        {renderInput("Année", data.year, (val) => updateData({ year: val }), "number", "Ex: 2018")}
        
        {/* Fuel Type Mobile Selector (BottomSheet Trigger) */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-sm font-medium text-zinc-400 ml-1">Type de Carburant</label>
          <button
            onClick={() => setIsFuelSheetOpen(true)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-left flex justify-between items-center group hover:border-white/20 transition-all"
          >
            <span className={`text-lg ${data.fuelType ? 'text-white' : 'text-zinc-600'}`}>
              {data.fuelType || "Sélectionner..."}
            </span>
            <ChevronDown size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        </div>

        {renderInput("Cylindrée (cc)", data.engineCapacity, (val) => { updateData({ engineCapacity: val }); setAutoFilled(false); }, "number", "Ex: 1995")}
        {renderInput("Émissions CO2 (g/km)", data.co2, (val) => { updateData({ co2: val }); setAutoFilled(false); }, "number", "Ex: 120")}
        
        {autoFilled && (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-1 mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Wand2 size={16} />
            Cylindrée et CO2 pré-remplis automatiquement pour ce modèle !
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

      {/* iOS Style Action Sheet for Fuel Type */}
      <BottomSheet isOpen={isFuelSheetOpen} onClose={() => setIsFuelSheetOpen(false)} title="Type de Carburant">
        <div className="flex flex-col gap-2">
          {FUEL_TYPES.map(fuel => (
            <button
              key={fuel}
              onClick={() => {
                updateData({ fuelType: fuel });
                setIsFuelSheetOpen(false);
              }}
              className={`w-full text-left px-6 py-4 rounded-2xl transition-all ${
                data.fuelType === fuel 
                ? 'bg-blue-600 text-white font-medium' 
                : 'glass-button text-zinc-300'
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

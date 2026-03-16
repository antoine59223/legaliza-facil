import React from 'react';
import { ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import type { VehicleData } from './Wizard';

interface StepHybridProps {
  data: VehicleData;
  updateData: (data: Partial<VehicleData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepHybrid({ data, updateData, onNext, onBack }: StepHybridProps) {
  const isComplete = data.rangeOver50km !== null && data.co2Under50g !== null;

  const BinaryQuestion = ({ 
    question, 
    value, 
    onChange 
  }: { 
    question: React.ReactNode, 
    value: boolean | null, 
    onChange: (val: boolean) => void 
  }) => (
    <div className="flex flex-col gap-4 mb-8 bg-black/20 p-5 rounded-3xl border border-white/5">
      <p className="text-zinc-200 font-medium text-lg leading-snug">{question}</p>
      <div className="flex gap-3">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
            value === true 
            ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
            : 'glass-button text-zinc-400 border-white/5'
          }`}
        >
          <Check size={20} className={value === true ? "text-blue-500" : ""} />
          <span className="font-semibold">OUI</span>
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
            value === false 
            ? 'bg-zinc-800 border-zinc-500 text-zinc-300' 
            : 'glass-button text-zinc-400 border-white/5'
          }`}
        >
          <X size={20} />
          <span className="font-semibold">NON</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full">
      <div className="mb-8">
        <button onClick={onBack} className="p-2 -ml-2 mb-4 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Critères Hybride</h2>
        <p className="text-zinc-400">Répondez à ces questions simples pour affiner la simulation de votre hybride.</p>
      </div>

      <div className="flex flex-col w-full">
        <BinaryQuestion
          question={<span>L'autonomie en mode 100% électrique est-elle <strong>supérieure à 50 km</strong> ?</span>}
          value={data.rangeOver50km}
          onChange={(val) => updateData({ rangeOver50km: val })}
        />
        
        <BinaryQuestion
          question={<span>Les émissions de CO2 sont-elles <strong>inférieures à 50 g/km</strong> ?</span>}
          value={data.co2Under50g}
          onChange={(val) => updateData({ co2Under50g: val })}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!isComplete}
        className={`mt-4 w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold transition-all duration-300 ${
          isComplete 
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(0,87,255,0.4)]' 
          : 'bg-white/5 text-zinc-500 cursor-not-allowed'
        }`}
      >
        <span>Próximo</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );
}

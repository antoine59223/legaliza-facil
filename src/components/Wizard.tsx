import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepVehicle from './StepVehicle';
import StepHybrid from './StepHybrid';
import StepResult from './StepResult';

export type FuelType = 'Gasolina' | 'Gasóleo' | 'Híbrido' | 'Híbrido Plug-in' | 'Elétrico' | 'GPL / GNC';

export interface VehicleData {
  brand: string;
  model: string;
  year: string;
  fuelType: FuelType | '';
  engineCapacity: string;
  co2: string;
  wltp: boolean;
  origin: 'UE' | 'OUTRA';
  rangeOver50km: boolean | null;
  co2Under50g: boolean | null;
  acceptedTerms: boolean;
  unlockedProducts: string[];
}

const initialData: VehicleData = {
  brand: '',
  model: '',
  year: '',
  fuelType: '',
  engineCapacity: '',
  co2: '',
  wltp: false,
  origin: 'UE',
  rangeOver50km: null,
  co2Under50g: null,
  acceptedTerms: false,
  unlockedProducts: [],
};

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<VehicleData>(initialData);

  const handleNext = () => {
    if (step === 1 && (data.fuelType === 'Híbrido' || data.fuelType === 'Híbrido Plug-in')) {
      setStep(2);
    } else if (step === 1) {
      setStep(3); // Skip hybrid questions if not hybrid
    } else {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    if (step === 3 && data.fuelType !== 'Híbrido' && data.fuelType !== 'Híbrido Plug-in') {
      setStep(1); // Go back directly to step 1
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };

  const updateData = (updates: Partial<VehicleData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setData(initialData);
    setStep(1);
  };

  return (
    <div className="w-full flex justify-center perspective-[1000px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20, rotateY: 5 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: -20, rotateY: -5 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full"
        >
          {step === 1 && <StepVehicle data={data} updateData={updateData} onNext={handleNext} />}
          {step === 2 && <StepHybrid data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />}
          {step === 3 && <StepResult data={data} updateData={updateData} onBack={handleBack} onReset={handleReset} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

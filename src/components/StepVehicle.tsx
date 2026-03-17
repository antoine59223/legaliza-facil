import { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Wand2, CheckSquare, Square, Search, Loader2, Lock } from 'lucide-react';
import type { VehicleData, FuelType } from './Wizard';
import BottomSheet from './BottomSheet';
import { lookupCarSpec, lookupCO2 } from '../utils/carSpecs';

import PaymentModal from './PaymentModal';

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
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [vinQuery, setVinQuery] = useState('');
  const [isSearchingVin, setIsSearchingVin] = useState(false);
  const [vinError, setVinError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOfficialData, setIsOfficialData] = useState(false);

  const BRANDS = [
    'Abarth', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 
    'Citroën', 'Cupra', 'Dacia', 'DS Automobiles', 'Ferrari', 'Fiat', 'Ford', 
    'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 
    'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 
    'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Rolls-Royce', 
    'Seat', 'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 
    'Volkswagen', 'Volvo', 'Outro...'
  ];

  const MODELS_BY_BRAND: Record<string, string[]> = {
    'Alfa Romeo': ['159', '166', '4C', '8C', 'Brera', 'Giulia', 'Giulietta', 'GT', 'Mito', 'Spider', 'Stelvio', 'Tonale'],
    'Audi': ['A1', 'A2', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A6 Allroad', 'A7', 'A8', 'e-tron', 'e-tron GT', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'TT', 'TT RS', 'TTS'],
    'BMW': [
      'Série 1', '114', '116', '118', '120', '123', '125', '128', '130', '135', '140', 'M1',
      'Série 2', '214', '216', '218', '220', '225', '228', '230', 'M2',
      'Série 3', '316', '318', '320', '323', '325', '328', '330', '335', '340', 'M3',
      'Série 4', '418', '420', '425', '428', '430', '435', '440', 'M4',
      'Série 5', '518', '520', '523', '525', '528', '530', '535', '540', '545', '550', 'M5',
      'Série 6', '630', '635', '640', '645', '650', 'M6',
      'Série 7', '725', '728', '730', '735', '740', '745', '750', '760',
      'Série 8', '840', '850', 'M8',
      'X1', 'X2', 'X3', 'X3 M', 'X4', 'X4 M', 'X5', 'X5 M', 'X6', 'X6 M', 'X7',
      'Z3', 'Z4', 'Z8',
      'i3', 'i4', 'i7', 'i8', 'iX', 'iX1', 'iX3'
    ],
    'Citroën': ['AMI', 'Berlingo', 'C-Crosser', 'C-Elysée', 'C-Zero', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Aircross', 'C4 Cactus', 'C4 Picasso', 'C4 SpaceTourer', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'E-Mehari', 'Grand C4 Picasso', 'Grand C4 SpaceTourer', 'Jumper', 'Jumpy', 'Nemo', 'SpaceTourer'],
    'Cupra': ['Ateca', 'Born', 'Formentor', 'Leon'],
    'Dacia': ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Sandero', 'Spring'],
    'Fiat': ['124 Spider', '500', '500C', '500L', '500X', 'Abarth 500', 'Bravo', 'Doblo', 'Ducato', 'Fiorino', 'Freemont', 'Panda', 'Punto', 'Qubo', 'Scudo', 'Sedici', 'Talento', 'Tipo', 'Ulysse'],
    'Ford': ['B-Max', 'Bronco', 'C-Max', 'EcoSport', 'Edge', 'Explorer', 'Fiesta', 'Focus', 'Galaxy', 'Grand C-Max', 'Ka', 'Ka+', 'Kuga', 'Mondeo', 'Mustang', 'Mustang Mach-E', 'Puma', 'Ranger', 'S-Max', 'Tourneo Connect', 'Tourneo Courier', 'Tourneo Custom', 'Transit', 'Transit Connect', 'Transit Courier', 'Transit Custom'],
    'Honda': ['Accord', 'Civic', 'CR-V', 'CR-Z', 'e', 'HR-V', 'Insight', 'Jazz', 'NSX'],
    'Hyundai': ['Bayon', 'Elantra', 'Grand Santa Fe', 'H-1', 'i10', 'i20', 'i20 N', 'i30', 'i30 N', 'i40', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'ix20', 'ix35', 'Kona', 'Kona N', 'Nexo', 'Santa Fe', 'Staria', 'Tucson'],
    'Jeep': ['Avenger', 'Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler'],
    'Kia': ['Carens', 'Ceed', 'Ceed Sportswagon', 'e-Niro', 'e-Soul', 'EV6', 'EV9', 'Niro', 'Optima', 'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Xceed'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
    'Lexus': ['CT', 'ES', 'GS', 'IS', 'LC', 'LS', 'NX', 'RC', 'RX', 'UX'],
    'Mazda': ['CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-80', 'Mazda2', 'Mazda3', 'Mazda5', 'Mazda6', 'MX-30', 'MX-5', 'RX-8'],
    'Mercedes-Benz': [
      'Classe A', 'A 140', 'A 150', 'A 160', 'A 170', 'A 180', 'A 190', 'A 200', 'A 210', 'A 220', 'A 250', 'A 35 AMG', 'A 45 AMG',
      'Classe B', 'B 150', 'B 160', 'B 170', 'B 180', 'B 200', 'B 220', 'B 250',
      'Classe C', 'C 160', 'C 180', 'C 200', 'C 220', 'C 230', 'C 240', 'C 250', 'C 270', 'C 280', 'C 300', 'C 320', 'C 350', 'C 400', 'C 43 AMG', 'C 63 AMG',
      'Classe CLA', 'CLA 180', 'CLA 200', 'CLA 220', 'CLA 250', 'CLA 35 AMG', 'CLA 45 AMG',
      'Classe CLK', 'CLK 200', 'CLK 220', 'CLK 230', 'CLK 240', 'CLK 270', 'CLK 280', 'CLK 320', 'CLK 350', 'CLK 430', 'CLK 500', 'CLK 55 AMG', 'CLK 63 AMG',
      'Classe CLS', 'CLS 220', 'CLS 250', 'CLS 300', 'CLS 320', 'CLS 350', 'CLS 400', 'CLS 450', 'CLS 500', 'CLS 53 AMG', 'CLS 63 AMG',
      'Classe E', 'E 200', 'E 220', 'E 230', 'E 240', 'E 250', 'E 270', 'E 280', 'E 300', 'E 320', 'E 350', 'E 400', 'E 430', 'E 500', 'E 53 AMG', 'E 63 AMG',
      'Classe G', 'G 320', 'G 350', 'G 400', 'G 500', 'G 55 AMG', 'G 63 AMG',
      'Classe GLA', 'GLA 180', 'GLA 200', 'GLA 220', 'GLA 250', 'GLA 35 AMG', 'GLA 45 AMG',
      'Classe GLB', 'GLB 180', 'GLB 200', 'GLB 220', 'GLB 250', 'GLB 35 AMG',
      'Classe GLC', 'GLC 200', 'GLC 220', 'GLC 250', 'GLC 300', 'GLC 350', 'GLC 400', 'GLC 43 AMG', 'GLC 63 AMG',
      'Classe GLE', 'GLE 250', 'GLE 300', 'GLE 350', 'GLE 400', 'GLE 450', 'GLE 500', 'GLE 53 AMG', 'GLE 63 AMG',
      'Classe GLS', 'GLS 350', 'GLS 400', 'GLS 450', 'GLS 500', 'GLS 580', 'GLS 63 AMG',
      'Classe M (ML)', 'ML 230', 'ML 250', 'ML 270', 'ML 280', 'ML 320', 'ML 350', 'ML 400', 'ML 420', 'ML 430', 'ML 500', 'ML 55 AMG', 'ML 63 AMG',
      'Classe S', 'S 250', 'S 260', 'S 280', 'S 300', 'S 320', 'S 350', 'S 400', 'S 420', 'S 430', 'S 450', 'S 500', 'S 55 AMG', 'S 550', 'S 560', 'S 580', 'S 600', 'S 63 AMG', 'S 65 AMG', 'S 680',
      'Classe SL', 'SL 280', 'SL 300', 'SL 320', 'SL 350', 'SL 400', 'SL 500', 'SL 55 AMG', 'SL 600', 'SL 63 AMG', 'SL 65 AMG',
      'Classe SLK/SLC', 'SLK 200', 'SLK 230', 'SLK 250', 'SLK 280', 'SLK 320', 'SLK 350', 'SLK 55 AMG', 'SLC 180', 'SLC 200', 'SLC 300', 'SLC 43 AMG',
      'AMG GT', 'Citan', 'Classe X', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV', 'Maybach', 'Viano', 'Vito'
    ],
    'Mini': ['Cabrio', 'Clubman', 'Countryman', 'Coupe', 'Mini 3 Portes', 'Mini 5 Portes', 'Paceman', 'Roadster'],
    'Nissan': ['350Z', '370Z', 'Ariya', 'Evalia', 'GT-R', 'Juke', 'Leaf', 'Micra', 'Murano', 'Navara', 'Note', 'NV200', 'NV300', 'NV400', 'Pathfinder', 'Patrol', 'Pixo', 'Primastar', 'Pulsar', 'Qashqai', 'Qashqai+2', 'Townstar', 'X-Trail'],
    'Opel': ['Adam', 'Agila', 'Ampera', 'Antara', 'Astra', 'Cascada', 'Combo', 'Combo Life', 'Corsa', 'Crossland', 'Crossland X', 'Frontera', 'Grandland', 'Grandland X', 'Insignia', 'Karl', 'Meriva', 'Mokka', 'Mokka X', 'Movano', 'Tigra', 'Vectra', 'Vivaro', 'Zafira', 'Zafira Life', 'Zafira Tourer'],
    'Peugeot': ['107', '108', '2008', '206', '207', '208', '3008', '301', '307', '308', '4007', '4008', '407', '408', '5008', '508', '607', '807', 'Bipper', 'Boxer', 'Expert', 'ION', 'Partner', 'RCZ', 'Rifter', 'Traveller'],
    'Porsche': ['718 Boxster', '718 Cayman', '911', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
    'Renault': ['Alaskan', 'Arkana', 'Austral', 'Avantime', 'Captur', 'Clio', 'Espace', 'Express', 'Fluence', 'Grand Modus', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Latitude', 'Megane', 'Megane E-Tech', 'Modus', 'Rafale', 'Scenic', 'Symbioz', 'Talisman', 'Trafic', 'Twingo', 'Twizy', 'Vel Satis', 'Wind', 'Zoe'],
    'Seat': ['Alhambra', 'Altea', 'Altea XL', 'Arona', 'Ateca', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo'],
    'Skoda': ['Citigo', 'Enyaq', 'Enyaq Coupe', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
    'Toyota': ['Auris', 'Avensis', 'Aygo', 'Aygo X', 'bZ4X', 'C-HR', 'Camry', 'Corolla', 'Corolla Cross', 'GR86', 'GT86', 'Highlander', 'Hilux', 'iQ', 'Land Cruiser', 'Mirai', 'Prius', 'Prius+', 'Proace', 'Proace City', 'Proace City Verso', 'Proace Verso', 'RAV4', 'Supra', 'Urban Cruiser', 'Verso', 'Yaris', 'Yaris Cross'],
    'Volkswagen': ['Amarok', 'Arteon', 'Beetle', 'Caddy', 'California', 'Caravelle', 'CC', 'Crafter', 'Eos', 'Fox', 'Golf', 'Golf Plus', 'Golf Sportsvan', 'Grand California', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz', 'Jetta', 'Multivan', 'Passat', 'Passat CC', 'Phaeton', 'Polo', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'Taigo', 'Tiguan', 'Tiguan Allspace', 'Touareg', 'Touran', 'Transporter', 'Up!'],
    'Volvo': ['C30', 'C40', 'C70', 'EX30', 'EX90', 'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
  };

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 1980 }, (_, i) => (currentYear - i).toString());

  const getAvailableModels = () => {
    if (!data.brand) return [];
    return MODELS_BY_BRAND[data.brand] || ['Outro modelo...'];
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

  const isComplete = data.brand && data.model && data.year && data.fuelType && data.engineCapacity && data.co2 && data.acceptedTerms;

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

      // CO2 fallback: if RegCheck didn't return CO2, look it up in our local spec database
      const co2Value = rawCo2 || lookupCO2(rawMake, rawModel, rawYear, rawFuelType);

      updateData({
        brand: rawMake,
        model: rawModel,
        year: rawYear,
        fuelType: rawFuelType as FuelType,
        engineCapacity: String(result.engine_cc || ''),
        co2: co2Value,
        unlockedProducts: newUnlocked
      });

      
      setAutoFilled(true);
      setIsOfficialData(true);
      if (result.make && !BRANDS.includes(result.make)) setIsCustomBrand(true);
      
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
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full relative overflow-hidden">
      {/* Subtle glow inside the panel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Detalhes do Veículo</h2>
        <p className="text-zinc-400">Insira as informações básicas do veículo para a simulação.</p>
      </div>

      {/* VIN / License Plate Search Area - PREMIUM PAYWALL */}
      <div className="mb-8 p-5 bg-gradient-to-br from-blue-900/40 to-black/40 border border-blue-500/30 rounded-2xl relative overflow-hidden group">
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
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-white/10 disabled:to-white/10 disabled:text-zinc-500 text-white px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[56px] gap-2 font-medium"
            >
              {isSearchingVin ? <Loader2 size={20} className="animate-spin" /> : <><Search size={18} /> <span className="hidden sm:inline">Desbloquear</span></>}
            </button>
          </div>
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
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-zinc-900 border border-red-400/30 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="">País auto-detectado</option>
                <option value="France">🇫🇷 France</option>
                <option value="Spain">🇪🇸 Espanha</option>
                <option value="Germany">🇩🇪 Alemanha</option>
                <option value="UK">🇬🇧 Reino Unido</option>
                <option value="Belgium">🇧🇪 Bélgica</option>
                <option value="Netherlands">🇳🇱 Países Baixos</option>
                <option value="Italy">🇮🇹 Itália</option>
                <option value="Portugal">🇵🇹 Portugal</option>
                <option value="Switzerland">🇨🇭 Suíça</option>
                <option value="Austria">🇦🇹 Áustria</option>
                <option value="Sweden">🇸🇪 Suécia</option>
              </select>
              <span className="text-xs text-red-400/50">Depois clique novamente na lupa para tentar de novo.</span>
            </div>
          )}

          {!isSearchingVin && (
            <div className="flex items-center justify-center gap-2 text-blue-200 text-sm mt-2 p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
              Desbloqueie os dados oficiais europeus por <strong className="text-white"> 2,99€</strong>
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
          {BRANDS.map(brand => (
            <button
              key={brand}
              onClick={() => {
                if (brand === 'Outro...') {
                  setIsCustomBrand(true);
                  setIsCustomModel(true);
                  updateData({ brand: '', model: '' });
                  setActiveSheet(null);
                } else {
                  setIsCustomBrand(false);
                  setIsCustomModel(false);
                  updateData({ brand, model: '' });
                  setActiveSheet(null);
                  setTimeout(() => setActiveSheet('model'), 300);
                }
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
      <BottomSheet isOpen={activeSheet === 'model'} onClose={() => setActiveSheet(null)} title="Modelo">
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-2">Modelos {data.brand}</div>
          {[...getAvailableModels(), 'Outro modelo...'].map(model => (
            <button
              key={model}
              onClick={() => {
                if (model === 'Outro modelo...') {
                  setIsCustomModel(true);
                  updateData({ model: '' });
                  setActiveSheet(null);
                } else {
                  setIsCustomModel(false);
                  updateData({ model });
                  setActiveSheet(null);
                  if (!data.year) setTimeout(() => setActiveSheet('year'), 300);
                }
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all ${
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
                className={`w-full text-left px-6 py-4 rounded-2xl transition-all tracking-wide ${
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
      
      {/* Stripe Payment Modal overlay */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        availableProducts={['autofill', 'fullpack']}
        directCheckoutProductId="autofill"
        vin={vinQuery}
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={handlePaymentSuccess} 
      />
    </div>
  );
}

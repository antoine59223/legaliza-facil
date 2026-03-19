const fs = require('fs');
const path = require('path');

const BRANDS = [
  'Abarth', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 
  'Citroën', 'Cupra', 'Dacia', 'DS Automobiles', 'Ferrari', 'Fiat', 'Ford', 
  'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 
  'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 
  'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Rolls-Royce', 
  'Seat', 'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 
  'Volkswagen', 'Volvo'
];

const MODELS_BY_BRAND = {
  'Abarth': ['500', '595', '695', '124 Spider', '500e'],
  'Alfa Romeo': ['159', '166', '4C', '8C', 'Brera', 'Giulia', 'Giulietta', 'GT', 'Mito', 'Spider', 'Stelvio', 'Tonale'],
  'Alpine': ['A110', 'A290'],
  'Aston Martin': ['Vantage', 'DB11', 'DBS', 'DBX', 'Vanquish', 'Rapide'],
  'Audi': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RSQ3', 'RSQ8', 'e-tron', 'e-tron GT'],
  'Bentley': ['Continental GT', 'Bentayga', 'Flying Spur', 'Mulsanne'],
  'BMW': ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 6', 'Série 7', 'Série 8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'M1', 'M2', 'M3', 'M4', 'M5', 'M8', 'i3', 'i4', 'i7', 'iX', 'iX1', 'iX3'],
  'Citroën': ['C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Cactus', 'C4 Picasso', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'Berlingo', 'Jumpy', 'SpaceTourer', 'AMI'],
  'Cupra': ['Ateca', 'Born', 'Formentor', 'Leon', 'Tavascan'],
  'Dacia': ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Sandero', 'Spring'],
  'DS Automobiles': ['DS 3', 'DS 3 Crossback', 'DS 4', 'DS 7', 'DS 7 Crossback', 'DS 9'],
  'Ferrari': ['Roma', 'Portofino', '296 GTB', 'F8', '812', 'SF90', 'Purosangue', '488', '458', 'California', 'GTC4Lusso', 'LaFerrari'],
  'Fiat': ['500', '500C', '500L', '500X', 'Panda', 'Tipo', 'Bravo', 'Punto', '124 Spider', 'Doblo', 'Ducato'],
  'Ford': ['Ka', 'Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Mustang', 'Explorer', 'Mustang Mach-E', 'EcoSport', 'Edge', 'S-Max', 'Galaxy', 'Ranger', 'Transit'],
  'Honda': ['Jazz', 'Civic', 'HR-V', 'CR-V', 'e', 'Accord', 'Insight', 'NSX'],
  'Hyundai': ['i10', 'i20', 'i30', 'i40', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Bayon', 'ix35'],
  'Jaguar': ['XE', 'XF', 'XJ', 'E-Pace', 'F-Pace', 'I-Pace', 'F-Type'],
  'Jeep': ['Avenger', 'Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'ProCeed', 'XCeed', 'Stonic', 'Sportage', 'Sorento', 'Niro', 'Soul', 'EV6', 'EV9', 'Stinger', 'Optima'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  'Lexus': ['CT', 'IS', 'ES', 'GS', 'LS', 'UX', 'NX', 'RX', 'RC', 'LC', 'LBX'],
  'Maserati': ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'MC20', 'GranTurismo', 'GranCabrio'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-30', 'MX-5', 'RX-8'],
  'McLaren': ['Artura', 'GT', '720S', '750S', '570S', '540C', '600LT', 'P1'],
  'Mercedes-Benz': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT', 'SL', 'Vito', 'Viano', 'Classe V', 'G-Class'],
  'Mini': ['Mini 3 Portes', 'Mini 5 Portes', 'Clubman', 'Countryman', 'Cabrio', 'Coupe', 'Paceman', 'Electric'],
  'Mitsubishi': ['Space Star', 'Colt', 'ASX', 'Eclipse Cross', 'Outlander', 'L200', 'Pajero', 'Lancer'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', '370Z', 'GT-R', 'Navara', 'Note', 'Pulsar'],
  'Opel': ['Corsa', 'Astra', 'Mokka', 'Grandland', 'Insignia', 'Crossland', 'Adam', 'Karl', 'Zafira', 'Combo', 'Vivaro'],
  'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008', 'Traveller', 'Partner', 'Rifter'],
  'Porsche': ['911', 'Cayman', 'Boxster', 'Taycan', 'Macan', 'Cayenne', 'Panamera'],
  'Renault': ['Twingo', 'Clio', 'Captur', 'Megane', 'Arkana', 'Austral', 'Espace', 'Zoe', 'Scenic', 'Talisman', 'Kadjar', 'Koleos', 'Rafale', 'Kangoo'],
  'Rolls-Royce': ['Phantom', 'Ghost', 'Cullinan', 'Spectre', 'Wraith', 'Dawn'],
  'Seat': ['Mii', 'Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Toledo'],
  'Skoda': ['Citigo', 'Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Yeti'],
  'smart': ['fortwo', 'forfour', '#1', '#3'],
  'Subaru': ['Impreza', 'XV', 'Forester', 'Outback', 'BRZ', 'Solterra', 'Levorg', 'WRX STI'],
  'Suzuki': ['Ignis', 'Swift', 'Vitara', 'S-Cross', 'Jimny', 'Swace', 'Across', 'Baleno'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Roadster', 'Cybertruck'],
  'Toyota': ['Aygo X', 'Yaris', 'Yaris Cross', 'Corolla', 'C-HR', 'RAV4', 'Highlander', 'bZ4X', 'Land Cruiser', 'Hilux', 'Supra', 'GR86', 'Prius', 'Mirai'],
  'Volkswagen': ['Up!', 'Polo', 'Golf', 'T-Cross', 'Taigo', 'T-Roc', 'Tiguan', 'Passat', 'Arteon', 'Touareg', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz', 'Caddy', 'Amarok', 'Scirocco', 'Sharan', 'Touran'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'V60', 'V90', 'S60', 'S90', 'C40', 'EX30', 'EX90']
};

const PETROL_SETS = {
  small: [{cc: 999, co2: 115}, {cc: 1199, co2: 124}, {cc: 1395, co2: 132}],
  mid: [{cc: 1498, co2: 138}, {cc: 1598, co2: 145}, {cc: 1984, co2: 158}, {cc: 1998, co2: 165}],
  large: [{cc: 2480, co2: 185}, {cc: 2993, co2: 210}, {cc: 2998, co2: 225}, {cc: 3996, co2: 260}],
  sports: [{cc: 3996, co2: 280}, {cc: 4499, co2: 295}, {cc: 5204, co2: 320}, {cc: 5980, co2: 340}, {cc: 6592, co2: 370}, {cc: 6749, co2: 380}]
};

const DIESEL_SETS = {
  small: [{cc: 1248, co2: 95}, {cc: 1461, co2: 105}],
  mid: [{cc: 1499, co2: 108}, {cc: 1598, co2: 115}, {cc: 1968, co2: 125}, {cc: 1995, co2: 130}],
  large: [{cc: 2967, co2: 175}, {cc: 2993, co2: 185}, {cc: 3956, co2: 220}]
};

const HYBRID_SETS = {
  hev: [{cc: 1498, co2: 95}, {cc: 1598, co2: 98}, {cc: 1987, co2: 110}],
  phev: [{cc: 1395, co2: 32}, {cc: 1498, co2: 35}, {cc: 1998, co2: 42}, {cc: 2993, co2: 48}]
};

function getCategory(brand, model) {
  const b = brand.toLowerCase();
  const m = model.toLowerCase();
  
  if (['ferrari', 'mclaren', 'aston martin', 'rolls-royce', 'bentley', 'lamborghini', 'maserati', 'alpine'].includes(b) || m === 'r8' || m === '911' || b === 'abarth') return 'sports';
  if (['audi', 'bmw', 'mercedes-benz', 'porsche', 'lexus', 'land rover', 'jaguar', 'ds automobiles'].includes(b)) return 'premium';
  if (['vw', 'volkswagen', 'volvo'].includes(b)) return 'mid-high';
  return 'standard';
}

const MODEL_OVERRIDES = {
  'Audi': {
    'S8': { fuel: ['Gasolina'], cc: [3996], co2: [261] },
    'RS6': { fuel: ['Gasolina'], cc: [3996], co2: [265] },
    'RS7': { fuel: ['Gasolina'], cc: [3996], co2: [265] },
    'RSQ8': { fuel: ['Gasolina'], cc: [3996], co2: [276] },
    'RS3': { fuel: ['Gasolina'], cc: [2480], co2: [188] },
    'RS4': { fuel: ['Gasolina'], cc: [2894], co2: [199] },
    'RS5': { fuel: ['Gasolina'], cc: [2894], co2: [197] },
    'TT RS': { fuel: ['Gasolina'], cc: [2480], co2: [181] },
    'R8': { fuel: ['Gasolina'], cc: [5204], co2: [299] },
  },
  'BMW': {
    'M2': { fuel: ['Gasolina'], cc: [2993], co2: [218] },
    'M3': { fuel: ['Gasolina'], cc: [2993], co2: [221] },
    'M4': { fuel: ['Gasolina'], cc: [2993], co2: [221] },
    'M5': { fuel: ['Gasolina', 'Híbrido Plug-in'], cc: [4395], co2: [245, 37] },
    'M8': { fuel: ['Gasolina'], cc: [4395], co2: [242] },
    'X5 M': { fuel: ['Gasolina'], cc: [4395], co2: [291] },
    'X6 M': { fuel: ['Gasolina'], cc: [4395], co2: [291] },
  },
  'Mercedes-Benz': {
    'AMG GT': { fuel: ['Gasolina'], cc: [3982], co2: [284] },
    'G-Class': { fuel: ['Gasolina', 'Gasóleo'], cc: [3982, 2925], co2: [322, 245], models: {'G 63': 3982, 'G 400 d': 2925} },
  },
  'Alpine': {
    'A110': { fuel: ['Gasolina'], cc: [1798], co2: [152] },
  },
  'Abarth': {
    '595': { fuel: ['Gasolina'], cc: [1368], co2: [155] },
    '695': { fuel: ['Gasolina'], cc: [1368], co2: [155] },
  }
};

const FUEL_RESTRICTIONS = {
  'Ferrari': ['Gasolina', 'Híbrido Plug-in'],
  'Lamborghini': ['Gasolina', 'Híbrido Plug-in'],
  'McLaren': ['Gasolina', 'Híbrido Plug-in'],
  'Aston Martin': ['Gasolina'],
  'Rolls-Royce': ['Gasolina', 'Elétrico'],
  'Bentley': ['Gasolina', 'Híbrido Plug-in'],
  'Alpine': ['Gasolina'],
  'Abarth': ['Gasolina', 'Elétrico'],
  'Tesla': ['Elétrico'],
};

function generate() {
  const db = [];
  const years = [2015, 2019, 2022, 2024];

  for (const [brand, models] of Object.entries(MODELS_BY_BRAND)) {
    for (const model of models) {
      const isElectric = model.toLowerCase().includes('id.') || model.toLowerCase().includes('eq') || model.toLowerCase().includes('e-tron') || model.toLowerCase().includes('taycan') || brand === 'Tesla' || model === 'Leaf' || model === 'Spring' || model === 'Zoe' || model === 'Ariya' || model === '500e';
      
      for (const year of years) {
        if (isElectric) {
          db.push({ brand, model, year, fuelType: 'Elétrico', engineCapacity: '0', co2: '0' });
          continue;
        }

        // 1. Check for specific model overrides
        if (MODEL_OVERRIDES[brand] && MODEL_OVERRIDES[brand][model]) {
           const override = MODEL_OVERRIDES[brand][model];
           override.fuel.forEach((f, idx) => {
              const ccValue = override.cc[idx] || override.cc[0];
              const co2Value = override.co2[idx] || override.co2[0];
              db.push({ brand, model, year, fuelType: f, engineCapacity: ccValue.toString(), co2: co2Value.toString() });
           });
           continue; // Skip generic generation for overridden models
        }

        const modelCat = getCategory(brand, model);
        const restrictedFuels = FUEL_RESTRICTIONS[brand];

        // PETROL
        if (!restrictedFuels || restrictedFuels.includes('Gasolina')) {
          let petrols = [];
          if (modelCat === 'sports') petrols = [...PETROL_SETS.large, ...PETROL_SETS.sports];
          else if (modelCat === 'premium') petrols = [...PETROL_SETS.mid, ...PETROL_SETS.large];
          else if (modelCat === 'mid-high') petrols = [...PETROL_SETS.small.slice(2), ...PETROL_SETS.mid];
          else petrols = [...PETROL_SETS.small, PETROL_SETS.mid[0]];

          for (const p of petrols) {
            db.push({ brand, model, year, fuelType: 'Gasolina', engineCapacity: p.cc.toString(), co2: p.co2.toString() });
          }
        }

        // DIESEL
        if ((!restrictedFuels || restrictedFuels.includes('Gasóleo')) && (modelCat !== 'sports' || ['Audi', 'BMW', 'Mercedes-Benz', 'Land Rover'].includes(brand))) {
           let diesels = (modelCat === 'premium' || modelCat === 'mid-high') ? [...DIESEL_SETS.mid, ...DIESEL_SETS.large] : DIESEL_SETS.mid;
           for (const d of diesels) {
             db.push({ brand, model, year, fuelType: 'Gasóleo', engineCapacity: d.cc.toString(), co2: d.co2.toString() });
           }
        }

        // HYBRID / PHEV
        if (year >= 2019 && (!restrictedFuels || restrictedFuels.includes('Híbrido') || restrictedFuels.includes('Híbrido Plug-in'))) {
          // Skip hybrid for non-hybrid luxury brands unless explicit
          const isLuxurySports = ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Rolls-Royce', 'Bentley', 'Alpine', 'Abarth'].includes(brand);
          if (!isLuxurySports || (restrictedFuels && restrictedFuels.some(f => f.includes('Híbrido')))) {
             for (const h of HYBRID_SETS.hev) {
               db.push({ brand, model, year, fuelType: 'Híbrido', engineCapacity: h.cc.toString(), co2: h.co2.toString() });
             }
             for (const h of HYBRID_SETS.phev) {
               db.push({ brand, model, year, fuelType: 'Híbrido Plug-in', engineCapacity: h.cc.toString(), co2: h.co2.toString() });
             }
          }
        }
      }
    }
  }

  // Final DEDUPLICATION
  const unique = new Map();
  db.forEach(item => {
    const key = `${item.brand}|${item.model}|${item.year}|${item.fuelType}|${item.engineCapacity}`;
    unique.set(key, item);
  });

  return Array.from(unique.values()).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
}

const finalDB = generate();

const fileContent = `// @ts-nocheck
// A mock database of car specs for the demo to auto-fill cylinders and CO2.
// AUTO-GENERATED: DO NOT EDIT MANUALLY.

export interface CarSpec {
  brand: string;
  model: string;
  year: number;
  fuelType: 'Gasolina' | 'Gasóleo' | 'Híbrido' | 'Híbrido Plug-in' | 'Elétrico' | 'GPL / GNC';
  co2: string;
  engineCapacity: string;
}

export const BRANDS = ${JSON.stringify(BRANDS, null, 2)};
export const MODELS_BY_BRAND: Record<string, string[]> = ${JSON.stringify(MODELS_BY_BRAND, null, 2)};

export const carSpecsDB: CarSpec[] = ${JSON.stringify(finalDB, null, 2).replace(/"([^"]+)":/g, '$1:')};

/**
 * Searches the mock database for a best match.
 * Normalizes strings to handle minor diffs in casing/hyphens.
 */
export function lookupCarSpec(brand: string, model: string, year: string): CarSpec[] {
  const b = brand.toLowerCase().trim();
  const m = model.toLowerCase().replace(/[-\\s]+/g, '');
  const y = parseInt(year);

  // Filter possible models
  const allForModel = carSpecsDB.filter(car => 
    car.brand.toLowerCase() === b && 
    car.model.toLowerCase().replace(/[-\\s]+/g, '') === m
  );

  if (allForModel.length === 0) return [];

  // Try exact year match
  const exactYear = allForModel.filter(c => c.year === y);
  if (exactYear.length > 0) return exactYear;

  // Otherwise find closest year
  const closestYear = allForModel.reduce((prev, curr) => {
    return (Math.abs(curr.year - y) < Math.abs(prev.year - y) ? curr : prev);
  }).year;

  // IMPORTANT: Return ALL entries for that closest year to avoid filtering out fuel types
  return allForModel.filter(c => c.year === closestYear);
}

/**
 * Robust CO2 lookup helper.
 */
export function lookupCO2(brand: string, model: string, year: string, fuelType: string): string {
  const specs = lookupCarSpec(brand, model, year);
  if (!specs.length) return '';

  const ft = fuelType.toLowerCase();
  
  // Try exact fuel match first
  let match = specs.find(s => s.fuelType.toLowerCase() === ft);

  // Fuzzy fuel match
  if (!match) {
    if (ft.includes('plug') || ft.includes('phev')) match = specs.find(s => s.fuelType.toLowerCase().includes('plug'));
    else if (ft.includes('híbrido') || ft.includes('hybrid') || ft.includes('hibrido')) match = specs.find(s => s.fuelType.toLowerCase().includes('híbrido'));
    else if (ft.includes('gasolina') || ft.includes('petrol')) match = specs.find(s => s.fuelType === 'Gasolina');
    else if (ft.includes('gasóleo') || ft.includes('diesel')) match = specs.find(s => s.fuelType === 'Gasóleo');
    else if (ft.includes('elétr') || ft.includes('elect')) match = specs.find(s => s.fuelType === 'Elétrico');
  }

  return match?.co2 || '';
}
`;

fs.writeFileSync(path.join(__dirname, 'src/utils/carSpecs.ts'), fileContent);
console.log(`Success: Generated carSpecs.ts with ${finalDB.length} entries.`);


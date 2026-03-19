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
  'Abarth': ['500','595','695','124 Spider','500e'],
  'Alfa Romeo': ['159','166','4C','8C','Brera','GT','Giulia','Giulietta','Mito','Spider','Stelvio','Tonale'],
  'Alpine': ['A110','A290'],
  'Aston Martin': ['Vantage','DB11','DBS','DBX','Vanquish','Rapide'],
  'Audi': ['A1','A2','A3','A4','A4 Allroad','A5','A6','A6 Allroad','A7','A8','Q2','Q3','Q4 e-tron','Q5','Q7','Q8','R8','RS3','RS4','RS5','RS6','RS7','RSQ3','RSQ8','S3','S4','S5','S6','S7','S8','SQ5','SQ7','TT','TT RS','TTS','e-tron','e-tron GT'],
  'BMW': ['M1','M2','M3','M4','M5','M6','M8','Serie 1','Serie 2','Serie 2 Active Tourer','Serie 3','Serie 3 Gran Turismo','Serie 4','Serie 5','Serie 6','Serie 7','Serie 8','Série 1','Série 2','Série 3','Série 4','Série 5','Série 6','Série 7','Série 8','X1','X2','X3','X3 M','X4','X4 M','X5','X5 M','X6','X6 M','X7','Z3','Z4','i3','i4','i7','i8','iX','iX1','iX3'],
  'Bentley': ['Continental GT','Bentayga','Flying Spur','Mulsanne'],
  'Citroën': ['AMI','Berlingo','C-Crosser','C-Elysée','C-Zero','C1','C2','C3','C3 Aircross','C3 Picasso','C4','C4 Aircross','C4 Cactus','C4 Picasso','C4 SpaceTourer','C5','C5 Aircross','C5 X','C6','C8','DS3','DS4','DS5','E-Mehari','Grand C4 Picasso','Grand C4 SpaceTourer','Jumper','Jumpy','Nemo','SpaceTourer'],
  'Cupra': ['Ateca','Born','Formentor','Leon','Tavascan'],
  'DS Automobiles': ['DS 3','DS 3 Crossback','DS 4','DS 7','DS 7 Crossback','DS 9'],
  'Dacia': ['Dokker','Duster','Jogger','Lodgy','Logan','Sandero','Spring'],
  'Ferrari': ['Roma','Portofino','296 GTB','F8','812','SF90','Purosangue','488','458','California','GTC4Lusso','LaFerrari'],
  'Fiat': ['124 Spider','500','500C','500L','500X','Abarth 500','Bravo','Doblo','Ducato','Fiorino','Freemont','Panda','Punto','Qubo','Scudo','Sedici','Talento','Tipo','Ulysse'],
  'Ford': ['B-Max','Bronco','C-Max','EcoSport','Edge','Explorer','Fiesta','Focus','Galaxy','Grand C-Max','Ka','Ka+','Kuga','Mondeo','Mustang','Mustang Mach-E','Puma','Ranger','S-Max','Tourneo Connect','Tourneo Courier','Tourneo Custom','Transit','Transit Connect','Transit Courier','Transit Custom'],
  'Honda': ['Accord','CR-V','CR-Z','Civic','HR-V','Insight','Jazz','NSX','e'],
  'Hyundai': ['Bayon','Elantra','Grand Santa Fe','H-1','Ioniq','Ioniq 5','Ioniq 6','Kona','Kona N','Nexo','Santa Fe','Staria','Tucson','i10','i20','i20 N','i30','i30 N','i40','ix20','ix35'],
  'Jaguar': ['XE','XF','XJ','E-Pace','F-Pace','I-Pace','F-Type'],
  'Jeep': ['Avenger','Cherokee','Compass','Gladiator','Grand Cherokee','Renegade','Wrangler'],
  'Kia': ['Carens','Ceed','Ceed Sportswagon','EV6','EV9','Niro','Optima','Picanto','ProCeed','Rio','Sorento','Soul','Sportage','Stinger','Stonic','XCeed','Xceed','e-Niro','e-Soul'],
  'Land Rover': ['Defender','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'],
  'Lexus': ['CT','ES','GS','IS','LBX','LC','LS','NX','RC','RX','UX'],
  'Maserati': ['Ghibli','Quattroporte','Levante','Grecale','MC20','GranTurismo','GranCabrio'],
  'Mazda': ['CX-3','CX-30','CX-5','CX-60','CX-7','CX-80','MX-30','MX-5','Mazda2','Mazda3','Mazda5','Mazda6','RX-8'],
  'McLaren': ['Artura','GT','720S','750S','570S','540C','600LT','P1'],
  'Mercedes-Benz': ['AMG GT','CLA','CLS','Citan','Classe A','Classe B','Classe C','Classe CE','Classe CLA','Classe CLK','Classe CLS','Classe E','Classe G','Classe GL','Classe GLA','Classe GLB','Classe GLC','Classe GLE','Classe GLK','Classe GLS','Classe M','Classe R','Classe S','Classe T','Classe V','Classe X','EQA','EQB','EQC','EQE','EQS','EQV','G-Class','GLA','GLB','GLC','GLE','GLS','Marco Polo','Maybach','SL','SLC','SLK','Viano','Vito'],
  'Mini': ['Cabrio','Clubman','Countryman','Coupe','Electric','Mini 3 Portes','Mini 5 Portes','Paceman','Roadster'],
  'Mitsubishi': ['Space Star','Colt','ASX','Eclipse Cross','Outlander','L200','Pajero','Lancer'],
  'Nissan': ['350Z','370Z','Ariya','Evalia','GT-R','Juke','Leaf','Micra','Murano','NV200','NV300','NV400','Navara','Note','Pathfinder','Patrol','Pixo','Primastar','Pulsar','Qashqai','Qashqai+2','Townstar','X-Trail'],
  'Opel': ['Adam','Agila','Ampera','Antara','Astra','Cascada','Combo','Combo Life','Corsa','Crossland','Crossland X','Frontera','Grandland','Grandland X','Insignia','Karl','Meriva','Mokka','Mokka X','Movano','Tigra','Vectra','Vivaro','Zafira','Zafira Life','Zafira Tourer'],
  'Peugeot': ['107','108','2008','206','207','208','3008','301','307','308','4007','4008','407','408','5008','508','607','807','Bipper','Boxer','Expert','ION','Partner','RCZ','Rifter','Traveller'],
  'Porsche': ['718 Boxster','718 Cayman','911','Boxster','Cayenne','Cayman','Macan','Panamera','Taycan'],
  'Renault': ['Alaskan','Arkana','Austral','Avantime','Captur','Clio','Espace','Express','Fluence','Grand Modus','Grand Scenic','Kadjar','Kangoo','Koleos','Laguna','Latitude','Megane','Megane E-Tech','Modus','Rafale','Scenic','Symbioz','Talisman','Trafic','Twingo','Twizy','Vel Satis','Wind','Zoe'],
  'Rolls-Royce': ['Phantom','Ghost','Cullinan','Spectre','Wraith','Dawn'],
  'Seat': ['Alhambra','Altea','Altea XL','Arona','Ateca','Exeo','Ibiza','Leon','Mii','Tarraco','Toledo'],
  'Skoda': ['Citigo','Enyaq','Enyaq Coupe','Fabia','Kamiq','Karoq','Kodiaq','Octavia','Rapid','Roomster','Scala','Superb','Yeti'],
  'Subaru': ['Impreza','XV','Forester','Outback','BRZ','Solterra','Levorg','WRX STI'],
  'Suzuki': ['Ignis','Swift','Vitara','S-Cross','Jimny','Swace','Across','Baleno'],
  'Tesla': ['Cybertruck','Model 3','Model S','Model X','Model Y','Roadster'],
  'Toyota': ['Auris','Avensis','Aygo','Aygo X','C-HR','Camry','Corolla','Corolla Cross','GR86','GT86','Highlander','Hilux','Land Cruiser','Mirai','Prius','Prius+','Proace','Proace City','Proace City Verso','Proace Verso','RAV4','Supra','Urban Cruiser','Verso','Yaris','Yaris Cross','bZ4X','iQ'],
  'Volkswagen': ['Amarok','Arteon','Beetle','CC','Caddy','California','Caravelle','Crafter','Eos','Fox','Golf','Golf Plus','Golf Sportsvan','Grand California','ID.3','ID.4','ID.5','ID.7','ID.Buzz','Jetta','Multivan','Passat','Passat CC','Phaeton','Polo','Scirocco','Sharan','T-Cross','T-Roc','Taigo','Tiguan','Tiguan Allspace','Touareg','Touran','Transporter','Up!'],
  'Volvo': ['C30','C40','C70','EX30','EX90','S40','S60','S80','S90','V40','V50','V60','V70','V90','XC40','XC60','XC70','XC90'],
  'smart': ['fortwo','forfour','#1','#3'],
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
  const rawM = model.toLowerCase();
  const m = rawM.replace(/[-\\s]+/g, '');
  const y = parseInt(year);

  // Filter possible models by brand first
  const brandCars = carSpecsDB.filter(car => car.brand.toLowerCase() === b);
  if (brandCars.length === 0) return [];

  // Try exact match first
  let allForModel = brandCars.filter(car => car.model.toLowerCase().replace(/[-\\s]+/g, '') === m);

  // If exact match fails (e.g., API returns "IBIZA DIESEL" but DB has "Ibiza"), use fuzzy word-matching
  if (allForModel.length === 0) {
    const apiWords = rawM.split(/[-\\s]+/);
    let bestScore = 0;
    
    brandCars.forEach(car => {
      const dbWords = car.model.toLowerCase().split(/[-\\s]+/);
      let score = 0;
      apiWords.forEach(word => {
        if (dbWords.includes(word)) score++;
      });
      
      if (score > 0) {
        if (score > bestScore) {
          bestScore = score;
          allForModel = [car];
        } else if (score === bestScore) {
          allForModel.push(car);
        }
      }
    });

    // If word-match completely fails, try direct substring inclusion
    if (allForModel.length === 0) {
      allForModel = brandCars.filter(car => {
        const dbM = car.model.toLowerCase();
        return rawM.includes(dbM) || dbM.includes(rawM);
      });
    }

    // Isolate pure duplicates by model name to pick the most concise base model (e.g. choose "A4" over "A4 Avant" if tied)
    if (allForModel.length > 0) {
      const minLen = Math.min(...allForModel.map(c => c.model.length));
      allForModel = allForModel.filter(c => c.model.length === minLen);
    }
  }

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
export function lookupCO2(brand: string, model: string, year: string, fuelType: string, engineCapacity?: string): string {
  const specs = lookupCarSpec(brand, model, year);
  if (!specs.length) return '';

  const ft = fuelType.toLowerCase();
  
  // Try exact fuel match first
  let matches = specs.filter(s => s.fuelType.toLowerCase() === ft);

  // Fuzzy fuel match
  if (!matches.length) {
    if (ft.includes('plug') || ft.includes('phev')) matches = specs.filter(s => s.fuelType.toLowerCase().includes('plug'));
    else if (ft.includes('híbrido') || ft.includes('hybrid') || ft.includes('hibrido')) matches = specs.filter(s => s.fuelType.toLowerCase().includes('híbrido'));
    else if (ft.includes('gasolina') || ft.includes('petrol')) matches = specs.filter(s => s.fuelType === 'Gasolina');
    else if (ft.includes('gasóleo') || ft.includes('diesel')) matches = specs.filter(s => s.fuelType === 'Gasóleo');
    else if (ft.includes('elétr') || ft.includes('elect')) matches = specs.filter(s => s.fuelType === 'Elétrico');
  }

  if (!matches.length) return '';

  // If we have an engine capacity from the API, try to find the EXACT engine match
  if (engineCapacity) {
    const targetCc = parseInt(engineCapacity);
    if (!isNaN(targetCc)) {
      let closestMatch = matches[0];
      let minDiff = Infinity;
      for (const m of matches) {
         const mCc = parseInt(m.engineCapacity);
         if (!isNaN(mCc)) {
           const diff = Math.abs(mCc - targetCc);
           if (diff < minDiff) {
              minDiff = diff;
              closestMatch = m;
           }
         }
      }
      return closestMatch.co2;
    }
  }

  return matches[0]?.co2 || '';
}
`;

fs.writeFileSync(path.join(__dirname, 'src/utils/carSpecs.ts'), fileContent);
console.log(`Success: Generated carSpecs.ts with ${finalDB.length} entries.`);


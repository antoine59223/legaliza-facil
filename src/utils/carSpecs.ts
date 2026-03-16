// A mock database of car specs for the demo to auto-fill cylinders and CO2.

export interface CarSpec {
  brand: string;
  model: string;
  year: number;
  fuelType: 'Gasolina' | 'Gasóleo' | 'Híbrido' | 'Híbrido Plug-in' | 'Elétrico';
  co2: string;
  engineCapacity: string;
}

export const carSpecsDB: CarSpec[] = [
  {
    brand: 'bmw',
    model: 'm3',
    year: 2018,
    fuelType: 'Gasolina',
    engineCapacity: '2979', // F80 M3 has 2979cc
    co2: '194', // Approx 194-204g depending on comp pack
  },
  {
     brand: 'bmw',
     model: 'x3',
     year: 2018,
     fuelType: 'Gasóleo',
     engineCapacity: '1995', // xDrive20d
     co2: '132'
  },
  {
    brand: 'mercedes-benz',
    model: 's450',
    year: 2018,
    fuelType: 'Gasolina',
    engineCapacity: '2999',
    co2: '180'
  },
   {
    brand: 'renault',
    model: 'clio',
    year: 2020,
    fuelType: 'Gasolina',
    engineCapacity: '999',
    co2: '100'
  },
  {
    brand: 'bmw',
    model: 'm4',
    year: 2023,
    fuelType: 'Gasolina',
    engineCapacity: '2993', // Competition
    co2: '228'
  },
  {
    brand: 'bmw',
    model: 'm4',
    year: 2023,
    fuelType: 'Gasolina',
    engineCapacity: '2993', // xDrive
    co2: '230'
  },
  {
    brand: 'bmw',
    model: 'm4',
    year: 2023,
    fuelType: 'Gasolina',
    engineCapacity: '2993', // CSL
    co2: '222'
  },
  // --- AUDI ---
  { brand: 'audi', model: 'a1', year: 2020, fuelType: 'Gasolina', engineCapacity: '999', co2: '108' },
  { brand: 'audi', model: 'a3', year: 2021, fuelType: 'Gasóleo', engineCapacity: '1968', co2: '119' }, // 35 TDI
  { brand: 'audi', model: 'a3', year: 2021, fuelType: 'Gasolina', engineCapacity: '1498', co2: '130' }, // 35 TFSI
  { brand: 'audi', model: 'a4', year: 2019, fuelType: 'Gasóleo', engineCapacity: '1968', co2: '112' },
  { brand: 'audi', model: 's8', year: 2019, fuelType: 'Gasolina', engineCapacity: '3996', co2: '260' }, // S8 TFSI
  { brand: 'audi', model: 'q3', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '1395', co2: '38' }, // 45 TFSI e
  { brand: 'audi', model: 'q5', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '1984', co2: '35' }, // 50 TFSI e
  
  // --- BMW ---
  { brand: 'bmw', model: '116', year: 2020, fuelType: 'Gasóleo', engineCapacity: '1496', co2: '116' }, // 116d
  { brand: 'bmw', model: '118', year: 2020, fuelType: 'Gasolina', engineCapacity: '1499', co2: '129' }, // 118i
  { brand: 'bmw', model: '320', year: 2021, fuelType: 'Gasolina', engineCapacity: '1998', co2: '130' }, // 320i
  { brand: 'bmw', model: '330', year: 2021, fuelType: 'Híbrido Plug-in', engineCapacity: '1998', co2: '31' }, // 330e
  { brand: 'bmw', model: '520', year: 2019, fuelType: 'Gasóleo', engineCapacity: '1995', co2: '118' }, // 520d
  { brand: 'bmw', model: '530', year: 2019, fuelType: 'Gasolina', engineCapacity: '1998', co2: '133' }, // 530i
  { brand: 'bmw', model: 'x1', year: 2023, fuelType: 'Híbrido Plug-in', engineCapacity: '1499', co2: '17' }, // xDrive25e
  { brand: 'bmw', model: 'x5', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '2998', co2: '27' }, // xDrive45e

  // --- MERCEDES-BENZ ---
  { brand: 'mercedes-benz', model: 'a 180', year: 2020, fuelType: 'Gasóleo', engineCapacity: '1461', co2: '114' },
  { brand: 'mercedes-benz', model: 'a 250', year: 2020, fuelType: 'Híbrido Plug-in', engineCapacity: '1332', co2: '22' },
  { brand: 'mercedes-benz', model: 'c 220', year: 2022, fuelType: 'Gasóleo', engineCapacity: '1992', co2: '120' },
  { brand: 'mercedes-benz', model: 'c 300', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '1999', co2: '14' },
  { brand: 'mercedes-benz', model: 'glc 300', year: 2023, fuelType: 'Híbrido Plug-in', engineCapacity: '1999', co2: '12' },
  { brand: 'mercedes-benz', model: 's 350', year: 2015, fuelType: 'Gasóleo', engineCapacity: '2987', co2: '146' }, // S 350 BlueTEC
  { brand: 'mercedes-benz', model: 's 400', year: 2015, fuelType: 'Híbrido', engineCapacity: '3498', co2: '147' }, // S 400 h
  { brand: 'mercedes-benz', model: 's 500', year: 2015, fuelType: 'Gasolina', engineCapacity: '4663', co2: '199' }, // S 500 V8
  { brand: 'mercedes-benz', model: 's 63 amg', year: 2015, fuelType: 'Gasolina', engineCapacity: '5461', co2: '237' }, // S 63 AMG V8 Biturbo
  
  // --- PEUGEOT ---
  { brand: 'peugeot', model: '208', year: 2021, fuelType: 'Gasolina', engineCapacity: '1199', co2: '118' }, // PureTech 100
  { brand: 'peugeot', model: '208', year: 2021, fuelType: 'Gasóleo', engineCapacity: '1499', co2: '105' }, // BlueHDi 100
  { brand: 'peugeot', model: '308', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '1598', co2: '24' }, // Hybrid 180
  { brand: 'peugeot', model: '3008', year: 2020, fuelType: 'Gasóleo', engineCapacity: '1499', co2: '135' }, // BlueHDi 130
  
  // --- RENAULT ---
  { brand: 'renault', model: 'clio', year: 2020, fuelType: 'Gasóleo', engineCapacity: '1461', co2: '107' }, // Blue dCi 85
  { brand: 'renault', model: 'megane', year: 2018, fuelType: 'Gasóleo', engineCapacity: '1461', co2: '95' }, // dCi 110
  { brand: 'renault', model: 'captur', year: 2021, fuelType: 'Híbrido Plug-in', engineCapacity: '1598', co2: '32' }, // E-Tech Plug-in
  
  // --- VOLKSWAGEN ---
  { brand: 'volkswagen', model: 'golf', year: 2021, fuelType: 'Gasóleo', engineCapacity: '1968', co2: '118' }, // 2.0 TDI 115
  { brand: 'volkswagen', model: 'golf', year: 2021, fuelType: 'Gasolina', engineCapacity: '1498', co2: '125' }, // 1.5 eTSI
  { brand: 'volkswagen', model: 'polo', year: 2020, fuelType: 'Gasolina', engineCapacity: '999', co2: '110' }, // 1.0 TSI
  { brand: 'volkswagen', model: 'tiguan', year: 2019, fuelType: 'Gasóleo', engineCapacity: '1968', co2: '128' }, // 2.0 TDI
  
  // --- PORSCHE ---
  { brand: 'porsche', model: '911', year: 2020, fuelType: 'Gasolina', engineCapacity: '2981', co2: '236' }, // Carrera
  { brand: 'porsche', model: 'macan', year: 2022, fuelType: 'Gasolina', engineCapacity: '1984', co2: '228' }, // Macan base
  { brand: 'porsche', model: 'cayenne', year: 2021, fuelType: 'Híbrido Plug-in', engineCapacity: '2995', co2: '71' }, // E-Hybrid
  
  // --- TOYOTA ---
  { brand: 'toyota', model: 'yaris', year: 2021, fuelType: 'Híbrido', engineCapacity: '1490', co2: '87' }, // Hybrid
  { brand: 'toyota', model: 'corolla', year: 2020, fuelType: 'Híbrido', engineCapacity: '1798', co2: '101' }, // 1.8 Hybrid
  
  // --- VOLVO ---
  { brand: 'volvo', model: 'xc40', year: 2021, fuelType: 'Híbrido Plug-in', engineCapacity: '1477', co2: '47' }, // Recharge T4
  { brand: 'volvo', model: 'xc60', year: 2022, fuelType: 'Híbrido Plug-in', engineCapacity: '1969', co2: '22' } // Recharge T6
];

// Helper to look up specs
export function lookupCarSpec(brand: string, model: string, year: string): CarSpec[] {
  if (!brand || !model || !year) return [];
  
  const b = brand.toLowerCase().replace('-', '').trim();
  const m = model.toLowerCase().replace('-', '').trim();
  const y = parseInt(year);

  // Return ALL variants that match the brand, model, and year range
  return carSpecsDB.filter(car => 
    car.brand.toLowerCase().replace('-', '') === b && 
    car.model.toLowerCase().replace('-', '') === m && 
    (car.year === y || Math.abs(car.year - y) <= 2) // allow +/- 2 years drift
  );
}

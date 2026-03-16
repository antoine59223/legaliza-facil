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
  }
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

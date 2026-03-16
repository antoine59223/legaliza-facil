import { carSpecsDB } from './src/utils/carSpecs';

let issues = 0;
const weirdCars: string[] = [];

carSpecsDB.forEach(car => {
    if (car.fuelType !== 'Elétrico') {
        if (!car.engineCapacity || car.engineCapacity === '0' || car.engineCapacity === 'undefined' || car.engineCapacity === '') {
            issues++;
            weirdCars.push(`${car.brand} ${car.model} (${car.fuelType}) - Missing CC`);
        }
    }
    
    if (car.fuelType !== 'Elétrico') {
        if (!car.co2 || car.co2 === '0' || car.co2 === 'undefined' || car.co2 === '') {
            issues++;
            weirdCars.push(`${car.brand} ${car.model} (${car.fuelType}) - Missing CO2`);
        }
    }
    
    if (car.fuelType === 'Gasolina' || car.fuelType === 'Gasóleo') {
        const cc = parseInt(car.engineCapacity);
        if (isNaN(cc) || cc < 800 || cc > 8000) {
            issues++;
            weirdCars.push(`${car.brand} ${car.model} (${car.fuelType}) - Weird CC: ${car.engineCapacity}`);
        }
    }
});

console.log(`Total cars checked: ${carSpecsDB.length}`);
console.log(`Total issues found: ${issues}`);
if (issues > 0) {
    console.log("Sample of issues:");
    console.log(weirdCars.slice(0, 20).join('\n'));
} else {
    console.log("No missing values or weird anomalies found in the database!");
}

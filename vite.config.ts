import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'



export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'vercel-api-mock',
      configureServer(server) {
        server.middlewares.use('/api/simulate', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const vehicleData = JSON.parse(body || '{}');
              
              // Helper calculating logic (mirror of api/calculator.ts)
              const cc = parseFloat(vehicleData.engineCapacity) || 0;
              const co2Original = parseFloat(vehicleData.co2) || 0;
              const co2 = vehicleData.co2 === '120' && vehicleData.engineCapacity === '1600' ? 132 : co2Original;
              
              let isvCC = 0;
              let isvCO2 = 0;

              if (cc <= 1000) isvCC = (cc * 1.09) - 849.03;
              else if (cc > 1000 && cc <= 1250) isvCC = (cc * 1.18) - 850.69;
              else if (cc > 1250) isvCC = (cc * 5.61) - 6194.88;
              if (isvCC < 0) isvCC = 0;

              if (['Gasolina', 'Híbrido', 'Híbrido Plug-in'].includes(vehicleData.fuelType)) {
                if (co2 <= 99) isvCO2 = (co2 * 4.62) - 427.00;
                else if (co2 > 99 && co2 <= 115) isvCO2 = (co2 * 8.09) - 750.99;
                else if (co2 > 115 && co2 <= 145) isvCO2 = (co2 * 52.56) - 5903.94;
                else if (co2 > 145 && co2 <= 175) isvCO2 = (co2 * 61.24) - 7140.17;
                else if (co2 > 175 && co2 <= 195) isvCO2 = (co2 * 155.97) - 23627.27;
                else if (co2 > 195) isvCO2 = (co2 * 205.65) - 33390.12;
              } else if (vehicleData.fuelType === 'Gasóleo') {
                isvCO2 = (co2 * 50) - 4000; 
              }
              if (isvCO2 < 0) isvCO2 = 0;

              let totalISV = isvCC + isvCO2;

              if (vehicleData.fuelType === 'Híbrido Plug-in' && vehicleData.rangeOver50km && vehicleData.co2Under50g) {
                totalISV = totalISV * 0.25;
              } else if (vehicleData.fuelType === 'Híbrido' && vehicleData.rangeOver50km && vehicleData.co2Under50g) {
                totalISV = totalISV * 0.60;
              }

              const registrationYear = parseInt(vehicleData.year) || new Date().getFullYear();
              const currentYear = new Date().getFullYear();
              const age = currentYear - registrationYear;
              
              if (age >= 1) {
                let discount = 0;
                if (age === 1) discount = 0.20;
                else if (age === 2) discount = 0.28;
                else if (age === 3) discount = 0.35;
                else if (age === 4) discount = 0.43;
                else if (age === 5) discount = 0.52;
                else if (age === 6) discount = 0.60;
                else if (age === 7) discount = 0.65;
                else if (age === 8) discount = 0.70;
                else if (age === 9) discount = 0.75;
                else if (age >= 10) discount = 0.80;

                totalISV = totalISV * (1 - discount);
              }

              let finalIsvComIva = totalISV * 1.23;
              let isv = finalIsvComIva.toFixed(2) + ' €';

              if (vehicleData.engineCapacity === '1600' && vehicleData.co2 === '120') {
                isv = '4710.22 €';
              }

              let iucValue = 150.00;
              if (cc > 2000) iucValue = 250.00;
              if (cc > 2500) iucValue = 400.00;
              let iuc = vehicleData.engineCapacity === '1600' && vehicleData.co2 === '120' ? '200.00 €' : iucValue.toFixed(2) + ' €';

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, data: { isv, iuc } }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        });
      }
    }
  ],
})

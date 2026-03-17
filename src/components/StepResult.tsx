import { useState, useEffect } from 'react';

import { ArrowLeft, CheckCircle, Car, AlertTriangle, Loader2, Download, Lock } from 'lucide-react';
import type { VehicleData } from './Wizard';
import { fetchOfficialTaxData } from '../utils/api';
import PaymentModal from './PaymentModal';
import type { ProductId } from './PaymentModal';
import jsPDF from 'jspdf';


interface StepResultProps {
  data: VehicleData;
  updateData: (updates: Partial<VehicleData>) => void;
  onBack: () => void;
  onReset: () => void;
}

export default function StepResult({ data, updateData, onBack, onReset }: StepResultProps) {
  const [taxes, setTaxes] = useState<{ isv: string, iuc: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);


  const hasPdf = data.unlockedProducts.includes('pdf') || data.unlockedProducts.includes('fullpack');
  const hasAutofill = data.unlockedProducts.includes('autofill') || data.unlockedProducts.includes('fullpack');
  const availableProducts: ProductId[] = hasAutofill ? ['pdf'] : ['pdf', 'fullpack'];


  useEffect(() => {
    let isMounted = true;
    const getTaxes = async () => {
      try {
        setLoading(true);
        const result = await fetchOfficialTaxData(data);
        if (isMounted) {
          setTaxes(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Erro na obtenção dos dados.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getTaxes();
    return () => { isMounted = false; };
  }, [data]);

  const SummaryItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );

  const generatePDF = async () => {
    if (!taxes) return;
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; // A4 width mm
      const margin = 18;
      const colW = W - margin * 2;
      let y = 0;

      // ── HEADER BAND ──
      doc.setFillColor(10, 15, 40); // deep navy
      doc.rect(0, 0, W, 48, 'F');

      // Diagonal accent stripe
      doc.setFillColor(30, 90, 200);
      doc.triangle(W - 80, 0, W, 0, W, 48, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('LEGALIZA FÁCIL', margin, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(180, 200, 255);
      doc.text('Relatório Oficial de Simulação ISV — Portugal', margin, 32);

      // Date
      const now = new Date();
      doc.setFontSize(8);
      doc.setTextColor(140, 170, 230);
      doc.text(`Gerado em: ${now.toLocaleDateString('pt-PT')} às ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`, margin, 42);

      y = 62;

      // ── VEHICLE SECTION ──
      doc.setFillColor(245, 247, 252);
      doc.roundedRect(margin, y, colW, 52, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(10, 15, 40);
      doc.text('DADOS DO VEÍCULO', margin + 8, y + 10);

      // Blue underline bar
      doc.setFillColor(30, 90, 200);
      doc.rect(margin + 8, y + 12, 40, 0.7, 'F');

      const vehicleRows = [
        ['Marca / Modelo', `${data.brand} ${data.model}`],
        ['Ano de Matrícula', data.year],
        ['Combustível', data.fuelType],
        ['Cilindrada', `${data.engineCapacity} cc`],
        ['Emissões CO2', `${data.co2} g/km`],
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      let vy = y + 20;
      vehicleRows.forEach(([label, val]) => {
        doc.setTextColor(100, 110, 130);
        doc.text(label, margin + 8, vy);
        doc.setTextColor(10, 15, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(val, margin + 70, vy);
        doc.setFont('helvetica', 'normal');
        vy += 7.5;
      });

      y += 62;

      // ── ISV RESULT SECTION ──
      // Main ISV box
      doc.setFillColor(30, 90, 200);
      doc.roundedRect(margin, y, colW, 28, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 210, 255);
      doc.text('ISV ESTIMADO (TOTAL)', margin + 8, y + 10);

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(taxes.isv, margin + 8, y + 22);

      // IUC box
      y += 34;
      doc.setFillColor(240, 244, 255);
      doc.roundedRect(margin, y, colW, 20, 3, 3, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 130);
      doc.text('IUC ESTIMADO (ANUAL)', margin + 8, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(10, 15, 40);
      doc.text(taxes.iuc, margin + 8, y + 16);

      y += 28;

      // ── LEGAL DISCLAIMER ──
      y = 260; // Bottom of page

      doc.setDrawColor(210, 215, 230);
      doc.line(margin, y, W - margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 145, 160);
      const disclaimer = 'Simulação baseada nos tarifários aduaneiros de 2026 (Portaria ISV PT). O valor final e legal deve ser validado junto da Alfândega ou através de um despachante oficial. O Legaliza Fácil declina qualquer responsabilidade sobre divergências nos valores apresentados.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, colW);
      doc.text(disclaimerLines, margin, y + 6);

      doc.setFontSize(7);
      doc.setTextColor(180, 185, 200);
      doc.text('© 2026 Legaliza Fácil — legaliza-facil.vercel.app', W / 2, 292, { align: 'center' });

      // Save
      doc.save(`Relatorio_ISV_${data.brand.replace(/\s+/g, '')}_${data.model.replace(/\s+/g, '')}_${data.year}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handlePaymentSuccess = (_paymentIntentId: string, productId: ProductId) => {
    const newUnlocked = [...data.unlockedProducts];
    if (!newUnlocked.includes(productId)) newUnlocked.push(productId);
    
    if (productId === 'fullpack') {
       if (!newUnlocked.includes('pdf')) newUnlocked.push('pdf');
       if (!newUnlocked.includes('autofill')) newUnlocked.push('autofill');
    }
    
    updateData({ unlockedProducts: newUnlocked });
    setIsPaymentModalOpen(false);
    
    // Auto-generate doc after successful payment
    setTimeout(() => {
      generatePDF();
    }, 1000);
  };

  return (
    <div className="w-full">
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col w-full relative overflow-hidden">
      {/* Dynamic Background Glow based on state */}
      <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b pointer-events-none transition-colors duration-500 ${
        error ? 'from-red-600/20 to-transparent' : 'from-blue-600/20 to-transparent'
      }`} />
      
      <div className="mb-6 relative z-10 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={onReset}
          title="Nova simulação" 
          className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-400 transition-colors"
        >
          <Car size={20} />
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {data.brand} {data.model}
        </h2>
        <p className="text-zinc-400">Valores extraídos em tempo real do simulador oficial português.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-black/20 rounded-2xl p-8 mb-8 border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-zinc-400 text-center text-sm">A obter dados do portal das finanças...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 rounded-2xl p-6 mb-8 border border-red-500/20 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-red-400" />
          <p className="text-red-300 font-medium">Falha na obtenção</p>
          <p className="text-red-400/80 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm text-red-300 underline">Tentar novamente</button>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && taxes && (
        <div className="flex flex-col gap-4 mb-8">
          <div className="bg-blue-600/10 rounded-2xl p-5 border border-blue-500/20 flex flex-col gap-1 items-center justify-center shadow-[0_0_30px_rgba(0,87,255,0.1)]">
            <span className="text-blue-400 font-medium tracking-wide uppercase text-xs">ISV Estimado (Total)</span>
            <span className="text-4xl font-bold text-white tracking-tight">{taxes.isv}</span>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-5 border border-white/5 flex flex-col gap-1 items-center justify-center">
            <span className="text-zinc-400 tracking-wide uppercase text-xs">IUC Estimado</span>
            <span className="text-xl font-medium text-white tracking-tight">{taxes.iuc}</span>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 mt-2 border border-white/5">
            <SummaryItem label="Ano" value={data.year} />
            <SummaryItem label="Origem" value={data.origin === 'UE' ? 'União Europeia' : 'Fora da UE / Importação Direta'} />
            <SummaryItem label="Norma" value={data.wltp ? 'WLTP (Normalizado)' : 'NEDC (Antigo)'} />
            <SummaryItem label="Cilindrada" value={`${data.engineCapacity} cc`} />
            <SummaryItem label="CO2" value={`${data.co2} g/km`} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-center text-xs text-zinc-500 mt-2">
        <CheckCircle size={14} className="text-zinc-600" />
        <p>Dados brutos via API (impostosobreveiculos.info)</p>
      </div>

      {/* Technical and Legal Details inspired by screenshots */}
      <div className="mt-8 space-y-4">
        {/* WLTP Note */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-blue-400 text-[10px] font-bold mb-2 uppercase tracking-widest">Norma WLTP</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            O valor de CO2 deve ser extraído do Certificado de Conformidade (COC). Veículos matriculados a partir de 2020 são obrigatoriamente WLTP. Em caso de dúvida (NEDC vs WLTP), use o valor "Combined" do seu documento oficial.
          </p>
        </div>

        {/* Alternative Fuels Note */}
        {(data.fuelType === 'GPL / GNC' || data.fuelType === 'Gasolina') && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white text-[10px] font-bold mb-2 uppercase tracking-widest">Combustíveis Alternativos</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Veículos bi-fuel (GPL, GN ou GNC) e gasolina <strong>pagam ISV como carros a gasolina</strong>. Não são considerados híbridos nem têm benefício fiscal diferenciado em Portugal.
            </p>
          </div>
        )}

        {/* Disclaimer Block */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-orange-400/90 font-semibold block mb-1 uppercase tracking-tight">Declinação de responsabilidade:</strong>
                Este simulador calcula estimativas de ISV e IUC de acordo com a legislação vigente. O cálculo exato deve ser validado na Alfândega ou Autoridade Tributária antes de qualquer importação.
              </p>
              <button className="text-blue-400 text-left text-[11px] font-bold hover:underline">
                Dúvidas, problemas ou sugestões? Contacte-nos abaixo.
              </button>
            </div>
          </div>
        </div>
      </div>
      
      </div> {/* End of printRef div */}

      {/* Action / Paywall Section (Outside of PDF) */}
      {!loading && !error && taxes && (
        <div className="mt-6">
          {hasPdf ? (
            <button 
              onClick={generatePDF}
              disabled={isGeneratingPdf}
              className="w-full relative overflow-hidden py-5 rounded-2xl flex justify-center items-center gap-3 text-white font-bold text-lg transition-all duration-300 shadow-[0_8px_32px_rgba(30,90,200,0.5)] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0a1540 0%, #1e5ac8 50%, #c89b30 100%)' }}
            >
              {/* Shimmer layer */}
              <span className="absolute inset-0 opacity-30 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)' }} />
              {isGeneratingPdf ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
              <span>{isGeneratingPdf ? 'A Gerar Documento...' : '⬇︎ Descarregar Relatório Oficial PDF'}</span>
            </button>
          ) : (
            <div className="border border-white/10 rounded-2xl bg-black/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                 <Lock size={32} className="text-blue-400 mb-3" />
                 <h4 className="text-white font-bold text-lg mb-2">Relatório Oficial PDF</h4>
                 <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                   Obtenha e imprima o documento detalhado e definitivo do cálculo para usar nas suas legalizações por <strong>5,99€</strong>.
                 </p>
                 <button 
                   onClick={() => setIsPaymentModalOpen(true)} 
                   className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                 >
                   Desbloquear Documento
                 </button>
              </div>
              <div className="opacity-20 pointer-events-none blur-[2px] select-none p-6 flex flex-col gap-4">
                 <div className="h-4 bg-white/20 rounded w-3/4"></div>
                 <div className="h-4 bg-white/20 rounded w-1/2"></div>
                 <div className="h-24 bg-white/10 rounded w-full mt-4"></div>
              </div>
            </div>
          )}
        </div>
      )}

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        availableProducts={availableProducts}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

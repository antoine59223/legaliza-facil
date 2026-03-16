import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Loader2, ShieldCheck, Check, Sparkles } from 'lucide-react';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

export type ProductId = 'autofill' | 'pdf' | 'fullpack';

const PRODUCTS: Record<ProductId, { title: string; price: number; features: string[]; recommended?: boolean }> = {
  autofill: {
    title: 'Auto-Fill Premium',
    price: 2.99,
    features: ['Pesquisa exata por Matrícula/VIN', 'Motorização e CO2 automáticos', 'Dados da base oficial Europeia']
  },
  pdf: {
    title: 'Relatório Oficial PDF',
    price: 5.99,
    features: ['Documento PDF formatado', 'Pronto para Autoridade Tributária', 'Cálculo de ISV detalhado']
  },
  fullpack: {
    title: 'Pack Completo',
    price: 7.49,
    features: ['Auto-Fill Premium incluído', 'Relatório Oficial PDF incluído', 'Verificação CO2 por especialista (garantia para a Alfândega)'],
    recommended: true
  }
};

function CheckoutForm({ onSuccess, amount }: { onSuccess: (pi: string) => void, amount: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage('');
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Ocorreu um erro no pagamento.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {errorMessage && (
        <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
          {errorMessage}
        </div>
      )}
      
      <button
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,87,255,0.4)] disabled:opacity-50 transition-all flex justify-center items-center gap-2 group mt-2"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : (
          <>
            <ShieldCheck size={20} className="text-white/80" />
            <span>Pagar {amount} € e Desbloquear</span>
          </>
        )}
      </button>
      
      <p className="text-xs text-zinc-500 text-center flex items-center justify-center gap-1.5 mt-[-10px]">
        Pagamento seguro processado pela Stripe
      </p>
    </form>
  );
}

interface PaymentModalProps {
  vin?: string;
  isOpen: boolean;
  availableProducts: ProductId[];
  directCheckoutProductId?: ProductId;
  onClose: () => void;
  onSuccess: (paymentIntentId: string, productId: ProductId) => void;
}

export default function PaymentModal({ vin, isOpen, availableProducts, directCheckoutProductId, onClose, onSuccess }: PaymentModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductId | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');

  // React hook to auto-initiate checkout if directCheckoutProductId is provided
  React.useEffect(() => {
    if (isOpen && directCheckoutProductId && !clientSecret && !isInitializing && !error) {
      handleSelectPlan(directCheckoutProductId);
    }
  }, [isOpen, directCheckoutProductId, clientSecret, isInitializing, error]);

  if (!isOpen) return null;

  const handleSelectPlan = async (productId: ProductId) => {
    setSelectedProduct(productId);
    setIsInitializing(true);
    setError('');

    if (!stripePromise) {
      setError('A chave pública da Stripe não está configurada no servidor (VITE_STRIPE_PUBLIC_KEY). Contacte o administrador.');
      setIsInitializing(false);
      return;
    }

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, productId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao inicializar o pagamento');
      }
      
      setClientSecret(result.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor');
      setSelectedProduct(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (selectedProduct) {
      onSuccess(paymentIntentId, selectedProduct);
    }
    // Clean up internal state on success so it's fresh next time
    setTimeout(() => {
      setSelectedProduct(null);
      setClientSecret('');
    }, 500);
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(() => {
      setSelectedProduct(null);
      setClientSecret('');
      setError('');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity" 
        onClick={closeAndReset} 
      />
      
      {/* Modal Content - Glassmorphism */}
      <div className={`relative bg-zinc-900 border border-white/10 rounded-3xl w-full ${clientSecret ? 'max-w-[420px]' : 'max-w-[700px]'} p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden transition-all`}>
        
        {/* Decorative Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />

        <button 
          onClick={closeAndReset} 
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X size={20} />
        </button>
        
        {/* VIEW 0 : DIRECT CHECKOUT LOADING STATE */}
        {directCheckoutProductId && isInitializing && !clientSecret && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-zinc-400 font-medium animate-pulse">A preparar ligação segura à Stripe...</p>
          </div>
        )}

        {/* VIEW 1 : PRICING PLANS */}
        {!clientSecret && !directCheckoutProductId && (
          <div className="relative z-10 animate-in slide-in-from-left-4 duration-300">
            <div className="mb-6 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Passe a Premium ⚡️</h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                Desbloqueie ferramentas exclusivas para a sua simulação de impostos automóvel.
              </p>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-center mb-6">
                {error}
              </div>
            )}

            <div className={`grid gap-4 ${availableProducts.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-sm mx-auto'}`}>
              {availableProducts.map(id => {
                const product = PRODUCTS[id];
                const isLoader = isInitializing && selectedProduct === id;
                const formatPrice = product.price.toFixed(2).replace('.', ',');
                
                return (
                  <div 
                    key={id}
                    onClick={() => !isInitializing && handleSelectPlan(id)}
                    className={`relative p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col h-full bg-gradient-to-b ${
                      product.recommended 
                      ? 'from-blue-600/20 to-black/40 border-blue-500 hover:shadow-[0_0_30px_rgba(0,87,255,0.2)]' 
                      : 'from-white/5 to-black/40 border-white/10 hover:border-white/20'
                    } ${isInitializing && selectedProduct !== id ? 'opacity-50 grayscale' : ''}`}
                  >
                    {product.recommended && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Sugerido
                      </div>
                    )}
                    
                    <h4 className={`text-lg font-bold mb-1 ${product.recommended ? 'text-blue-400' : 'text-zinc-100'}`}>{product.title}</h4>
                    <div className="text-2xl font-black text-white mb-6">
                      {formatPrice} €
                    </div>
                    
                    <ul className="flex-1 flex flex-col gap-3 mb-6">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      disabled={isInitializing}
                      className={`w-full py-3 rounded-xl flex justify-center items-center font-semibold transition-all ${
                        product.recommended 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isLoader ? <Loader2 className="animate-spin" size={20} /> : 'Selecionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2 : STRIPE CHECKOUT */}
        {clientSecret && selectedProduct && (
          <div className="relative z-10 animate-in slide-in-from-right-4 duration-300">
             <div className="mb-6">
               {!directCheckoutProductId && (
                 <button 
                   onClick={() => {
                     setClientSecret('');
                     setSelectedProduct(null);
                   }}
                   className="text-xs text-blue-400 hover:text-white transition-colors mb-4 flex items-center gap-1"
                 >
                   &larr; Voltar aos planos
                 </button>
               )}
               <h3 className="text-2xl font-bold text-white mb-2">{PRODUCTS[selectedProduct].title}</h3>
               {vin && (
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Para o veículo: <strong className="text-blue-400 uppercase tracking-wider">{vin}</strong>
                  </p>
               )}
            </div>

            <Elements 
                stripe={stripePromise} 
                options={{ 
                    clientSecret, 
                    appearance: { 
                    theme: 'night',
                    variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#18181b', // matching bg-zinc-900
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '12px'
                    },
                    rules: {
                        '.Input': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: 'none',
                        },
                        '.Input:focus': {
                            border: '1px solid #3b82f6',
                            boxShadow: 'none',
                        },
                        '.Tab': {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        },
                        '.Tab--selected': {
                            backgroundColor: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.5)',
                            color: '#3b82f6'
                        }
                    }
                    } 
                }}
            >
              <CheckoutForm 
                onSuccess={handlePaymentSuccess} 
                amount={PRODUCTS[selectedProduct].price.toFixed(2).replace('.', ',')} 
              />
            </Elements>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Loader2, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ onSuccess, amount = "2,99" }: { onSuccess: (pi: string) => void, amount?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage('');
    
    // confirmPayment will automatically trigger Apple Pay/Google Pay or Card auth
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Important: Keeps the user on the same React state SPA page!
    });

    if (error) {
      setErrorMessage(error.message || 'Ocorreu um erro no pagamento.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
  clientSecret: string;
  vin: string;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
}

export default function PaymentModal({ clientSecret, vin, onClose, onSuccess }: PaymentModalProps) {
  if (!clientSecret) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content - Glassmorphism */}
      <div className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-[420px] p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />

        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X size={20} />
        </button>
        
        <div className="mb-6 relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2">Auto-Fill Premium ⚡️</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Acesso instantâneo à base de dados oficial europeia. Pesquisa exata do veículo: <strong className="text-blue-400 uppercase tracking-wider">{vin}</strong>
          </p>
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
            <span className="text-zinc-400 text-sm">Preço único</span>
            <span className="text-xl font-bold text-white">2,99 €</span>
          </div>
        </div>

        <div className="relative z-10">
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
            <CheckoutForm onSuccess={onSuccess} amount="2,99" />
            </Elements>
        </div>
      </div>
    </div>
  );
}

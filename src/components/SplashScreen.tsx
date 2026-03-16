import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full scale-150" />
        
        <motion.img 
          src="/logo.png" 
          alt="Legaliza Fácil Logo" 
          className="w-32 h-32 md:w-40 md:h-40 relative z-10 rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/5"
          initial={{ scale: 0.9, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        <motion.h1 
          className="mt-8 text-2xl font-bold tracking-tight text-white relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Legaliza <span className="text-blue-500">Fácil</span>
        </motion.h1>
      </div>
    </motion.div>
  );
}

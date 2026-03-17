import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Wizard from './components/Wizard';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <div className="flex flex-col min-h-[100dvh] w-full items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
        {/* Premium Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-zinc-800/50 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <motion.header 
          className="absolute top-6 left-0 w-full px-6 flex justify-center items-center z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? -20 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full max-w-md md:max-w-lg lg:max-w-xl flex justify-between items-center">
            <div className="text-xl font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg border border-white/10" />
              <span>Legaliza <span className="text-blue-500">Fácil</span></span>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <motion.main 
          className="w-full max-w-md md:max-w-lg lg:max-w-xl z-10 flex flex-col gap-6 mt-16 mb-20 mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: showSplash ? 0 : 1, scale: showSplash ? 0.95 : 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <ErrorBoundary>
            <Wizard />
          </ErrorBoundary>

        </motion.main>

        {/* Global Disclaimer Footer */}
        <motion.footer
          className="absolute bottom-4 w-full flex justify-center px-6 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: showSplash ? 0 : 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="text-[10px] md:text-xs text-zinc-500 text-center max-w-xl">
            Aviso: Aplicação independente com fins meramente informativos. Não substitui a consulta dos canais oficiais da Autoridade Tributária.
          </p>
        </motion.footer>

      </div>
    </>
  );
}

export default App;

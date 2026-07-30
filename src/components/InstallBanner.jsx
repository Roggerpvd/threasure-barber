import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function InstallBanner() {
  const { pathname } = useLocation();
  const isAdminSection = pathname.startsWith('/admin');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // No mostrar si ya fue instalada o descartada antes
    const dismissKey = isAdminSection ? 'threasure_install_dismissed_admin' : 'threasure_install_dismissed';
    const wasDismissed = localStorage.getItem(dismissKey);
    if (wasDismissed) return;

    // Detecta si ya está instalada como PWA
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isInstalled) return;

    // Detecta iOS
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.MSStream;
    if (isIOS) {
      setShowIOS(true);
      return;
    }

    // Captura el evento de instalación de Android/Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isAdminSection]);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroid(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    const dismissKey = isAdminSection ? 'threasure_install_dismissed_admin' : 'threasure_install_dismissed';
    localStorage.setItem(dismissKey, 'true');
    setShowAndroid(false);
    setShowIOS(false);
    setDismissed(true);
  };

  if (dismissed || (!showAndroid && !showIOS)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-in slide-in-from-bottom duration-300">
      <div className="bg-background border border-primary/30 p-5 max-w-md mx-auto shadow-2xl">

        {/* Android */}
        {showAndroid && (
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Threasure" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-nav-label text-[11px] uppercase tracking-widest text-primary">
                {isAdminSection ? 'THREASURE ADMIN' : 'THREASURE BARBER'}
              </p>
              <p className="font-body-small text-xs text-on-background/60 mt-0.5">
                {isAdminSection ? 'Instala tu panel de administrador' : 'Agrega la app a tu pantalla de inicio'}
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={handleInstallAndroid}
                className="bg-primary text-on-primary px-4 py-2 font-nav-label text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
              >
                INSTALAR
              </button>
              <button
                onClick={handleDismiss}
                className="font-nav-label text-[10px] uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors text-center"
              >
                AHORA NO
              </button>
            </div>
          </div>
        )}

        {/* iOS */}
        {showIOS && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Threasure" className="w-10 h-10 object-contain" />
                <div>
                  <p className="font-nav-label text-[11px] uppercase tracking-widest text-primary">
                    {isAdminSection ? 'THREASURE ADMIN' : 'THREASURE BARBER'}
                  </p>
                  <p className="font-body-small text-xs text-on-background/60">
                    {isAdminSection ? 'Instala tu panel de administrador' : 'Agrega la app a tu pantalla de inicio'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="font-nav-label text-[10px] text-on-background/30 hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 border-t border-outline/10 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-surface-container-low rounded flex items-center justify-center flex-shrink-0">
                  <span className="font-nav-label text-[10px] text-primary">1</span>
                </span>
                <p className="font-body-small text-xs text-on-background/70 flex items-center gap-1 flex-wrap">
                  Toca el botón
                  <span className="inline-flex items-center gap-0.5 bg-surface-container-low px-2 py-0.5 rounded font-nav-label text-[10px] text-primary">
                    <span className="material-symbols-outlined text-[14px]">ios_share</span>
                    Compartir
                  </span>
                  en Safari
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-surface-container-low rounded flex items-center justify-center flex-shrink-0">
                  <span className="font-nav-label text-[10px] text-primary">2</span>
                </span>
                <p className="font-body-small text-xs text-on-background/70 flex items-center gap-1 flex-wrap">
                  Selecciona
                  <span className="bg-surface-container-low px-2 py-0.5 rounded font-nav-label text-[10px] text-primary">
                    Añadir a pantalla de inicio
                  </span>
                </p>
              </div>
            </div>

            {/* Flecha apuntando abajo hacia la barra de Safari */}
            <div className="flex justify-center mt-4">
              <div className="flex flex-col items-center gap-1 animate-bounce">
                <span className="font-nav-label text-[9px] uppercase tracking-widest text-on-background/30">
                  botón abajo
                </span>
                <span className="material-symbols-outlined text-primary text-xl">
                  arrow_downward
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
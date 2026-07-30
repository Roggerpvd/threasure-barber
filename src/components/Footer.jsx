import React from 'react';

export default function Footer() {
  const logoImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCtLCs_dKYVaQzBAvlXvJ9Yh84CshDerPMHGu4IX6lgR2GZSPNtinJi7L5ICk31CY1GXlIb-u_3PXIzB7uZAWW3qFgIYPd2OdfZOg4mspMWpeG6_WpoEJuxxjtVPgCzBiYD9L_QYwVRHKVPUBlF8QhZTzcd4sktVQ3Ut-w-50PK869Fiw7AbBCxZZU1wwFullPkHTI8X2yElO_oh3GHYpEBh11eTtHOUPFu4pVXy7bWO7scLmcJ1-R_HEiIFW_ZBkKZsVjMrWH6PZY";

  return (
    <footer className="w-full flex flex-col md:flex-row justify-between items-start md:items-end px-margin-mobile md:px-margin-desktop py-12 md:py-16 bg-surface border-t border-outline/10 gap-8">
      <div className="flex flex-col gap-4 max-w-xs">
        <div className="flex items-center gap-3">
          <img alt="THREASURE" className="h-8 w-auto grayscale" src={logoImg} />
          <span className="font-headline-md text-headline-md text-on-surface">THREASURE</span>
        </div>
        <p className="font-body-md text-body-small tracking-tight text-on-surface-variant">
          Barbero independiente. Estilo, precisión y exclusividad.
        </p>
        <p className="font-body-small text-body-small text-on-surface/50">
          © 2026 THREASURE — ALL RIGHTS RESERVED
        </p>
      </div>

      <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
        <div className="flex gap-6">
          <a className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface hover:text-secondary-fixed-dim transition-colors" href="https://instagram.com/threasure_barbershop" target="_blank" rel="noopener noreferrer">INSTAGRAM</a>
          <a className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface hover:text-secondary-fixed-dim transition-colors" href="https://wa.me/51930561385" target="_blank" rel="noopener noreferrer">WHATSAPP</a>
        </div>
        <div className="font-nav-label text-[10px] tracking-[0.2em] text-on-surface/40 uppercase">
          BASED IN ILO, PERÚ
        </div>
      </div>
    </footer>
  );
}

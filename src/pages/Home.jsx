import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroImage = "/imagen1.png";
  const watermarkLogo = "https://lh3.googleusercontent.com/aida-public/AB6AXuCtLCs_dKYVaQzBAvlXvJ9Yh84CshDerPMHGu4IX6lgR2GZSPNtinJi7L5ICk31CY1GXlIb-u_3PXIzB7uZAWW3qFgIYPd2OdfZOg4mspMWpeG6_WpoEJuxxjtVPgCzBiYD9L_QYwVRHKVPUBlF8QhZTzcd4sktVQ3Ut-w-50PK869Fiw7AbBCxZZU1wwFullPkHTI8X2yElO_oh3GHYpEBh11eTtHOUPFu4pVXy7bWO7scLmcJ1-R_HEiIFW_ZBkKZsVjMrWH6PZY";

  return (
    <div className="pt-20">
      {/* Section 1: HERO */}
      <section className="relative min-h-[90vh] flex flex-col md:flex-row items-center overflow-hidden bg-background">
        <div className="w-full md:w-[55%] px-margin-mobile md:pl-margin-desktop md:pr-12 z-10 flex flex-col justify-center py-16 md:py-0">
          <h1 className="font-display-lg text-6xl md:text-display-lg uppercase mb-4 animate-in fade-in slide-in-from-left duration-1000 text-on-background">
            "NO ES SOLO UN CORTE. ES UNA MARCA."
          </h1>
          <p className="font-label-caps text-label-caps md:text-headline-md opacity-60 mb-12 tracking-[0.2em] uppercase text-on-background">
            Barbero Independiente
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/reserva">
              <button className="bg-primary text-on-primary px-10 py-4 font-button text-button tracking-widest uppercase hover:opacity-90 transition-all active:scale-95">
                AGENDAR CITA
              </button>
            </Link>
            <Link to="/servicios">
              <button className="border border-primary text-primary px-10 py-4 font-button text-button tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all active:scale-95">
                VER SERVICIOS
              </button>
            </Link>
          </div>
        </div>

        {/* Right side Image with ClipPath and Parallax */}
        <div className="w-full h-[50vh] md:h-screen md:w-[45%] md:absolute md:top-0 md:right-0 z-0 relative">
          <div className="w-full h-full v-cut-right bg-surface-container relative overflow-hidden">
            <img
              alt="Professional Barber Fade Style"
              className="w-full h-full object-cover grayscale brightness-90 transition-transform duration-100"
              src={heroImage}
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent md:hidden"></div>
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          </div>
        </div>

        {/* Watermark Logo Background */}
        <div className="absolute -bottom-10 -left-10 opacity-[0.09] pointer-events-none select-none">
          <img alt="Watermark" className="w-[600px] h-auto" src={watermarkLogo} />
        </div>
      </section>

      {/* Section 2: VIDEO BANNER */}
      <section className="relative w-full h-[90vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-surface-container">
          {/* Etiqueta <video> correcta */}
          <video
            className="w-full h-full object-cover grayscale brightness-90"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/video1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
        </div>
        <div className="relative z-10 text-center px-margin-mobile">
          <h2 className="font-display-lg text-4xl md:text-display-md text-white mb-4 uppercase tracking-tighter">
            EL DETALLE ES EL ESTILO
          </h2>
          <p className="font-label-caps text-label-caps text-white/90 tracking-[0.3em] uppercase">
            Ilo · Moquegua · Perú
          </p>
        </div>
      </section>

      {/* Section 2.5: CORTE A DOMICILIO — DESTACADO */}
      <section className="relative bg-primary text-on-primary py-20 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none select-none">
          <span className="material-symbols-outlined" style={{ fontSize: '320px' }}>home</span>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="font-label-caps text-label-caps tracking-[0.3em] uppercase opacity-80">
                Servicio exclusivo
              </span>
            </div>
            <h2 className="font-display-lg text-3xl md:text-headline-lg uppercase mb-4 leading-tight">
              CORTE A DOMICILIO
            </h2>
            <p className="font-body-md text-body-md opacity-90 max-w-lg mb-6">
              Llevamos el estilo Threasure hasta tu puerta en Ilo. Ideal para
              antes de un evento, una entrevista, o simplemente porque tu
              tiempo vale más que una fila de espera.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/reserva">
                <button className="bg-background text-on-background px-8 py-4 font-button text-button tracking-widest uppercase hover:opacity-90 transition-all active:scale-95">
                  AGENDAR A DOMICILIO
                </button>
              </Link>
              <span className="font-label-caps text-label-caps tracking-widest uppercase opacity-80">
                Desde S/. 40
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: ABOUT */}
      <section className="bg-white text-black py-24 px-margin-mobile md:px-margin-desktop relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div className="md:col-span-5 flex flex-col justify-center">
            <blockquote className="font-display-lg text-3xl md:text-headline-lg text-black leading-tight mb-8 md:mb-0">
              "NO ES SOLO <br />UN CORTE. <br />ES UNA MARCA."
            </blockquote>
          </div>
          <div className="md:col-span-7 flex flex-col justify-center border-l-0 md:border-l border-black/10 md:pl-12">
            <h3 className="font-label-caps text-label-caps tracking-widest uppercase mb-6 text-black/40">
              EL BARBERO INDEPENDIENTE
            </h3>
            <p className="font-body-md text-body-md text-black/80 max-w-xl mb-12">
              Rogger Vega ha redefinido el concepto de barbería en Ilo. Threasure no es un local comercial más; es el resultado de años de precisión y visión urbana. Aquí, cada línea es intencional y cada cliente es una extensión de la marca Threasure.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border border-black p-6 hover:bg-black hover:text-white transition-colors duration-300 flex flex-col items-start">
                <span className="material-symbols-outlined mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-label-caps text-label-caps uppercase font-bold">Cortes a tu medida</p>
              </div>
              <div className="border border-black p-6 hover:bg-black hover:text-white transition-colors duration-300 flex flex-col items-start">
                <span className="material-symbols-outlined mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                <p className="font-label-caps text-label-caps uppercase font-bold">Ambiente relajado</p>
              </div>
              <div className="border border-black p-6 hover:bg-black hover:text-white transition-colors duration-300 flex flex-col items-start">
                <span className="material-symbols-outlined mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <p className="font-label-caps text-label-caps uppercase font-bold">Marca con estilo</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function Contacto() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.02;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.02;
      setMousePos({ x: moveX, y: moveY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    setIsSubmitting(true);
    // Let browser handle standard Formspree redirect or action if we don't preventDefault,
    // but we can submit it programmatically using fetch for better SPA experience!
    e.preventDefault();
    fetch('https://formspree.io/f/xldlglpe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(response => {
        setIsSubmitting(false);
        if (response.ok) {
          alert('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
          setFormData({ name: '', email: '', message: '' });
        } else {
          alert('Hubo un problema al enviar tu mensaje. Inténtalo de nuevo por favor.');
        }
      })
      .catch(() => {
        setIsSubmitting(false);
        alert('Hubo un error de red. Inténtalo de nuevo por favor.');
      });
  };

  const mapPlaceholderImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuDthIfPmBRBjP7DV9MyxhlnyB3132oXAIm9ZcuxHuuZFci47O79SMhbndkIOCp-jlLy69Lp5Opoc8ubXLOX3k7CjmCLZ17y-PrghhBR9iAoz5Rd_q0qJUlGD0mAuuBw4FXv7V7tNpUh2dbSgSNNr9gsn1S4t8PLboWfcXVas6A5tdi3uZArhMudZJrKTdysloKX6p92BONdOzkeQuHt-c4tmUZ65PHo55Ekac3IaxEnKWcztqSP5SGfmnBTEvjKoKzchShmEPS9ISA";

  return (
    <div className="pt-24 bg-surface text-on-surface">
      {/* Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop mb-16 md:mb-24 relative overflow-hidden text-left py-12">
        <div 
          className="absolute -left-10 -top-10 opacity-[0.03] pointer-events-none select-none font-display-lg text-[16vw] leading-none uppercase text-on-surface transition-transform duration-100"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        >
          BARBER
        </div>
        <h1 className="font-display-lg text-6xl md:text-display-lg uppercase leading-none tracking-tight relative z-10">
          CONTACTO
        </h1>
      </section>

      {/* Main Content: Two Columns */}
      <section className="px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-gutter mb-24 text-left">
        {/* Left Column: Info */}
        <div className="md:col-span-5 space-y-16">
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 w-1 h-full bg-on-surface"></div>
            <p className="font-body-md text-body-lg max-w-sm opacity-80 uppercase tracking-widest leading-relaxed">
              SOLO PARA AQUELLOS QUE BUSCAN LA PERFECCIÓN EN CADA DETALLE. UBICACIÓN EXCLUSIVA, SERVICIO ELITE.
            </p>
          </div>

          <div className="space-y-12">
            {/* WhatsApp */}
            <div className="group">
              <span className="block font-label-caps text-label-caps opacity-50 mb-2">TELEFONO / WHATSAPP</span>
              <a 
                className="font-headline-md text-3xl md:text-headline-md block hover:translate-x-2 transition-all duration-300 text-on-surface" 
                href="https://wa.me/51930561385" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                +51 930 561 385
              </a>
            </div>

            {/* Instagram */}
            <div className="group">
              <span className="block font-label-caps text-label-caps opacity-50 mb-2">SOCIAL</span>
              <a 
                className="font-headline-md text-3xl md:text-headline-md block hover:translate-x-2 transition-all duration-300 text-on-surface" 
                href="https://instagram.com/threasure_barbershop" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                @THREASURE_BARBERSHOP
              </a>
            </div>

            {/* Location */}
            <div className="group">
              <span className="block font-label-caps text-label-caps opacity-50 mb-2">UBICACIÓN</span>
              <p className="font-headline-md text-3xl md:text-headline-md leading-tight text-on-surface">
                ILO, MOQUEGUA<br />PERÚ
              </p>
            </div>
          </div>

          {/* Subtle Decorative Element */}
          <div className="w-full h-px bg-on-surface/10"></div>
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-4xl opacity-40">schedule</span>
            <div>
              <span className="block font-label-caps text-label-caps opacity-50">HORARIO ELITE</span>
              <p className="font-body-md text-body-md">LUN - SAB: 10:00 AM - 9:00 PM</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-start-7 md:col-span-6 bg-surface-container-lowest p-8 md:p-12 border border-on-surface/5 relative shadow-sm">
          {/* Diagonal Edge Accent */}
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-on-surface/20"></div>
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="relative">
                <label className="font-label-caps text-label-caps opacity-60 block mb-2" htmlFor="name">NOMBRE COMPLETO</label>
                <input 
                  className="w-full bg-transparent border-0 border-b border-on-surface/20 px-0 py-3 font-body-md text-body-md placeholder-on-surface/20 focus:ring-0 focus:border-on-surface transition-all text-on-surface" 
                  id="name" 
                  name="name" 
                  placeholder="ESCRIBE TU NOMBRE..." 
                  required 
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <label className="font-label-caps text-label-caps opacity-60 block mb-2" htmlFor="email">CORREO ELECTRÓNICO</label>
                <input 
                  className="w-full bg-transparent border-0 border-b border-on-surface/20 px-0 py-3 font-body-md text-body-md placeholder-on-surface/20 focus:ring-0 focus:border-on-surface transition-all text-on-surface" 
                  id="email" 
                  name="email" 
                  placeholder="EMAIL@EJEMPLO.COM" 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <label className="font-label-caps text-label-caps opacity-60 block mb-2" htmlFor="message">MENSAJE</label>
                <textarea 
                  className="w-full bg-transparent border-0 border-b border-on-surface/20 px-0 py-3 font-body-md text-body-md placeholder-on-surface/20 focus:ring-0 focus:border-on-surface transition-all resize-none text-on-surface" 
                  id="message" 
                  name="message" 
                  placeholder="¿CÓMO PODEMOS AYUDARTE?" 
                  required 
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button 
              className="w-full group relative overflow-hidden bg-primary text-on-primary py-5 font-button text-button uppercase tracking-[0.2em] font-bold hover:bg-primary/90 active:scale-[0.98] transition-all" 
              type="submit"
              disabled={isSubmitting}
            >
              <span className="relative z-10">{isSubmitting ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}</span>
              <div className="absolute inset-0 bg-on-primary/5 group-hover:translate-x-full transition-transform duration-500"></div>
            </button>
            <p className="font-label-caps text-[10px] opacity-40 text-center uppercase tracking-widest">
              NOS PONDREMOS EN CONTACTO EN MENOS DE 24 HORAS.
            </p>
          </form>
        </div>
      </section>

      {/* Map Section Graphic */}
      <section className="w-full h-[350px] md:h-[512px] relative grayscale hover:grayscale-0 transition-all duration-700 overflow-hidden border-y border-on-surface/10">
        <img 
          alt="A high-contrast black and white aerial view of a modern urban street corner in Ilo, Peru" 
          className="w-full h-full object-cover" 
          src={mapPlaceholderImage} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent bg-on-surface/10"></div>
        {/* Map Overlay Pin UI */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-on-surface flex items-center justify-center rotate-45 border-4 border-surface mb-4 shadow-xl">
            <span className="material-symbols-outlined text-surface text-3xl md:text-4xl -rotate-45" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>
          <div className="bg-on-surface text-surface px-6 py-2 font-button text-button uppercase tracking-widest font-bold">
            VISÍTANOS EN ILO
          </div>
        </div>
      </section>
    </div>
  );
}

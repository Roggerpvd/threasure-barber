import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Servicios() {
  const cardsRef = useRef([]);
  const [selected, setSelected] = useState(null);
  const [selectedList, setSelectedList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('TODOS');

  const heroImage = "/imagen3.png";

  const works = [
    { src: "/video2.mp4",  title: "Sking Fade",        tag: "SKIN FADE",     type: "video" },
    { src: "/video7.mp4",  title: "Mohicano + Barba",  tag: "SKIN FADE",    type: "video" },
    { src: "/video3.mp4",  title: "Taper Fade Bajo",   tag: "TAPER FADE",     type: "video" },
    { src: "/video4.mp4",  title: "Mohicano + Diseño", tag: "SKIN FADE",     type: "video" },
    { src: "/imagen5.png", title: "Diseño + Fade",     tag: "DISEÑO + FADE", type: "image" },
    { src: "/video5.mp4",  title: "Taper Fade en V",   tag: "TAPER FADE",          type: "video" },
    { src: "/imagen4.png", title: "Diseño Tribal",     tag: "DISEÑO",        type: "image" },
    { src: "/imagen6.png", title: "Diseño Tribal",     tag: "DISEÑO",        type: "image" },
  ];

  const artists = [
    { src: "/video6.mp4",   title: "GOOFYTO",        tag: "Artista Urbano Influencer", type: "video" },
    { src: "/imagen7.jpeg", title: "Lil Nicky",       tag: "Artista Urbano",            type: "image" },
    { src: "/video8.mp4",   title: "DJ RENATO BUTRON", tag: "DJ",                        type: "video" },
  ];

  //Los tags causaaa
  const filters = useMemo(() => {
    const unique = [...new Set(works.map(w => w.tag))];
    return ['TODOS', ...unique];
  }, []);

  const filteredWorks = activeFilter === 'TODOS'
    ? works
    : works.filter(w => w.tag === activeFilter);

  // Scroll 
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    cardsRef.current.forEach(card => {
      if (card) {
        card.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(card);
      }
    });

    return () => observer.disconnect();
  }, [filteredWorks]);

  // Navegación por teclado en el lightbox
  useEffect(() => {
    if (!selected) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, selectedList]);

  const openLightbox = (item, list) => {
    setSelected(item);
    setSelectedList(list);
  };

  const currentIndex = selectedList.findIndex(item => item.src === selected?.src);

  const goNext = () => {
    if (currentIndex === -1) return;
    const next = (currentIndex + 1) % selectedList.length;
    setSelected(selectedList[next]);
  };

  const goPrev = () => {
    if (currentIndex === -1) return;
    const prev = (currentIndex - 1 + selectedList.length) % selectedList.length;
    setSelected(selectedList[prev]);
  };

  // Tilt sutil de la tarjeta con el mouse
  const handleTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
  };
  const resetTilt = (e) => {
    e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
  };

  // Componente para renderizar imagen o video en la grilla
  const MediaThumb = ({ work }) => {
    const videoRef = useRef(null);
    const thumbRef = useRef(null);

    // Autoplay al entrar al viewport (para mobile, sin hover)
    useEffect(() => {
      if (work.type !== 'video' || !videoRef.current || !thumbRef.current) return;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }, { threshold: 0.6 });
      observer.observe(thumbRef.current);
      return () => observer.disconnect();
    }, [work]);

    if (work.type === "video") {
      return (
        <div ref={thumbRef} className="w-full h-full">
          <video
            ref={videoRef}
            src={work.src}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
            muted
            loop
            playsInline
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
          />
        </div>
      );
    }
    return (
      <img
        src={work.src}
        alt={work.title}
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
      />
    );
  };

  // Componente para el lightbox (imagen o video grande)
  const MediaFull = ({ work }) => {
    if (work.type === "video") {
      return (
        <video
          key={work.src}
          src={work.src}
          className="w-full max-h-[80vh] object-contain"
          controls
          autoPlay
          loop
        />
      );
    }
    return (
      <img
        key={work.src}
        src={work.src}
        alt={work.title}
        className="w-full max-h-[80vh] object-contain"
      />
    );
  };

  return (
    <div className="pt-20 bg-surface">

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center py-12 md:py-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
          <h2 className="font-display-xl text-[20vw] leading-none uppercase text-on-surface">THREASURE</h2>
        </div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-column-gap relative z-10">
          <div className="md:col-span-6 flex flex-col justify-center">
            <span className="inline-block border border-on-surface px-3 py-1 mb-6 self-start font-nav-label text-[10px] tracking-widest uppercase">
              MI TRABAJO
            </span>
            <h1 className="font-display-lg text-6xl md:text-display-lg uppercase mb-4 leading-tight">
              PORTAFOLIO
            </h1>
            <p className="font-body-main text-on-surface-variant max-w-sm">
              Cada corte habla por sí solo. Aquí dejamos que el trabajo hable.
            </p>
          </div>
          <div className="md:col-span-6 mt-12 md:mt-0">
            <div className="v-cut-left w-full h-[350px] md:h-[500px] bg-surface-container overflow-hidden">
              <img
                alt="Portafolio Hero"
                className="w-full h-full object-cover grayscale brightness-110"
                src={heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid de trabajos */}
      <section className="bg-primary text-on-primary py-16 md:py-24">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <h2 className="font-display-lg text-4xl md:text-headline-md uppercase border-l-4 border-on-primary pl-6">
              TRABAJOS RECIENTES
            </h2>
            <p className="font-nav-label uppercase tracking-widest text-on-primary/60">
              THREASURE BARBER · ILO
            </p>
          </div>

          {/* Filtros por categoría */}
          <div className="flex flex-wrap gap-3 mb-12">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`font-nav-label text-[11px] uppercase tracking-widest px-5 py-2 border transition-all ${
                  activeFilter === filter
                    ? 'bg-on-primary text-primary border-on-primary'
                    : 'border-on-primary/30 text-on-primary/60 hover:border-on-primary hover:text-on-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredWorks.map((work, index) => (
              <div
                key={work.src}
                ref={el => cardsRef.current[index] = el}
                className="group relative overflow-hidden cursor-pointer aspect-[3/4] bg-surface-container transition-transform duration-300"
                onClick={() => openLightbox(work, filteredWorks)}
                onMouseMove={handleTilt}
                onMouseLeave={resetTilt}
              >
                <MediaThumb work={work} />

                {work.type === "video" && (
                  <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1 pointer-events-none">
                    <span className="material-symbols-outlined text-white text-base">play_circle</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center px-4">
                  <span className="font-nav-label text-[15px] tracking-widest text-white/60 mb-2">{work.tag}</span>
                  <h3 className="font-display-lg text-2xl uppercase text-white">{work.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {filteredWorks.length === 0 && (
            <p className="font-body-main text-on-primary/50 text-center py-12">
              No hay trabajos en esta categoría todavía.
            </p>
          )}
        </div>
      </section>

      {/* QUIENES CONFÍAN EN THREASURE - ZONA ARTISTAS */}
      <section className="bg-surface py-20 md:py-28">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop">

          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <h2 className="font-display-lg text-4xl md:text-headline-md uppercase border-l-4 border-primary pl-6">
              QUIENES CONFÍAN EN THREASURE
            </h2>
            <p className="font-nav-label uppercase tracking-widest text-on-surface/60">
              ARTISTAS · INFLUENCERS · PERSONALIDADES
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <div
                key={artist.src}
                className="group relative overflow-hidden cursor-pointer aspect-[3/4] bg-surface-container transition-transform duration-300"
                onClick={() => openLightbox(artist, artists)}
                onMouseMove={handleTilt}
                onMouseLeave={resetTilt}
              >
                <MediaThumb work={artist} />

                {artist.type === "video" && (
                  <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1">
                    <span className="material-symbols-outlined text-white text-base">
                      play_circle
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center px-4">
                  <span className="font-nav-label text-[15px] tracking-widest text-white/60 mb-2">
                    {artist.tag}
                  </span>
                  <h3 className="font-display-lg text-2xl uppercase text-white">
                    {artist.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="font-body-main text-on-surface-variant max-w-3xl mx-auto">
              Artistas, músicos, influencers y personalidades que han confiado en el trabajo de Threasure Barber.
            </p>
          </div>

        </div>
      </section>

      {/* Lightbox con navegación */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>

            {/* Flecha anterior */}
            {selectedList.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
                aria-label="Anterior"
              >
                <span className="material-symbols-outlined text-4xl">chevron_left</span>
              </button>
            )}

            {/* Flecha siguiente */}
            {selectedList.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
                aria-label="Siguiente"
              >
                <span className="material-symbols-outlined text-4xl">chevron_right</span>
              </button>
            )}

            <MediaFull work={selected} />

            <div className="mt-4 flex justify-between items-center">
              <div>
                <span className="font-nav-label text-[10px] tracking-widest text-white/50">{selected.tag}</span>
                <h3 className="font-display-lg text-2xl uppercase text-white">{selected.title}</h3>
                {selectedList.length > 1 && (
                  <span className="font-nav-label text-[10px] tracking-widest text-white/30 mt-1 block">
                    {currentIndex + 1} / {selectedList.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white font-nav-label tracking-widest text-sm border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-colors"
              >
                CERRAR ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="bg-surface py-20 md:py-28 relative">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display-lg text-4xl md:text-display-lg uppercase mb-12 text-on-surface">
              ¿Listo para transformar tu estilo?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-md mx-auto sm:max-w-none">
              <Link to="/reserva" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-primary text-on-primary px-12 py-6 font-nav-label text-lg tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all shadow-xl">
                  AGENDAR AHORA
                </button>
              </Link>
              
            </div>
          </div>
        </div>
        <div className="absolute left-0 bottom-0 w-32 md:w-64 h-32 md:h-64 border-r border-t border-primary/5 pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-48 md:w-96 h-48 md:h-96 border-l border-b border-primary/5 pointer-events-none"></div>
      </section>

    </div>
  );
}
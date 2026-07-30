import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);

      if (location.pathname === '/' || location.pathname === '/servicios') {
  const heroBanner = document.querySelector('section:nth-child(2)');
  if (heroBanner) {
    const rect = heroBanner.getBoundingClientRect();
    setIsDark(rect.top <= 0 && rect.bottom >= 0);
  }
} else {
  setIsDark(false);
}
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const allowDark = location.pathname === '/' || location.pathname === '/servicios';

  const textColor = (allowDark && isDark) ? 'text-white' : 'text-on-surface';
  const textColorMuted = (allowDark && isDark) ? 'text-white/70' : 'text-on-surface/60';
  const textColorHover = (allowDark && isDark) ? 'hover:text-white' : 'hover:text-on-surface';
  const borderColor = (allowDark && isDark) ? 'border-white' : 'border-primary';
  const iconColor = (allowDark && isDark) ? 'text-white' : 'text-on-surface';

  const navClass = isHome
    ? scrolled
      ? 'bg-surface/10 backdrop-blur-md shadow-sm border-b border-outline/10'
      : 'bg-transparent border-b border-black/5'
    : scrolled
      ? 'bg-surface/10 backdrop-blur-md shadow-sm border-b border-outline/10'
      : 'bg-surface/10 backdrop-blur-md border-b border-outline/10';

  const linkActiveStyle = (path) => {
    const isActive = location.pathname === path;
    return isActive
      ? `font-nav-label text-nav-label uppercase tracking-widest ${textColor} border-b-2 ${borderColor} pb-1 font-bold active:scale-95 transition-transform`
      : `font-nav-label text-nav-label uppercase tracking-widest ${textColorMuted} ${textColorHover} transition-colors duration-100 active:scale-95 transition-transform`;
  };

  const logoImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCtLCs_dKYVaQzBAvlXvJ9Yh84CshDerPMHGu4IX6lgR2GZSPNtinJi7L5ICk31CY1GXlIb-u_3PXIzB7uZAWW3qFgIYPd2OdfZOg4mspMWpeG6_WpoEJuxxjtVPgCzBiYD9L_QYwVRHKVPUBlF8QhZTzcd4sktVQ3Ut-w-50PK869Fiw7AbBCxZZU1wwFullPkHTI8X2yElO_oh3GHYpEBh11eTtHOUPFu4pVXy7bWO7scLmcJ1-R_HEiIFW_ZBkKZsVjMrWH6PZY";

  return (
    <nav className={`fixed top-0 w-full z-50 flex items-center justify-between md:justify-center px-margin-mobile md:px-margin-desktop py-4 transition-all duration-300 gap-6 md:gap-12 ${navClass}`}>
      
      {/* Brand Logo & Title */}
      <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
        <img alt="THREASURE BARBER Logo" className="h-10 w-auto" src={logoImg} />
        <span className={`font-headline-md text-headline-md tracking-tighter transition-colors duration-300 ${textColor}`}>
          THREASURE BARBER
        </span>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-10">
        <Link className={linkActiveStyle('/')} to="/">INICIO</Link>
        <Link className={linkActiveStyle('/servicios')} to="/servicios">SERVICIOS</Link>
        <Link className={linkActiveStyle('/mis-citas')} to="/mis-citas">MIS CITAS</Link>
      </div>

      {/* Desktop CTA */}
      <Link to="/reserva" className="hidden md:block">
        <button className={`px-6 py-2 font-nav-label text-nav-label tracking-widest uppercase active:scale-95 transition-all border ${
          isDark
            ? 'border-white text-white hover:bg-white hover:text-black'
            : 'bg-primary text-on-primary border-primary hover:opacity-90'
        }`}>
          AGENDAR
        </button>
      </Link>

      {/* Mobile Drawer Trigger */}
      <button
        className={`md:hidden flex items-center justify-center p-2 focus:outline-none transition-colors duration-300 ${iconColor}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Navigation Menu"
      >
        <span className="material-symbols-outlined text-3xl">
          {mobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface border-b border-outline/10 py-6 px-margin-mobile flex flex-col gap-6 md:hidden shadow-lg animate-in fade-in slide-in-from-top-5 duration-200">
          <Link className="font-nav-label text-lg tracking-widest text-on-surface/80 hover:text-on-surface pb-2 border-b border-outline/5" to="/">INICIO</Link>
          <Link className="font-nav-label text-lg tracking-widest text-on-surface/80 hover:text-on-surface pb-2 border-b border-outline/5" to="/servicios">SERVICIOS</Link>
          <Link className="font-nav-label text-lg tracking-widest text-on-surface/80 hover:text-on-surface pb-2 border-b border-outline/5" to="/mis-citas">MIS CITAS</Link>
          <Link to="/reserva" className="w-full">
            <button className="w-full bg-primary text-on-primary py-4 font-nav-label text-nav-label tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all text-center">
              AGENDAR CITA
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
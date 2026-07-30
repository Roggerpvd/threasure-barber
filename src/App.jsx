import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Servicios from './pages/Servicios';
import Reserva from './pages/Reserva';
import Contacto from './pages/Contacto';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './pages/AdminPanel';
import MisCitas from './pages/MisCitas';
import AppHome from './pages/AppHome';
import RequireAdmin from './components/RequireAdmin';
import { AuthProvider } from './context/AuthContext';
import InstallBanner from './components/InstallBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Cambia el manifiesto PWA y el título según la sección:
// - En /admin se instala como "Threasure Admin" (app aparte, para ti).
// - En el resto del sitio se instala como "Threasure Barber" (para clientes).
function DynamicManifest() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isAdmin = pathname.startsWith('/admin');
    const manifestLink = document.getElementById('app-manifest');
    const appleTitle = document.getElementById('apple-app-title');

    if (manifestLink) {
      manifestLink.setAttribute('href', isAdmin ? '/manifest-admin.json' : '/manifest.json');
    }
    if (appleTitle) {
      appleTitle.setAttribute('content', isAdmin ? 'Threasure Admin' : 'Threasure Barber');
    }
    document.title = isAdmin ? 'Threasure Admin' : 'THREASURE BARBER';
  }, [pathname]);

  return null;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      {!splashDone && (
        <SplashScreen onFinished={() => setSplashDone(true)} />
      )}

      <Router>
        <ScrollToTop />
        <DynamicManifest />
        <div className="flex flex-col min-h-screen bg-background text-on-background selection:bg-primary selection:text-on-primary">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/reserva" element={<Reserva />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/mis-citas" element={<MisCitas />} />
              <Route path="/app" element={<AppHome />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminPanel />
                  </RequireAdmin>
                }
              />
            </Routes>
          </main>
          <Footer />
          <InstallBanner />
        </div>
      </Router>
    </AuthProvider>
  );
}

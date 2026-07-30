import { useEffect, useState } from "react";

const BRAND_NAME = "THREASURE";

export default function SplashScreen({ onFinished }) {
  const [phase, setPhase] = useState("logo");
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [showBarber, setShowBarber] = useState(false);

  useEffect(() => {
    // logo entra → letras aparecen → BARBER → fadeout
    const t1 = setTimeout(() => setPhase("name"), 500);

    // cada letra aparece cada 80ms
    let letterInterval;
    const t2 = setTimeout(() => {
      letterInterval = setInterval(() => {
        setVisibleLetters(v => v + 1);
      }, 50);
    }, 700);

    // BARBER aparece cuando terminan las letras
    const t3 = setTimeout(() => {
      clearInterval(letterInterval);
      setVisibleLetters(BRAND_NAME.length);
      setShowBarber(true);
    }, 600 + BRAND_NAME.length * 80 + 100);

    // fadeout
    const t4 = setTimeout(() => setPhase("fadeout"), 1800);
    const t5 = setTimeout(() => onFinished(), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearInterval(letterInterval);
    };
  }, [onFinished]);

  return (
    <>
      <style>{`
        @keyframes slide-in-bck-center {
          0%   { transform: translateZ(600px); opacity: 0; }
          100% { transform: translateZ(0);     opacity: 1; }
        }
        .logo-slide {
          animation: slide-in-bck-center 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        }
        @keyframes pop-letter {
          0%   { opacity: 0; transform: translateY(-10px) scale(1.4); }
          100% { opacity: 1; transform: translateY(0px)  scale(1);   }
        }
        .letter {
          display: inline-block;
          animation: pop-letter 0.15s ease forwards;
        }
        @keyframes fade-up {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        .barber-text {
          animation: fade-up 0.5s ease forwards;
        }
        @keyframes line-expand {
          0%   { width: 0; }
          100% { width: 80px; }
        }
        .line-expand {
          animation: line-expand 0.6s ease 0.2s forwards;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.2rem",
          opacity: phase === "fadeout" ? 0 : 1,
          transition: phase === "fadeout" ? "opacity 1.2s ease" : "none",
          pointerEvents: "none",
          userSelect: "none",
          perspective: "1000px",
        }}
      >
        {/* ── Logo ── */}
        <div
          className="logo-slide"
          style={{
            width: 400,
            height: 400,
            filter: "drop-shadow(0 0 28px rgba(32, 32, 32, 0.75))",
          }}
        >
          <img
            src="/logo.png"
            alt="Threasure Barber Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* ── THREASURE letra por letra ── */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            letterSpacing: "0.25em",
            color: "#000000",
            lineHeight: 1,
            minHeight: "1.2em",
          }}
        >
          {BRAND_NAME.slice(0, visibleLetters).split("").map((char, i) => (
            <span key={i} className="letter">{char}</span>
          ))}
        </div>

        {/* ── BARBER ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
          {showBarber && (
            <span
              className="barber-text"
              style={{
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: "clamp(0.75rem, 3vw, 1rem)",
                letterSpacing: "0.55em",
                color: "#b00000",
                textTransform: "uppercase",
                fontWeight: 600,
              }}  
            >
              BARBEROLOGY
            </span>
          )}

          {/* línea roja */}
          {showBarber && (
            <div
              className="line-expand"
              style={{
                width: 0,
                height: 1,
                backgroundColor: "#b00000",
                opacity: 0.7,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
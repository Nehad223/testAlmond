import React, { useEffect, useState, useRef } from "react";

/*
  ProfessionalLoader.jsx
  - Standalone React loader component (no external CSS files required).
  - Injects its own scoped CSS on mount so you can drop this file into any project.
  - Features: accessible markup, progressive (simulated + real) progress, image preloading, smooth fade-out, reduced-motion support, optional store button and credit text, callbacks.

  Usage:
    <ProfessionalLoader
      logoSrc="/logo.webp"
      prefetch={["/hero.jpg", "/card1.jpg"]}
      minDuration={700} // keep loader visible at least this long (ms)
      credit="Developed by Mj+"
      showStore={true}
      onFinish={() => console.log('loader finished')}
    />
*/

const INJECTED_STYLE_ID = "pro-loader-styles";

const DEFAULT_CSS = `
:root {
  --pro-bg: linear-gradient(180deg,#F39C12 0%, #D35400 100%);
  --pro-accent: #F3D98B;
  --pro-dark: #14110f;
}
.pro-loader-root{ position: fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:99999; font-family: var(--font-ar, system-ui, sans-serif); }
.pro-loader-overlay{ position:absolute; inset:0; background: var(--pro-bg); display:flex; align-items:center; justify-content:center; }
.pro-loader-panel{ position:relative; z-index:2; width:min(680px,92vw); display:flex; flex-direction:column; align-items:center; gap:16px; padding:28px; border-radius:18px; box-shadow:0 18px 80px rgba(0,0,0,.5); background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.06)); backdrop-filter: blur(6px); }
.pro-loader-logo{ width:clamp(100px,20vh,260px); height:auto; display:block; transform-origin:center; animation:pro-pulse 1400ms ease-in-out infinite; }
@keyframes pro-pulse{0%{transform:scale(.985)}50%{transform:scale(1.02)}100%{transform:scale(.985)}}
.pro-loader-bar-wrap{ width:100%; background:rgba(255,255,255,.04); height:12px; border-radius:999px; overflow:hidden; border:1px solid rgba(0,0,0,.08); }
.pro-loader-bar{ height:100%; width:0%; background: linear-gradient(90deg, rgba(243,156,18,1), rgba(243,217,139,1)); transition: width .45s cubic-bezier(.2,.9,.2,1); }
.pro-loader-meta{ display:flex; gap:8px; width:100%; justify-content:space-between; align-items:center; font-weight:700; color:var(--pro-accent); font-family: var(--font-en, system-ui, sans-serif); }
.pro-loader-credit{ opacity:.75; font-size:13px; color: #fff; }
.pro-loader-store{ position: absolute; top:14px; right:14px; background: linear-gradient(135deg,#FFB703,#F77F00); border-radius:999px; padding:6px 12px; box-shadow:0 8px 30px rgba(0,0,0,.35); display:flex; gap:8px; align-items:center; cursor:pointer; border:none; }
.pro-loader-store img{ width:22px; height:22px; }
.pro-loader-hide{ opacity:0; pointer-events:none; transform:translateY(-6px); transition: opacity .45s ease, transform .45s ease; }
.pro-loader-fadeout{ animation: pro-fadeout .55s ease forwards; }
@keyframes pro-fadeout{ to{ opacity:0; transform:scale(.98) translateY(-6px); }}
.pro-loader-accessible{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
@media (prefers-reduced-motion: reduce){ .pro-loader-logo, .pro-loader-bar{ animation:none; transition:none; }}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(INJECTED_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = INJECTED_STYLE_ID;
  style.innerHTML = DEFAULT_CSS;
  document.head.appendChild(style);
}

function preloadImages(list = []) {
  return Promise.all(
    list.map((src) =>
      new Promise((res) => {
        if (!src) return res();
        const img = new Image();
        img.onload = img.onerror = () => res();
        img.src = src;
      })
    )
  );
}

export default function ProfessionalLoader({
  logoSrc = "/logo.webp",
  prefetch = [],
  minDuration = 600,
  onFinish = () => {},
  credit = "Developed by Mj+",
  showStore = true,
  storeCount = 0,
  className = "",
}) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const startRef = useRef(Date.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    injectStyles();

    let mounted = true;
    // Simulate progressive loading until real resources finish
    let raf;
    const start = Date.now();

    const step = () => {
      // slow approach to 80%
      setProgress((p) => {
        if (!mounted) return p;
        const max = finishedRef.current ? 100 : 86;
        const next = Math.min(max, p + (Math.random() * 6 + 2));
        return Math.round(next);
      });
      raf = window.setTimeout(step, 220 + Math.random() * 180);
    };
    step();

    // Preload images + listen for complete
    preloadImages([logoSrc, ...prefetch]).then(() => {
      finishedRef.current = true;
      // ease to 100
      setProgress(100);
      const elapsed = Date.now() - startRef.current;
      const wait = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        // trigger finish animation
        setVisible(false);
        onFinish();
      }, wait + 160); // small buffer so progress bar fills visually
    });

    return () => {
      mounted = false;
      clearTimeout(raf);
    };
  }, [logoSrc, prefetch, minDuration, onFinish]);

  // When hidden, let DOM remove itself after fade-out
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        // fully unmount by setting display none via style
        const root = document.getElementById("pro-loader-root");
        if (root) root.style.display = "none";
      }, 650);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div
      id="pro-loader-root"
      className={`pro-loader-root ${className} ${!visible ? "pro-loader-fadeout" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <span className="pro-loader-accessible">Loading…</span>

      <div className="pro-loader-overlay" aria-hidden="true"></div>

      <div className="pro-loader-panel" style={{ pointerEvents: visible ? "auto" : "none" }}>


        {/* Animated SVG logo fallback + image */}
        <img
          src={logoSrc}
          alt="App logo"
          className="pro-loader-logo"
          decoding="async"
          fetchPriority="high"
        />

        <div className="pro-loader-bar-wrap" aria-hidden="true">
          <div className="pro-loader-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="pro-loader-meta">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 14, color: "#FFF" }}>{progress}%</div>
            <div style={{ fontSize: 13, opacity: 0.75 }} className="pro-loader-credit">{credit}</div>
          </div>

        </div>
      </div>
    </div>
  );
}

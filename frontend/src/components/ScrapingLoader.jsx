import React, { useState, useEffect } from 'react';
import '../css/ScrapingLoader.css';

export default function ScrapingLoader({ text = "Buscando resultados..." }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  let statusText = text;
  if (elapsed >= 10) {
    statusText = "Esto está tardando más de lo esperado. Por favor, espera un poco más...";
  } else if (elapsed >= 7) {
    statusText = "Consolidando datos...";
  } else if (elapsed >= 4) {
    statusText = "Analizando tiendas y precios...";
  } else if (elapsed >= 2) {
    statusText = "Buscando en la web...";
  }

  // Progress calculation for 10 seconds (max 100%)
  const progress = Math.min((elapsed / 10) * 100, 100);

  return (
    <div className="scraping-loader-container">
      <div className="scraping-spinner"></div>
      <p className="scraping-loader-text">{statusText}</p>
      
      <div className="scraping-progress-bar-bg">
        <div 
          className={`scraping-progress-bar-fill ${elapsed >= 10 ? 'slow' : ''}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {elapsed < 10 ? (
        <p className="scraping-timer">Tiempo estimado: {10 - elapsed}s</p>
      ) : (
        <p className="scraping-timer slow">Paciencia, casi listo...</p>
      )}
    </div>
  );
}

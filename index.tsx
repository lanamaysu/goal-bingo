import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const FontLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Check if the font is already ready or wait for it
    const fontName = '24px "Material Symbols Outlined"';
    document.fonts
      .load(fontName)
      .then(() => {
        setFontsLoaded(true);
      })
      .catch(() => {
        // Fallback if font loading fails for some reason
        console.warn('Font loading check failed, rendering anyway.');
        setFontsLoaded(true);
      });
  }, []);

  if (!fontsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
          <div className="text-accent dark:text-accent font-bold text-sm tracking-widest">
            LOADING...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <FontLoader>
    <App />
  </FontLoader>
);

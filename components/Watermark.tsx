
import React from 'react';

const Watermark: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 select-none overflow-hidden">
      <div className="grid grid-cols-3 grid-rows-3 gap-12 rotate-[-35deg] scale-150">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="text-white text-xl font-bold border-2 border-white/20 px-4 py-2 uppercase tracking-widest bg-black/10 backdrop-blur-sm whitespace-nowrap">
            L2 LOGO FORGE - FREE
          </span>
        ))}
      </div>
    </div>
  );
};

export default Watermark;

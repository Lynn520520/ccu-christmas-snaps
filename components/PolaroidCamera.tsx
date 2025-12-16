import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface PolaroidCameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onShutter: () => void;
  isFlashing: boolean;
}

export const PolaroidCamera: React.FC<PolaroidCameraProps> = ({ videoRef, onShutter, isFlashing }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1080 },
            height: { ideal: 1080 },
            aspectRatio: 1
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Camera access denied.");
        console.error(err);
      }
    }
    setupCamera();

    // Cleanup tracks on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  return (
    <div className="relative w-[280px] h-[280px] select-none z-20">
       {/* Camera Body - Light Violet */}
       <div className="absolute inset-0 bg-[#ddd6fe] rounded-[3rem] shadow-2xl border border-white flex items-center justify-center overflow-hidden z-20">
          
          {/* Top Left Badge */}
          <div className="absolute top-6 left-6 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full z-30">
            CCU OIA
          </div>

          {/* Flash - Moved Down closer to lens */}
          <div className={`absolute top-14 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-slate-200 transition-colors duration-100 z-30 ${isFlashing ? 'bg-yellow-300 shadow-[0_0_50px_rgba(253,224,71,1)] scale-150' : 'bg-yellow-100'}`}></div>

          {/* Shutter Button (Purple/Blue) */}
          <button 
             onClick={onShutter}
             className="absolute top-6 right-6 w-12 h-12 bg-indigo-400 rounded-full shadow-lg border-4 border-white active:scale-95 active:bg-indigo-600 transition-transform z-30 hover:shadow-indigo-500/30"
             aria-label="Capture"
          ></button>

          {/* Rainbow Stripe */}
          <div className="absolute top-1/2 left-0 w-full h-5 -translate-y-1/2 flex z-0 opacity-90">
             <div className="h-full w-1/4 bg-[#ffb7b2]"></div> 
             <div className="h-full w-1/4 bg-[#fff4bd]"></div> 
             <div className="h-full w-1/4 bg-[#c7f9cc]"></div> 
             <div className="h-full w-1/4 bg-[#c5d7fc]"></div> 
          </div>

          {/* Lens Assembly */}
          <div className="relative z-10 w-48 h-48 bg-slate-900 rounded-full border-8 border-white shadow-xl flex items-center justify-center">
             {/* Lens Ring Detail */}
             <div className="absolute inset-1 border-2 border-slate-700 rounded-full opacity-50"></div>
             
             {/* Video Container (The Lens Glass) */}
             <div className="w-40 h-40 rounded-full overflow-hidden bg-black border-4 border-slate-800 relative shadow-inner">
                {error ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <AlertCircle size={24} />
                  </div>
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    // Mirroring the preview here
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                )}
                {/* Lens Reflection/Glare */}
                <div className="absolute top-4 right-8 w-8 h-4 bg-white opacity-10 rounded-full rotate-45 pointer-events-none"></div>
             </div>

             {/* Lens Text */}
             <div className="absolute bottom-3 text-[6px] text-white/40 font-mono tracking-widest uppercase">
                INSTAX MINI
             </div>
          </div>

          {/* Polaroid Label - Changed from Instax */}
          <div className="absolute bottom-5 left-6 text-slate-500 font-bold flex items-center gap-1">
             <div className="w-2 h-2 bg-slate-400 grid grid-cols-2 gap-[1px]">
               <div className="bg-slate-500"></div><div className="bg-slate-500"></div>
               <div className="bg-slate-500"></div><div className="bg-slate-500"></div>
             </div>
             <span className="text-sm text-indigo-900/60">Polaroid</span>
          </div>

          {/* Speaker/Vent Slots */}
          <div className="absolute bottom-6 right-6 flex gap-1">
             <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
             <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
             <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
          </div>

          {/* Ejection Slot (Top hidden) */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-0"></div>

       </div>
    </div>
  );
};
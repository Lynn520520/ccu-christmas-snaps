import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, SwitchCamera, RefreshCw } from 'lucide-react';

interface PolaroidCameraProps {
  // Updated to accept null to match useRef initial value type behavior in strict mode
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onShutter: () => void;
  isFlashing: boolean;
}

export const PolaroidCamera: React.FC<PolaroidCameraProps> = ({ videoRef, onShutter, isFlashing }) => {
  const [error, setError] = useState<string | null>(null);
  // Default to user (front camera)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLoading, setIsLoading] = useState(true);

  const stopTracks = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [videoRef]);

  const setupCamera = useCallback(async () => {
    stopTracks(); // Stop existing stream before starting new one
    setError(null);
    setIsLoading(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode, 
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
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopTracks, videoRef]);

  useEffect(() => {
    setupCamera();
    return () => stopTracks();
  }, [setupCamera, stopTracks]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent shutter trigger if clicking retry
    setupCamera();
  };

  return (
    <div className="relative w-[280px] h-[280px] select-none z-20">
       {/* Camera Body - Light Violet */}
       <div className="absolute inset-0 bg-[#ddd6fe] rounded-[3rem] shadow-2xl border border-white flex items-center justify-center overflow-hidden z-20">
          
          {/* Top Left Badge */}
          <div className="absolute top-6 left-6 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full z-30">
            CCU OIA
          </div>

          {/* Flash */}
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-slate-200 transition-colors duration-100 z-30 ${isFlashing ? 'bg-yellow-300 shadow-[0_0_50px_rgba(253,224,71,1)] scale-150' : 'bg-yellow-100'}`}></div>

          {/* Shutter Button (Purple/Blue) */}
          <button 
             onClick={onShutter}
             disabled={!!error || isLoading}
             className="absolute top-6 right-6 w-12 h-12 bg-indigo-400 rounded-full shadow-lg border-4 border-white active:scale-95 active:bg-indigo-600 transition-transform z-30 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="Capture"
          ></button>

          {/* Camera Toggle Button (Bottom Left) - HIGH VISIBILITY UPDATE */}
          <button
            onClick={toggleCamera}
            disabled={!!error}
            className="absolute bottom-5 left-5 z-40 w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-800 shadow-xl hover:bg-slate-50 transition-all border-2 border-slate-200 active:scale-90 active:bg-indigo-50 disabled:opacity-50"
            title="Switch Camera"
          >
            <SwitchCamera size={22} strokeWidth={2.5} />
          </button>

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
             <div className="w-40 h-40 rounded-full overflow-hidden bg-black border-4 border-slate-800 relative shadow-inner group">
                {error ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center bg-slate-900 z-50 absolute inset-0">
                    <AlertCircle size={24} className="mb-2 text-red-400" />
                    <p className="text-[10px] font-bold mb-2 leading-tight text-slate-300">Camera Error</p>
                    <button 
                      onClick={handleRetry}
                      className="bg-slate-700 text-white text-[9px] px-3 py-1.5 rounded-full hover:bg-slate-600 flex items-center gap-1 border border-slate-600"
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                ) : (
                  <>
                     <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                        data-facing-mode={facingMode}
                     />
                     {/* Loading Spinner */}
                     {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <RefreshCw size={24} className="text-slate-600 animate-spin" />
                        </div>
                     )}
                  </>
                )}
                {/* Lens Reflection/Glare */}
                <div className="absolute top-4 right-8 w-8 h-4 bg-white opacity-10 rounded-full rotate-45 pointer-events-none"></div>
             </div>

             {/* Lens Text */}
             <div className="absolute bottom-3 text-[6px] text-white/40 font-mono tracking-widest uppercase">
                INSTAX MINI
             </div>
          </div>

          {/* Polaroid Label */}
          <div className="absolute bottom-5 left-16 text-slate-500 font-bold flex items-center gap-1 pl-2">
             <span className="text-sm text-indigo-900/60 tracking-wider">Polaroid</span>
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
}
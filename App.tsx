import React, { useState, useRef, useEffect } from 'react';
import { PolaroidCamera } from './components/PolaroidCamera';
import { FrameDesign } from './components/FrameDesign';
import { DraggablePhoto } from './components/DraggablePhoto';
import { FrameStyle, PhotoData } from './types';
import { Check, User, Download, Sparkles, Camera, Images } from 'lucide-react';
import { generatePolaroidCanvas } from './utils/polaroidGenerator';
import JSZip from 'jszip';

const generateId = () => Math.random().toString(36).substring(2, 9);

type MobileTab = 'camera' | 'canvas';

export default function App() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>(FrameStyle.SANTA);
  const [userName, setUserName] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isZipping, setIsZipping] = useState(false);
  
  // Mobile Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('camera');
  
  // Countdown State
  const [countdown, setCountdown] = useState<number | null>(null);

  // Printing State
  const [printingPhoto, setPrintingPhoto] = useState<PhotoData | null>(null);

  // Camera Ref (Lifted from PolaroidCamera)
  const videoRef = useRef<HTMLVideoElement>(null);

  // Countdown Effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished, Capture!
      handleCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const startCountdown = () => {
    if (!printingPhoto && !isFlashing && countdown === null) {
      setCountdown(3);
    }
  };

  const handleCapture = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Check if mirrored (front camera usually is, back isn't) - simplistic check based on transform class in DOM
      // But simpler: The camera component handles preview mirroring.
      // We need to know if we should mirror the capture. 
      // Usually, if it's user-facing, we mirror. If environment, we don't.
      // Since we don't have easy access to 'facingMode' state here without callback, 
      // let's rely on the visual expectation: Front cams feel natural mirrored.
      
      const isMirrored = videoElement.style.transform.includes('scale-x-[-1]') || videoElement.className.includes('scale-x-[-1]');
      
      if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
      }
      
      ctx.drawImage(videoElement, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      const randomRotation = (Math.random() * 6) - 3; 

      // On mobile, center loosely. On desktop, predefined.
      const isMobile = window.innerWidth < 768;
      const initialX = isMobile ? window.innerWidth / 2 - 100 : window.innerWidth / 2 - 160;
      const initialY = isMobile ? window.innerHeight / 2 - 140 : window.innerHeight / 2 - 200;
      const initialScale = isMobile ? 0.7 : 1.0;

      const newPhoto: PhotoData = {
        id: generateId(),
        dataUrl,
        frameStyle: selectedFrame,
        userName: userName,
        timestamp: Date.now(),
        x: initialX, 
        y: initialY,
        zIndex: maxZIndex + 1,
        scale: initialScale,
        rotation: randomRotation
      };

      setMaxZIndex(prev => prev + 1);
      
      // Start "Printing" Animation
      setPrintingPhoto(newPhoto);

      // Animation duration match (wait for slide up then add to canvas)
      setTimeout(() => {
        setPhotos(prev => [...prev, newPhoto]);
        setPrintingPhoto(null);
        // Auto switch to canvas tab on mobile so user sees the result
        if (window.innerWidth < 768) {
           setActiveTab('canvas');
        }
      }, 1000); 
    }
  };

  const updatePhotoPosition = (id: string, x: number, y: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  };

  const updatePhotoScale = (id: string, scale: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, scale } : p));
  };

  const updatePhotoRotation = (id: string, rotation: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, rotation } : p));
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const bringToFront = (id: string) => {
    setMaxZIndex(prev => prev + 1);
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, zIndex: maxZIndex + 1 } : p));
  };

  const handleBatchDownload = async () => {
    if (photos.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const canvas = await generatePolaroidCanvas(photo);
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const sanitizedName = photo.userName ? photo.userName.replace(/[^a-z0-9]/gi, '_') : 'Guest';
              const filename = `CCU-Polaroid-${sanitizedName}-${i + 1}.png`;
              zip.file(filename, blob);
            }
            resolve();
          }, 'image/png');
        });
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.download = `CCU-Photos-Batch-${Date.now()}.zip`;
      link.href = URL.createObjectURL(content);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Batch download failed", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden flex flex-col md:flex-row font-sans">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-300 to-transparent"></div>

      {/* --- SIDEBAR (Camera & Controls) --- */}
      {/* Hidden on Mobile if activeTab is 'canvas', always shown on Desktop */}
      <div className={`relative z-10 w-full md:w-[340px] lg:w-[380px] h-full bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-2xl flex flex-col items-center p-4 overflow-y-auto shrink-0 no-scrollbar ${activeTab === 'canvas' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Title Section */}
        <div className="mb-4 mt-2 text-center">
             <h1 className="font-script text-[3rem] leading-none text-[#b91c1c] font-bold mb-1 drop-shadow-sm transform -rotate-2">
               Christmas Snaps
             </h1>
             <div className="flex items-center justify-center gap-2">
                <span className="h-[1px] w-6 bg-slate-300"></span>
                <p className="text-slate-500 text-[10px] tracking-[0.25em] uppercase font-bold">CCU OIA Edition</p>
                <span className="h-[1px] w-6 bg-slate-300"></span>
             </div>
        </div>

        {/* Name Input */}
        <div className="w-full max-w-[220px] mb-6 relative z-30">
           <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <User size={14} className="text-slate-400" />
              </div>
              <textarea
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter Name"
                rows={2}
                className="block w-full pl-9 pr-3 py-2 bg-orange-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:bg-white text-sm font-bold transition-all resize-none overflow-hidden leading-tight"
                style={{ minHeight: '42px' }}
              />
           </div>
        </div>

        {/* Camera Container */}
        <div className="relative mb-6 flex justify-center w-full z-20">
            <PolaroidCamera 
                videoRef={videoRef} 
                onShutter={startCountdown} 
                isFlashing={isFlashing} 
            />
            
            {/* Printing Animation */}
            {printingPhoto && (
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 z-0 transition-all duration-[1000ms] ease-out origin-bottom"
                style={{ 
                   transform: 'translate(-50%, -95%) rotate(-2deg)', 
                   width: '180px', 
                }}
              >
                 <div className="transform scale-[0.6] origin-bottom shadow-xl">
                    <FrameDesign style={printingPhoto.frameStyle} userName={printingPhoto.userName} isDeveloping={true}>
                       <img src={printingPhoto.dataUrl} className="w-full h-full object-cover" />
                    </FrameDesign>
                 </div>
              </div>
            )}
        </div>

        {/* Frame Selector */}
        <div className="w-full px-2 mb-20 md:mb-0">
          <h3 className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-[10px] pl-1 flex items-center gap-2 justify-center">
            <Sparkles size={12} /> Select Design
          </h3>
          <div className="grid grid-cols-3 gap-3">
             {Object.values(FrameStyle).map((style) => (
               <button
                 key={style}
                 onClick={() => setSelectedFrame(style)}
                 className={`relative group rounded-lg overflow-hidden transition-all duration-200 h-24 shadow-sm bg-slate-100 ${selectedFrame === style ? 'ring-2 ring-red-400 ring-offset-2 scale-105 z-10' : 'hover:opacity-90'}`}
               >
                 <div className="absolute inset-0 flex items-center justify-center p-1">
                    <div className="transform scale-[0.22] origin-center w-[300px] h-[380px] pointer-events-none shrink-0 shadow-lg">
                        <FrameDesign style={style} userName={userName || 'Name'}>
                           <div className="w-full h-full bg-slate-200/50 flex items-center justify-center text-slate-300">
                           </div>
                        </FrameDesign>
                    </div>
                 </div>
                 
                 {selectedFrame === style && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="bg-white rounded-full p-1 shadow-lg animate-in zoom-in duration-200">
                        <Check size={12} className="text-red-600" />
                     </div>
                   </div>
                 )}
               </button>
             ))}
          </div>
        </div>

        <div className="mt-auto pt-6 text-center text-[9px] text-slate-300 font-mono leading-relaxed hidden md:block">
           <p className="font-bold">National Chung Cheng University</p>
           <p>Office of International Affairs</p>
        </div>
      </div>

      {/* --- CANVAS AREA --- */}
      {/* Hidden on Mobile if activeTab is 'camera', always shown on Desktop */}
      <div className={`flex-1 relative h-full bg-[#f8fafc] overflow-hidden touch-none ${activeTab === 'camera' ? 'hidden md:block' : 'block'}`}>
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 opacity-[0.06] pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
         </div>

         {/* Top Right Controls */}
         <div className="absolute top-6 right-6 md:right-8 z-[60] flex gap-2">
            {/* Back to Camera Button (Mobile Only) */}
            <button 
                onClick={() => setActiveTab('camera')}
                className="md:hidden bg-white/80 backdrop-blur text-slate-700 shadow-md px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-slate-200"
            >
                <Camera size={16} />
                <span className="text-xs">New Photo</span>
            </button>

           {photos.length > 0 && (
             <button
               onClick={handleBatchDownload}
               disabled={isZipping}
               className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xl px-4 py-2 md:px-6 md:py-3 rounded-full font-bold flex items-center gap-2 md:gap-3 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
             >
                <Download size={16} className={isZipping ? 'animate-bounce' : ''} />
                <span className="text-xs md:text-sm">{isZipping ? '...' : 'Download All'}</span>
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono min-w-[20px] text-center">{photos.length}</span>
             </button>
           )}
         </div>

         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {photos.length === 0 && (
                <div className="text-slate-300/60 text-2xl md:text-4xl font-script text-center p-8 md:p-12 -rotate-2 select-none border-4 border-dashed border-slate-200 rounded-[3rem] mx-4">
                  Snap a photo to start...
                </div>
            )}
         </div>

         {/* Interactive Photos */}
         {photos.map(photo => (
           <DraggablePhoto 
             key={photo.id} 
             photo={photo} 
             onUpdatePosition={updatePhotoPosition}
             onUpdateScale={updatePhotoScale}
             onUpdateRotation={updatePhotoRotation}
             onDelete={deletePhoto}
             onSelect={bringToFront}
           />
         ))}
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      {/* Only visible on mobile (hidden on md) */}
      <div className="md:hidden absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-slate-200 z-[80] flex justify-around pb-safe safe-area-inset-bottom">
          <button 
             onClick={() => setActiveTab('camera')}
             className={`flex flex-col items-center justify-center py-3 px-6 transition-colors ${activeTab === 'camera' ? 'text-red-600' : 'text-slate-400'}`}
          >
             <Camera size={24} className={activeTab === 'camera' ? 'fill-current' : ''} />
             <span className="text-[10px] font-bold mt-1">Camera</span>
          </button>

          <button 
             onClick={() => setActiveTab('canvas')}
             className={`flex flex-col items-center justify-center py-3 px-6 transition-colors ${activeTab === 'canvas' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
             <div className="relative">
                <Images size={24} className={activeTab === 'canvas' ? 'fill-current' : ''} />
                {photos.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {photos.length}
                    </span>
                )}
             </div>
             <span className="text-[10px] font-bold mt-1">Photos</span>
          </button>
      </div>

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px]">
            <div key={countdown} className="text-[15rem] md:text-[20rem] font-bold text-[#b91c1c] drop-shadow-[0_8px_30px_rgba(255,255,255,0.8)] animate-in zoom-in fade-in duration-300 font-sans leading-none">
                {countdown}
            </div>
        </div>
      )}

      {/* FLASH OVERLAY */}
      <div 
        className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-300 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} 
      />

    </div>
  );
}
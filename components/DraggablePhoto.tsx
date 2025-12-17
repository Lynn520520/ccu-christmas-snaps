import React, { useRef, useState, useEffect } from 'react';
import { PhotoData } from '../types';
import { FrameDesign } from './FrameDesign';
import { X, RefreshCw, Download } from 'lucide-react';
import { generatePolaroidCanvas } from '../utils/polaroidGenerator';
import { saveFile } from '../utils/downloadUtils';

interface DraggablePhotoProps {
  photo: PhotoData;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateScale: (id: string, scale: number) => void;
  onUpdateRotation: (id: string, rotation: number) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export const DraggablePhoto: React.FC<DraggablePhotoProps> = ({
  photo,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
  onDelete,
  onSelect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isDeveloping, setIsDeveloping] = useState(true);
  const photoRef = useRef<HTMLDivElement>(null);

  // Interaction State for Rotate/Scale
  const [isTransforming, setIsTransforming] = useState(false);
  const startTransformRef = useRef({ x: 0, y: 0, startAngle: 0, startScale: 1 });

  useEffect(() => {
     // Trigger the developing effect for 3 seconds on mount
     const timer = setTimeout(() => {
       setIsDeveloping(false);
     }, 3000);
     return () => clearTimeout(timer);
  }, []);

  // --- Move Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // If touching the transform handle or controls, don't drag position
    if ((e.target as HTMLElement).closest('.transform-handle') || (e.target as HTMLElement).closest('.controls')) return;
    
    e.preventDefault();
    onSelect(photo.id);
    setIsActive(true);
    setIsDragging(true);
    
    setDragOffset({
      x: e.clientX - photo.x,
      y: e.clientY - photo.y
    });
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      onUpdatePosition(photo.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };


  // --- Rotate & Scale Logic (Gesture Handle) ---
  const handleTransformStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTransforming(true);
    setIsActive(true);
    onSelect(photo.id);

    const rect = photoRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Center of the photo
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate initial angle relative to center
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = Math.atan2(dy, dx); // radians

    startTransformRef.current = {
      x: centerX,
      y: centerY,
      startAngle: photo.rotation * (Math.PI / 180) - angle, // offset
      startScale: photo.scale, // base scale
    };

    // We store the initial distance to calculate scale ratio
    // Distance from center to pointer
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Store dist in a data attribute or temp ref if needed, 
    // but simpler to use proportional scaling based on width
    // Let's use specific distance logic:
    startTransformRef.current = {
      ...startTransformRef.current,
      // @ts-ignore - dynamic property
      startDist: dist,
      baseScale: photo.scale
    };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTransformMove = (e: React.PointerEvent) => {
    if (!isTransforming) return;

    const { x: centerX, y: centerY, startAngle, baseScale, startDist } = startTransformRef.current as any;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // 1. Calculate Rotation
    const currentAngle = Math.atan2(dy, dx);
    const rotationRad = currentAngle + startAngle; // Restore offset
    const rotationDeg = (rotationRad * 180) / Math.PI;

    // 2. Calculate Scale
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    const scaleRatio = currentDist / startDist;
    const newScale = Math.max(0.3, Math.min(3, baseScale * scaleRatio));

    onUpdateRotation(photo.id, rotationDeg);
    onUpdateScale(photo.id, newScale);
  };

  const handleTransformEnd = (e: React.PointerEvent) => {
    setIsTransforming(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };


  // Click outside listener to deactivate controls
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (photoRef.current && !photoRef.current.contains(e.target as Node)) {
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async () => {
    const canvas = await generatePolaroidCanvas(photo);
    // Use toBlob instead of toDataURL for better mobile sharing support
    canvas.toBlob((blob) => {
        if (blob) {
            const sanitizedName = photo.userName ? photo.userName.replace(/[^a-z0-9]/gi, '_') : 'Guest';
            // Added timestamp to filename to prevent conflicts
            const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
            saveFile(blob, `CCU-Polaroid-${sanitizedName}-${timestamp}.png`);
        }
    }, 'image/png');
  };

  return (
    <div
      ref={photoRef}
      className="absolute touch-none select-none"
      style={{
        transform: `translate(${photo.x}px, ${photo.y}px) rotate(${photo.rotation}deg) scale(${photo.scale})`,
        zIndex: photo.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: (isDragging || isTransforming) ? 'none' : 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={`relative transition-all duration-300 ${isActive ? 'shadow-2xl ring-4 ring-indigo-400/50 scale-[1.01]' : 'shadow-xl hover:shadow-2xl'}`}>
        
        <FrameDesign style={photo.frameStyle} userName={photo.userName} isDeveloping={isDeveloping}>
          <img 
            src={photo.dataUrl} 
            alt="Polaroid" 
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false} 
          />
        </FrameDesign>

        {/* --- Controls Overlay (Top) --- */}
        {isActive && (
          <div className="controls absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2 py-1.5 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
             
             {/* Delete */}
             <button 
               onClick={() => onDelete(photo.id)}
               className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
               title="Delete"
             >
               <X size={14} />
             </button>

             <div className="w-px h-4 bg-slate-200 mx-1"></div>

             {/* Download */}
             <button
               onClick={(e) => { e.stopPropagation(); handleDownload(); }}
               className="p-1.5 hover:bg-indigo-50 rounded-full text-indigo-600 transition-colors"
               title="Download"
             >
               <Download size={14} />
             </button>

          </div>
        )}

        {/* --- Gesture Handle (Bottom Right) --- */}
        {isActive && (
            <div 
                className="transform-handle absolute -bottom-5 -right-5 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center cursor-nwse-resize z-50 hover:scale-110 transition-transform active:bg-indigo-50"
                onPointerDown={handleTransformStart}
                onPointerMove={handleTransformMove}
                onPointerUp={handleTransformEnd}
            >
                <RefreshCw size={16} className="text-slate-600" />
            </div>
        )}

      </div>
    </div>
  );
}
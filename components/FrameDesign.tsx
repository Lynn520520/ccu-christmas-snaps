import React from 'react';
import { FrameStyle } from '../types';

interface FrameDesignProps {
  style: FrameStyle;
  children: React.ReactNode;
  userName?: string;
  className?: string;
  isDeveloping?: boolean;
}

export const FrameDesign: React.FC<FrameDesignProps> = ({ style, children, userName, className = '', isDeveloping = false }) => {
  const safeName = userName || 'Guest';

  // Base Frame Container Style
  const getContainerStyle = () => {
    switch (style) {
      case FrameStyle.SANTA:
        // Diagonal Pink/White Stripes
        return {
          background: 'repeating-linear-gradient(45deg, #ffe4e6, #ffe4e6 15px, #ffffff 15px, #ffffff 30px)',
          border: '4px solid #fca5a5' 
        };
      case FrameStyle.GINGERBREAD:
        // Cream background
        return {
          backgroundColor: '#fffbeb', // amber-50
          border: '4px solid #fcd34d' // amber-300
        };
      case FrameStyle.REINDEER:
        // Blue Gradient
        return {
          background: 'linear-gradient(to bottom, #dbeafe, #eff6ff)',
          border: '4px solid #bfdbfe'
        };
      default:
        return { backgroundColor: 'white' };
    }
  };

  const getTextColor = () => {
    switch (style) {
      case FrameStyle.SANTA: return '#b91c1c'; // Red-700
      case FrameStyle.GINGERBREAD: return '#15803d'; // Green-700
      case FrameStyle.REINDEER: return '#1e40af'; // Blue-800
      default: return '#000000';
    }
  };

  // Icons - Positioned relative to the PHOTO area now
  const renderDecorations = () => {
    // Icons inside the photo area need slightly smaller margins/text size adjustment if needed
    // Z-30 ensures they are above the developing overlay (Z-20)
    const iconClass = "absolute z-30 text-[3rem] leading-none select-none filter drop-shadow-md pointer-events-none";
    
    switch (style) {
      case FrameStyle.SANTA:
         return (
            <>
               <div className={`${iconClass} top-1 left-1 rotate-[-10deg]`}>🌿</div>
               <div className={`${iconClass} bottom-1 right-1 rotate-[15deg]`}>🔔</div>
            </>
         );
      case FrameStyle.GINGERBREAD:
         return (
            <>
               <div className={`${iconClass} top-1 right-1 rotate-[10deg]`}>🎄</div>
               <div className={`${iconClass} bottom-1 left-1 rotate-[-5deg]`}>🎁</div>
            </>
         );
      case FrameStyle.REINDEER:
          return (
             <>
                <div className={`${iconClass} top-1 left-1 text-blue-100/90`}>❄️</div>
                <div className={`${iconClass} bottom-1 right-1 text-blue-100/90 scale-75`}>❄️</div>
                {/* Removed the third smallest snowflake */}
                <div className={`${iconClass} top-1 right-1 rotate-[-10deg]`}>🦌</div>
             </>
          );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative w-[300px] h-[380px] shadow-2xl flex flex-col overflow-hidden ${className}`}
      style={getContainerStyle()}
    >
      {/* Dashed Border Overlay for Gingerbread Style */}
      {style === FrameStyle.GINGERBREAD && (
        <div className="absolute inset-2 border-[3px] border-dashed border-amber-500/50 pointer-events-none z-10 rounded-lg"></div>
      )}

      {/* 1. Header Name - Top Z-Index */}
      <div className="relative z-50 w-full pt-4 text-center pointer-events-none">
         <h2 
           className="font-noto font-bold text-3xl tracking-wide drop-shadow-sm px-8 break-words leading-tight"
           style={{ 
             color: getTextColor(),
             textShadow: '2px 2px 0px white' // White outline effect
           }}
         >
            {safeName}
         </h2>
      </div>

      {/* 2. Photo Area */}
      {/* Added margins to create the "frame" look. Decorations are NOW INSIDE THIS CONTAINER. */}
      {/* Use relative to position decorations inside. */}
      <div className="flex-1 relative mx-6 my-2 bg-white shadow-inner border-[4px] border-white overflow-hidden rounded-sm z-20">
         <div className="w-full h-full relative">
            {children}
            
            {/* Developing Effect Overlay (Z-20) */}
            <div 
                className="absolute inset-0 bg-white z-20 pointer-events-none transition-opacity duration-[3000ms] ease-in-out"
                style={{ opacity: isDeveloping ? 1 : 0 }}
            />

            {/* Decorations (Z-30) - Now inside the photo area */}
            {renderDecorations()}
         </div>
      </div>

      {/* 3. Footer Text - Top Z-Index */}
      <div className="relative z-50 w-full pb-3 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <h3 
            className="text-2xl font-bold font-noto tracking-tight"
            style={{ 
               color: getTextColor(),
               textShadow: '2px 2px 0px white'
            }}
          >
            Happy Holidays 2025
          </h3>
          <div className="flex flex-col items-center leading-none text-[9px] font-medium text-slate-500 font-sans">
             <p>Office of International Affairs,</p>
             <p>National Chung Cheng University</p>
          </div>
      </div>

    </div>
  );
};
import { FrameStyle, PhotoData } from '../types';

/**
 * Generates a high-quality HTMLCanvasElement representing the photo and its frame.
 * Matches the Reference Image styles (Stripes, Dashed, Gradient).
 */
export const generatePolaroidCanvas = (photo: PhotoData): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleFactor = 3; 
    const width = 300 * scaleFactor;
    const height = 380 * scaleFactor;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Common border line width
    const lineWidth = 4 * scaleFactor;
    const halfLineWidth = lineWidth / 2;

    // --- 1. Draw Background & Patterns ---
    
    // Background Color
    if (photo.frameStyle === FrameStyle.SANTA) {
       // White base
       ctx.fillStyle = '#ffffff';
       ctx.fillRect(0, 0, width, height);

       // Pink Stripes Pattern
       const stripeCanvas = document.createElement('canvas');
       stripeCanvas.width = 60;
       stripeCanvas.height = 60;
       const sCtx = stripeCanvas.getContext('2d');
       if (sCtx) {
           sCtx.fillStyle = '#ffffff';
           sCtx.fillRect(0,0,60,60);
           sCtx.fillStyle = '#ffe4e6'; // Pink-100
           // Draw diagonal stripe
           sCtx.beginPath();
           sCtx.moveTo(0, 60);
           sCtx.lineTo(30, 0);
           sCtx.lineTo(60, 0);
           sCtx.lineTo(30, 60);
           sCtx.closePath();
           sCtx.fill();
           // Wrap around corner
           sCtx.beginPath();
           sCtx.moveTo(0, 30);
           sCtx.lineTo(15, 0);
           sCtx.lineTo(0, 0);
           sCtx.closePath();
           sCtx.fill();
           sCtx.beginPath();
           sCtx.moveTo(45, 60);
           sCtx.lineTo(60, 30);
           sCtx.lineTo(60, 60);
           sCtx.closePath();
           sCtx.fill();
       }
       const pattern = ctx.createPattern(stripeCanvas, 'repeat');
       if (pattern) {
           ctx.fillStyle = pattern;
           ctx.fillRect(0, 0, width, height);
       }
       // Red Border (Inset to prevent clipping)
       ctx.strokeStyle = '#fca5a5';
       ctx.lineWidth = lineWidth;
       ctx.strokeRect(halfLineWidth, halfLineWidth, width - lineWidth, height - lineWidth);

    } else if (photo.frameStyle === FrameStyle.GINGERBREAD) {
        // Cream Background
        ctx.fillStyle = '#fffbeb';
        ctx.fillRect(0, 0, width, height);
        
        // Outer Border (Inset to prevent clipping)
        ctx.strokeStyle = '#fcd34d'; // Amber-300
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(halfLineWidth, halfLineWidth, width - lineWidth, height - lineWidth);

        // Dashed Inner Border
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'; // Amber-500/50
        ctx.lineWidth = 3 * scaleFactor;
        ctx.setLineDash([15, 15]);
        const inset = 8 * scaleFactor; // p-2 approx
        ctx.strokeRect(inset, inset, width - (inset*2), height - (inset*2));
        ctx.setLineDash([]); // Reset

    } else if (photo.frameStyle === FrameStyle.REINDEER) {
        // Blue Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#dbeafe'); // Blue-100
        grad.addColorStop(1, '#eff6ff'); // Blue-50
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Border (Inset to prevent clipping)
        ctx.strokeStyle = '#bfdbfe'; // Blue-200
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(halfLineWidth, halfLineWidth, width - lineWidth, height - lineWidth);
    }

    // --- 2. Draw Photo Area (Centered) ---
    // Drawing order: Background -> Photo -> Decorations -> Text (Topmost)
    
    // mx-6 my-2 equivalent
    const photoMarginX = 24 * scaleFactor;
    const topOffset = 85 * scaleFactor; // space for header
    const bottomSpace = 90 * scaleFactor; // space for footer
    
    const photoW = width - (photoMarginX * 2);
    const photoH = height - topOffset - bottomSpace; 
    const photoX = photoMarginX;
    const photoY = topOffset;

    // Draw White Border/Bg behind photo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        // Clipping region for photo
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoW, photoH);
        ctx.clip();

        // Draw Image (Cover Fit)
        const imgAspect = img.width / img.height;
        const areaAspect = photoW / photoH;
        let drawW, drawH, drawX, drawY;

        if (imgAspect > areaAspect) {
             drawH = photoH;
             drawW = photoH * imgAspect;
             drawX = photoX + (photoW - drawW) / 2;
             drawY = photoY;
        } else {
             drawW = photoW;
             drawH = photoW / imgAspect;
             drawX = photoX;
             drawY = photoY + (photoH - drawH) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
        
        // Inner white border for the photo area itself
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * scaleFactor;
        ctx.strokeRect(photoX, photoY, photoW, photoH);


        // --- 3. Draw Icons (Decorations) ---
        // Icons are drawn AFTER photo but BEFORE Text
        // ** MOVED TO CORNERS OF PHOTO **
        
        ctx.font = `${50 * scaleFactor}px serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        ctx.textBaseline = 'middle'; // Center vertically
        ctx.textAlign = 'center';    // Center horizontally
        
        const drawIcon = (char: string, x: number, y: number, angleDeg: number, sizeMult = 1, color: string | null = null) => {
             ctx.save();
             ctx.translate(x, y);
             ctx.rotate(angleDeg * Math.PI / 180);
             ctx.scale(sizeMult, sizeMult);
             if (color) ctx.fillStyle = color;
             ctx.fillText(char, 0, 0);
             ctx.restore();
        };

        // Padding inside the photo for icons
        const iconInnerMargin = 20 * scaleFactor; 

        if (photo.frameStyle === FrameStyle.SANTA) {
            // Top Left of photo
            drawIcon("🌿", photoX + iconInnerMargin, photoY + iconInnerMargin, -10); 
            // Bottom Right of photo
            drawIcon("🔔", photoX + photoW - iconInnerMargin, photoY + photoH - iconInnerMargin, 15); 
        } else if (photo.frameStyle === FrameStyle.GINGERBREAD) {
            // Top Right of photo
            drawIcon("🎄", photoX + photoW - iconInnerMargin, photoY + iconInnerMargin, 10); 
            // Bottom Left of photo
            drawIcon("🎁", photoX + iconInnerMargin, photoY + photoH - iconInnerMargin, -5); 
        } else if (photo.frameStyle === FrameStyle.REINDEER) {
             // Top Right of photo
             drawIcon("🦌", photoX + photoW - iconInnerMargin, photoY + iconInnerMargin, -10);
             
             // Snowflakes (Overlaying photo corners)
             // Top Left
             drawIcon("❄️", photoX + iconInnerMargin, photoY + iconInnerMargin, 0, 1, 'rgba(219, 234, 254, 0.9)'); 
             // Bottom Right (Small)
             drawIcon("❄️", photoX + photoW - iconInnerMargin, photoY + photoH - iconInnerMargin, 0, 0.75, 'rgba(219, 234, 254, 0.9)'); 
             // Removed the middle one
        }

        // --- 4. Draw Text (Topmost Layer) ---
        
        let textColor = '#000000';
        if (photo.frameStyle === FrameStyle.SANTA) textColor = '#b91c1c';
        if (photo.frameStyle === FrameStyle.GINGERBREAD) textColor = '#15803d';
        if (photo.frameStyle === FrameStyle.REINDEER) textColor = '#1e40af';

        // 4.1 Header Name (With Wrap support)
        const safeName = photo.userName || 'Guest';
        ctx.font = `700 ${32 * scaleFactor}px "Noto Sans TC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'transparent'; // Reset shadow for text stroke
        
        // Styles
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = 5 * scaleFactor;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = textColor;

        // Wrap Logic
        const maxTextWidth = width - (40 * scaleFactor); // 20px padding each side
        const words = safeName.split(' ');
        let line = '';
        const lines = [];

        // If simple split by space, build lines
        for (let n = 0; n < words.length; n++) {
           const testLine = line + words[n] + ' ';
           const metrics = ctx.measureText(testLine);
           const testWidth = metrics.width;
           if (testWidth > maxTextWidth && n > 0) {
             lines.push(line);
             line = words[n] + ' ';
           } else {
             line = testLine;
           }
        }
        lines.push(line);

        // If no spaces but text is super long (e.g. CJK or long word), we might need force breaking,
        // but simple canvas doesn't easily support char-breaking without complex logic.
        // For CJK mixed with spaces, the above works "okay".
        // To support long CJK strings without spaces, we need to split by char if width exceeds.
        // Let's refine for "long name without spaces":
        if (lines.length === 1 && ctx.measureText(lines[0]).width > maxTextWidth) {
           // Reset and split by character
           const chars = safeName.split('');
           line = '';
           lines.length = 0;
           for(let n = 0; n < chars.length; n++) {
              const testLine = line + chars[n];
              if (ctx.measureText(testLine).width > maxTextWidth && n > 0) {
                 lines.push(line);
                 line = chars[n];
              } else {
                 line = testLine;
              }
           }
           lines.push(line);
        }

        // Draw Lines
        const lineHeight = 38 * scaleFactor;
        // Start Y - if multiple lines, we might need to adjust start slightly up or down.
        // Center is 45 * scaleFactor.
        const totalTextHeight = lines.length * lineHeight;
        // Vertically center the block of text around the 45 mark
        const startY = (45 * scaleFactor) - ((totalTextHeight - lineHeight) / 2);

        lines.forEach((l, i) => {
            const y = startY + (i * lineHeight);
            ctx.strokeText(l, width / 2, y);
            ctx.fillText(l, width / 2, y);
        });


        // 4.2 Footer Text
        const footerCenterY = height - (50 * scaleFactor);
        ctx.font = `700 ${24 * scaleFactor}px "Noto Sans TC", sans-serif`;
        
        // Stroke
        ctx.strokeText("Happy Holidays 2025", width/2, footerCenterY);
        
        // Fill
        ctx.fillText("Happy Holidays 2025", width/2, footerCenterY);

        // 4.3 Subtitles
        ctx.font = `500 ${10 * scaleFactor}px "Inter", sans-serif`;
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.lineWidth = 0; // no stroke
        ctx.fillText("Office of International Affairs,", width/2, height - (25 * scaleFactor));
        ctx.fillText("National Chung Cheng University", width/2, height - (12 * scaleFactor));

        resolve(canvas);
    };
    img.onerror = (e) => reject(e);
    img.src = photo.dataUrl;
  });
};
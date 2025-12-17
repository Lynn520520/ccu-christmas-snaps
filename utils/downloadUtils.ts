/**
 * Handles file saving with support for Mobile (Web Share API) and Desktop (Anchor download).
 */
export const saveFile = async (blob: Blob, filename: string) => {
  // Simple check for mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Cast navigator to any to avoid TypeScript build errors with experimental APIs
  const nav = navigator as any;

  // Try Web Share API first if on mobile (allows saving directly to Camera Roll on iOS)
  // Note: navigator.canShare requires a File object, not just a Blob.
  if (isMobile && nav.share && nav.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      
      // Check if the device can actually share this file
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: 'Christmas Snaps CCU',
          text: 'Here is my photo from CCU OIA Christmas Snaps!',
        });
        return; // Success, stop here
      }
    } catch (err) {
      // If user cancels the share sheet (AbortError), or share fails, we fall back to standard download
      if ((err as any).name !== 'AbortError') {
        console.warn('Web Share API failed, falling back to download link:', err);
      } else {
        return; // User cancelled, do nothing
      }
    }
  }

  // Fallback: Standard Download Link (Desktop or unsupported mobile)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
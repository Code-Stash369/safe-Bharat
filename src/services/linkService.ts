/**
 * Safe External Navigation Utility for Safe Bharat
 * Safely triggers external links (WhatsApp, Maps, Helplines) without window.open popup blocks
 */
export const openExternalLink = (url: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    window.location.href = url;
  }
};

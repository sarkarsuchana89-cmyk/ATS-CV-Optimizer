/**
 * Triggers clean browser print optimized for ATS Resume PDF export
 */
export function triggerPrintPdf(candidateName = 'Candidate') {
  const cleanName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const prevTitle = document.title;
  
  // Set window title to desired filename during print dialog
  document.title = `${cleanName}_ATS_Tailored_Resume`;
  
  window.print();
  
  // Restore title
  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
}

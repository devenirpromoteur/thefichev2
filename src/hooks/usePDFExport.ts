import { useCallback } from 'react';
import html2pdf from 'html2pdf.js';

interface PDFOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number | [number, number, number, number];
  quality?: number;
}

export const usePDFExport = () => {
  const generatePDF = useCallback(async (
    elementId: string, 
    options: PDFOptions = {}
  ) => {
    const {
      filename = 'synthese-projet.pdf',
      format = 'a4',
      orientation = 'portrait',
      margin = 10,
      quality = 1
    } = options;

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Add print-optimized styles temporarily
    const originalClasses = element.className;
    element.className += ' synthesis-page';

    const opt = {
      margin,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: quality,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format,
        orientation,
        compressPDF: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      // Restore original classes
      element.className = originalClasses;
    }
  }, []);

  const generatePreview = useCallback(async (
    elementId: string,
    options: PDFOptions = {}
  ): Promise<string> => {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const originalClasses = element.className;
    element.className += ' synthesis-page';

    const opt = {
      margin: options.margin || 10,
      image: { type: 'jpeg', quality: 0.8 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        allowTaint: true 
      },
      jsPDF: { 
        unit: 'mm', 
        format: options.format || 'a4',
        orientation: options.orientation || 'portrait'
      }
    };

    try {
      const pdf = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      return pdf;
    } finally {
      element.className = originalClasses;
    }
  }, []);

  return { generatePDF, generatePreview };
};
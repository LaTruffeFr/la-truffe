import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (containerId: string, fileName: string) => {
  const sourceContainer = document.getElementById(containerId);
  if (!sourceContainer) return false;

  const sections = sourceContainer.querySelectorAll('.pdf-section');
  if (sections.length === 0) {
    console.error("Aucune section .pdf-section trouvée");
    return false;
  }

  // Configuration A4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 10;
  const contentWidth = pdfWidth - (margin * 2);

  // ON AUGMENTE ICI : 1200px pour "dézoomer" et avoir un texte plus fin
  const VIRTUAL_WIDTH = 1200; 

  // Conteneur temporaire caché
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '0';
  tempContainer.style.width = `${VIRTUAL_WIDTH}px`;
  tempContainer.style.backgroundColor = '#F8F9FA'; 
  // Classe utilisée pour appliquer des styles spécifiques au rendu PDF
  tempContainer.className = 'pdf-export';
  document.body.appendChild(tempContainer);

  let currentY = margin;
  const pageContentHeightMm = pdfHeight - margin * 2;

  // Attendre le chargement des polices (sinon html2canvas peut rendre avec une fallback → texte décalé)
  try {
    const fonts = (document as any).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    // noop
  }

  try {
    for (let i = 0; i < sections.length; i++) {
      const originalSection = sections[i] as HTMLElement;
      const clonedSection = originalSection.cloneNode(true) as HTMLElement;

      clonedSection.style.width = '100%'; 
      clonedSection.style.margin = '0';
      clonedSection.style.padding = '0'; 
      clonedSection.style.maxWidth = 'none';
      
      const elementsWithShadow = clonedSection.querySelectorAll('*');
      elementsWithShadow.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.boxShadow = 'none';
          el.style.transition = 'none';
          el.style.animation = 'none';
          if (el.classList.contains('border')) el.style.border = '1px solid #d1d5db';
        }
      });

      tempContainer.innerHTML = '';
      tempContainer.appendChild(clonedSection);

      const canvas = await html2canvas(tempContainer, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#F8F9FA',
        width: VIRTUAL_WIDTH,
        windowWidth: VIRTUAL_WIDTH,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      
      // Ratio respecté
      const imgHeightPx = canvas.height;
      const imgWidthPx = canvas.width;
      const ratio = contentWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * ratio;

      // Si une section est plus haute qu'une page, on la découpe en tranches
      if (imgHeightMm > pageContentHeightMm) {
        const pageContentHeightPx = Math.floor(pageContentHeightMm / ratio);
        let yPx = 0;

        while (yPx < canvas.height) {
          const sliceHeightPx = Math.min(pageContentHeightPx, canvas.height - yPx);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeightPx;

          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              yPx,
              canvas.width,
              sliceHeightPx,
              0,
              0,
              canvas.width,
              sliceHeightPx
            );
          }

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.90);
          const sliceHeightMm = sliceHeightPx * ratio;

          if (currentY + sliceHeightMm > pdfHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.addImage(sliceImgData, 'JPEG', margin, currentY, contentWidth, sliceHeightMm);
          currentY += sliceHeightMm + 5;
          yPx += sliceHeightPx;
        }
      } else {
        // Saut de page
        if (currentY + imgHeightMm > pdfHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, imgHeightMm);
        currentY += imgHeightMm + 5;
      }
    }

    document.body.removeChild(tempContainer);
    pdf.save(`${fileName}.pdf`);
    return true;

  } catch (error) {
    console.error("Erreur PDF:", error);
    if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
    return false;
  }
};
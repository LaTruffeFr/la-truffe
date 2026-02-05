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

  // LARGEUR FIXE pour forcer le rendu "desktop" (évite le responsive)
  const VIRTUAL_WIDTH = 1200;

  // 1. SAUVEGARDER LES STYLES ORIGINAUX DU CONTENEUR SOURCE
  const originalStyles = {
    width: sourceContainer.style.width,
    maxWidth: sourceContainer.style.maxWidth,
    position: sourceContainer.style.position,
    top: sourceContainer.style.top,
    left: sourceContainer.style.left,
    zIndex: sourceContainer.style.zIndex,
    transform: sourceContainer.style.transform,
  };

  // 2. FORCER LE MODE "GRAND ÉCRAN RIGIDE" SUR LE CONTENEUR SOURCE
  sourceContainer.style.width = `${VIRTUAL_WIDTH}px`;
  sourceContainer.style.maxWidth = `${VIRTUAL_WIDTH}px`;
  sourceContainer.style.position = 'fixed';
  sourceContainer.style.top = '-9999px';
  sourceContainer.style.left = '0';
  sourceContainer.style.zIndex = '-1000';

  // 3. Conteneur temporaire caché (on clone dedans)
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '0';
  tempContainer.style.width = `${VIRTUAL_WIDTH}px`;
  tempContainer.style.backgroundColor = '#FFFFFF';
  tempContainer.className = 'pdf-export';
  document.body.appendChild(tempContainer);

  let currentY = margin;
  const pageContentHeightMm = pdfHeight - margin * 2;

  // 4. Attendre le chargement des polices
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

      clonedSection.style.width = `${VIRTUAL_WIDTH}px`;
      clonedSection.style.margin = '0';
      clonedSection.style.padding = '16px';
      clonedSection.style.maxWidth = 'none';
      clonedSection.style.backgroundColor = '#FFFFFF';
      
      // Nettoyer les éléments pour le PDF
      const elementsWithShadow = clonedSection.querySelectorAll('*');
      elementsWithShadow.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.boxShadow = 'none';
          el.style.transition = 'none';
          el.style.animation = 'none';
          
          // Masquer les éléments non imprimables
          if (el.classList.contains('no-print') || 
              el.classList.contains('pdf-hide') ||
              el.classList.contains('print:hidden')) {
            el.style.display = 'none';
          }

          // Forcer le fond blanc sur les cartes
          if (el.classList.contains('negotiation-card') ||
              el.tagName === 'CARD' ||
              el.classList.contains('bg-slate-900') ||
              el.classList.contains('bg-black')) {
            el.style.backgroundColor = '#FFFFFF';
            el.style.color = '#000000';
          }

          // Corriger les images
          if (el.tagName === 'IMG') {
            el.style.objectFit = 'contain';
            el.style.maxHeight = '300px';
            el.style.width = 'auto';
            el.style.margin = '0 auto';
          }
        }
      });

      tempContainer.innerHTML = '';
      tempContainer.appendChild(clonedSection);

      // Petit délai pour que le DOM se mette à jour
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: VIRTUAL_WIDTH,
        windowWidth: VIRTUAL_WIDTH,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
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
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
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

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
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

    // 5. RESTAURER LES STYLES ORIGINAUX
    sourceContainer.style.width = originalStyles.width;
    sourceContainer.style.maxWidth = originalStyles.maxWidth;
    sourceContainer.style.position = originalStyles.position;
    sourceContainer.style.top = originalStyles.top;
    sourceContainer.style.left = originalStyles.left;
    sourceContainer.style.zIndex = originalStyles.zIndex;
    sourceContainer.style.transform = originalStyles.transform;

    pdf.save(`${fileName}.pdf`);
    return true;

  } catch (error) {
    console.error("Erreur PDF:", error);
    if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
    
    // Restaurer même en cas d'erreur
    sourceContainer.style.width = originalStyles.width;
    sourceContainer.style.maxWidth = originalStyles.maxWidth;
    sourceContainer.style.position = originalStyles.position;
    sourceContainer.style.top = originalStyles.top;
    sourceContainer.style.left = originalStyles.left;
    sourceContainer.style.zIndex = originalStyles.zIndex;
    sourceContainer.style.transform = originalStyles.transform;

    return false;
  }
};
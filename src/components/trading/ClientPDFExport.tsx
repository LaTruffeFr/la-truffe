import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Filters } from '@/contexts/VehicleDataContext';

interface ClientPDFExportProps {
  opportunities: Array<VehicleWithScore & { expectedPrice: number; deviation: number; deviationPercent: number }>;
  filters: Filters;
  totalAnalyzed: number;
}

function formatCurrency(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}

function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function cleanModelName(model: string): string {
  if (!model || model === 'Inconnu') return '';
  return model
    .replace(/GOLE|GOLF(?!$)/gi, 'Golf')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9\s-]+$/, '')
    .trim() || model;
}

function calculateDealScore(deviationPercent: number): number {
  const score = Math.min(10, 5 + (deviationPercent / 3));
  return Math.round(score * 10) / 10;
}

export function ClientPDFExport({ opportunities, filters, totalAnalyzed }: ClientPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateClientPDF = async () => {
    if (opportunities.length === 0) {
      toast.error('Aucune opportunité à exporter');
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 15;

      // Colors - Premium dark theme
      const goldColor: [number, number, number] = [212, 175, 55];
      const greenColor: [number, number, number] = [34, 197, 94];
      const darkBg: [number, number, number] = [18, 18, 20];
      const cardBg: [number, number, number] = [30, 30, 35];
      const textColor: [number, number, number] = [250, 250, 250];
      const mutedColor: [number, number, number] = [140, 140, 150];

      // Full page dark background
      pdf.setFillColor(...darkBg);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // === HEADER SECTION ===
      // Gold accent line
      pdf.setFillColor(...goldColor);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      // Logo placeholder circle with gold border
      pdf.setDrawColor(...goldColor);
      pdf.setLineWidth(1.5);
      pdf.circle(pageWidth / 2, y + 18, 12, 'S');
      
      // "LT" initials in circle
      pdf.setTextColor(...goldColor);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LT', pageWidth / 2, y + 21, { align: 'center' });

      y += 38;

      // Brand name
      pdf.setFontSize(24);
      pdf.setTextColor(...goldColor);
      pdf.text('LA TRUFFE', pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      
      // Tagline
      pdf.setFontSize(10);
      pdf.setTextColor(...mutedColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Votre Expert en Opportunités Automobiles', pageWidth / 2, y, { align: 'center' });

      y += 15;

      // === TITLE SECTION ===
      // Gold bordered box for title
      pdf.setDrawColor(...goldColor);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, 22, 3, 3, 'S');
      
      pdf.setFillColor(goldColor[0], goldColor[1], goldColor[2], 0.1);
      pdf.setFillColor(35, 32, 25);
      pdf.roundedRect(margin + 0.5, y + 0.5, pageWidth - 2 * margin - 1, 21, 2.5, 2.5, 'F');

      pdf.setTextColor(...goldColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SÉLECTION PREMIUM', pageWidth / 2, y + 10, { align: 'center' });
      
      pdf.setTextColor(...textColor);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Les meilleures opportunités du marché', pageWidth / 2, y + 17, { align: 'center' });

      y += 30;

      // === FILTERS SUMMARY ===
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'F');
      
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(8);
      const filterText = `Budget: ${formatCurrency(filters.minPrice)} - ${formatCurrency(filters.maxPrice)}  •  Kilométrage: ${formatNumber(filters.minKm)} - ${formatNumber(filters.maxKm)} km  •  ${totalAnalyzed} véhicules analysés`;
      pdf.text(filterText, pageWidth / 2, y + 11, { align: 'center' });

      y += 25;

      // === OPPORTUNITIES CARDS ===
      opportunities.forEach((vehicle, index) => {
        // Check if we need a new page
        if (y + 55 > pageHeight - 20) {
          pdf.addPage();
          pdf.setFillColor(...darkBg);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          y = 15;
        }

        // Card background
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(margin, y, pageWidth - 2 * margin, 50, 3, 3, 'F');

        // Rank badge (gold circle)
        pdf.setFillColor(...goldColor);
        pdf.circle(margin + 12, y + 12, 8, 'F');
        pdf.setTextColor(...darkBg);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`#${index + 1}`, margin + 12, y + 15, { align: 'center' });

        // Vehicle title
        const cleanedModel = cleanModelName(vehicle.modele);
        const vehicleTitle = `${cleanedModel} ${vehicle.annee || ''}`.trim();
        
        pdf.setTextColor(...textColor);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(vehicleTitle, margin + 28, y + 14);

        // Brand and specs
        pdf.setTextColor(...mutedColor);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${vehicle.marque} • ${formatNumber(vehicle.kilometrage)} km`, margin + 28, y + 22);

        // Price section
        // Market price (strikethrough effect)
        pdf.setTextColor(...mutedColor);
        pdf.setFontSize(10);
        pdf.text('Prix Marché :', margin + 10, y + 33);
        
        const marketPriceText = formatCurrency(vehicle.expectedPrice);
        pdf.text(marketPriceText, margin + 42, y + 33);
        // Strikethrough line
        const marketPriceWidth = pdf.getTextWidth(marketPriceText);
        pdf.setDrawColor(...mutedColor);
        pdf.setLineWidth(0.3);
        pdf.line(margin + 42, y + 31, margin + 42 + marketPriceWidth, y + 31);

        // Actual price (big green)
        pdf.setTextColor(...greenColor);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Prix Annonce :', margin + 10, y + 42);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(vehicle.prix), margin + 45, y + 42);

        // Right side - Score and savings
        const rightX = pageWidth - margin - 45;
        
        // Score box
        pdf.setFillColor(50, 45, 35);
        pdf.roundedRect(rightX, y + 5, 40, 20, 2, 2, 'F');
        
        pdf.setTextColor(...goldColor);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SCORE LA TRUFFE', rightX + 20, y + 12, { align: 'center' });
        
        const dealScore = calculateDealScore(vehicle.deviationPercent);
        pdf.setFontSize(12);
        pdf.text(`${dealScore}/10`, rightX + 20, y + 21, { align: 'center' });

        // Savings badge
        pdf.setFillColor(...greenColor);
        pdf.roundedRect(rightX, y + 28, 40, 16, 2, 2, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text('ÉCONOMIE', rightX + 20, y + 35, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(vehicle.deviation), rightX + 20, y + 42, { align: 'center' });

        y += 55;
      });

      // === FOOTER ===
      // Add some space before footer
      y = pageHeight - 25;
      
      // Footer line
      pdf.setDrawColor(...goldColor);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y - 5, pageWidth - margin, y - 5);

      // Footer text
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      pdf.text(`Document généré le ${dateStr}`, margin, y + 2);
      
      pdf.setTextColor(...goldColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LA TRUFFE', pageWidth / 2, y + 2, { align: 'center' });
      
      pdf.setTextColor(...mutedColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('www.la-truffe.fr', pageWidth - margin, y + 2, { align: 'right' });

      pdf.setFontSize(7);
      pdf.text('Analyse basée sur les données du marché • Prix indicatifs', pageWidth / 2, y + 8, { align: 'center' });

      // Download
      const filename = `selection-la-truffe-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast.success('PDF client téléchargé !');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="gold" 
      onClick={generateClientPDF}
      disabled={isGenerating || opportunities.length === 0}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Télécharger PDF
    </Button>
  );
}

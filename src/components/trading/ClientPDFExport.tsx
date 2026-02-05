import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface FilterState {
  minPrice: number;
  maxPrice: number;
  minKm: number;
  maxKm: number;
  minYear: number;
  maxYear: number;
}

interface ClientPDFExportProps {
  opportunities: Array<VehicleWithScore & { expectedPrice: number; deviation: number; deviationPercent: number }>;
  filters: FilterState;
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
      const margin = 20;
      let y = 20;

      // Colors - Professional Light Theme
      const primaryBlue: [number, number, number] = [37, 99, 235]; // #2563EB
      const darkText: [number, number, number] = [0, 0, 0]; // #000000
      const mutedGray: [number, number, number] = [107, 114, 128]; // #6B7280
      const lightGray: [number, number, number] = [243, 244, 246]; // #F3F4F6
      const successGreen: [number, number, number] = [16, 185, 129]; // #10B981
      const white: [number, number, number] = [255, 255, 255];

      // === HEADER SECTION ===
      // Logo placeholder (blue shield)
      pdf.setFillColor(...primaryBlue);
      pdf.roundedRect(margin, y, 15, 15, 2, 2, 'F');
      pdf.setTextColor(...white);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LT', margin + 7.5, y + 10, { align: 'center' });

      // Title
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text("RAPPORT D'ÉVALUATION DE MARCHÉ", pageWidth - margin, y + 6, { align: 'right' });
      
      // Subtitle with date
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const vehicleModel = opportunities[0] ? `${opportunities[0].marque} ${cleanModelName(opportunities[0].modele)}` : 'Analyse';
      
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Dossier généré le ${dateStr} pour ${vehicleModel}`, pageWidth - margin, y + 12, { align: 'right' });

      y += 22;

      // Separator line
      pdf.setDrawColor(...primaryBlue);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 15;

      // === SECTION 1: SYNTHÈSE ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SYNTHÈSE', margin, y);

      y += 10;

      // Calculate summary stats
      const avgMarketPrice = opportunities.reduce((sum, v) => sum + v.expectedPrice, 0) / opportunities.length;
      const avgActualPrice = opportunities.reduce((sum, v) => sum + v.prix, 0) / opportunities.length;
      const avgSavings = avgMarketPrice - avgActualPrice;
      const avgScore = opportunities.reduce((sum, v) => sum + calculateDealScore(v.deviationPercent), 0) / opportunities.length;

      // 4 KPI boxes
      const boxWidth = (pageWidth - 2 * margin - 15) / 4;
      const boxHeight = 25;

      const kpis = [
        { label: 'Prix Marché Moyen', value: formatCurrency(avgMarketPrice) },
        { label: 'Prix La Truffe', value: formatCurrency(avgActualPrice) },
        { label: 'Économie Potentielle', value: formatCurrency(avgSavings), highlight: true },
        { label: 'Score Fiabilité', value: `${avgScore.toFixed(1)}/10` },
      ];

      kpis.forEach((kpi, index) => {
        const x = margin + index * (boxWidth + 5);
        
        // Box border
        pdf.setDrawColor(...lightGray);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

        // Label
        pdf.setTextColor(...mutedGray);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, x + boxWidth / 2, y + 8, { align: 'center' });

        // Value
        if (kpi.highlight) {
          pdf.setTextColor(...successGreen);
        } else {
          pdf.setTextColor(...darkText);
        }
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value, x + boxWidth / 2, y + 18, { align: 'center' });
      });

      y += boxHeight + 15;

      // === SECTION 2: POSITIONNEMENT PRIX (Gauge visualization) ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POSITIONNEMENT PRIX', margin, y);

      y += 10;

      // Simple gauge representation
      const gaugeWidth = 80;
      const gaugeHeight = 10;
      const gaugeX = margin;
      
      // Background gradient representation (red to green)
      const segments = 10;
      const segmentWidth = gaugeWidth / segments;
      for (let i = 0; i < segments; i++) {
        const r = Math.round(239 - (i / segments) * 200);
        const g = Math.round(68 + (i / segments) * 120);
        const b = Math.round(68 - (i / segments) * 30);
        pdf.setFillColor(r, g, b);
        pdf.rect(gaugeX + i * segmentWidth, y, segmentWidth + 0.5, gaugeHeight, 'F');
      }

      // Position indicator
      const savingsPercent = (avgSavings / avgMarketPrice) * 100;
      const indicatorPos = Math.min(90, Math.max(10, 50 + savingsPercent * 2));
      const indicatorX = gaugeX + (indicatorPos / 100) * gaugeWidth;
      
      pdf.setFillColor(...darkText);
      pdf.triangle(indicatorX, y - 2, indicatorX - 3, y - 6, indicatorX + 3, y - 6, 'F');

      // Labels
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(7);
      pdf.text('CHER', gaugeX, y + gaugeHeight + 5);
      pdf.text('AFFAIRE', gaugeX + gaugeWidth, y + gaugeHeight + 5, { align: 'right' });

      // Savings display next to gauge
      pdf.setTextColor(...successGreen);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(avgSavings), gaugeX + gaugeWidth + 20, y + 7);
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text("d'économie moyenne", gaugeX + gaugeWidth + 20, y + 13);

      y += gaugeHeight + 25;

      // === SECTION 3: LISTE DES OPPORTUNITÉS ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LISTE DES OPPORTUNITÉS', margin, y);

      y += 8;

      // Table header
      const colWidths = {
        rank: 10,
        model: 55,
        km: 30,
        marketPrice: 30,
        price: 30,
        savings: 25,
      };
      
      const tableWidth = colWidths.rank + colWidths.model + colWidths.km + colWidths.marketPrice + colWidths.price + colWidths.savings;

      // Header row
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, y, tableWidth, 8, 'F');
      
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      
      let colX = margin + 2;
      pdf.text('#', colX, y + 5.5);
      colX += colWidths.rank;
      pdf.text('Modèle', colX, y + 5.5);
      colX += colWidths.model;
      pdf.text('Km', colX, y + 5.5);
      colX += colWidths.km;
      pdf.text('Prix Marché', colX, y + 5.5);
      colX += colWidths.marketPrice;
      pdf.text('Prix Annonce', colX, y + 5.5);
      colX += colWidths.price;
      pdf.text('Gain', colX, y + 5.5);

      y += 8;

      // Table rows
      opportunities.forEach((vehicle, index) => {
        // Check if we need a new page
        if (y + 10 > pageHeight - 30) {
          pdf.addPage();
          y = 20;
          
          // Re-add header
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, y, tableWidth, 8, 'F');
          pdf.setTextColor(...mutedGray);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          
          colX = margin + 2;
          pdf.text('#', colX, y + 5.5);
          colX += colWidths.rank;
          pdf.text('Modèle', colX, y + 5.5);
           colX += colWidths.model;
           pdf.text('Km', colX, y + 5.5);
           colX += colWidths.km;
           pdf.text('Prix Marché', colX, y + 5.5);
           colX += colWidths.marketPrice;
           pdf.text('Prix Annonce', colX, y + 5.5);
           colX += colWidths.price;
          pdf.text('Gain', colX, y + 5.5);
          y += 8;
        }

        // Alternating row background
        if (index % 2 === 1) {
          pdf.setFillColor(250, 250, 252);
          pdf.rect(margin, y, tableWidth, 8, 'F');
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        
        colX = margin + 2;
        
        // Rank
        pdf.setTextColor(...darkText);
        pdf.text(`${index + 1}`, colX, y + 5.5);
        colX += colWidths.rank;
        
        // Model
        const modelName = `${vehicle.marque} ${cleanModelName(vehicle.modele)} ${vehicle.annee || ''}`.substring(0, 35);
        pdf.text(modelName, colX, y + 5.5);
        colX += colWidths.model;
        
        // Km
        pdf.setTextColor(...mutedGray);
        pdf.text(`${formatNumber(vehicle.kilometrage)} km`, colX, y + 5.5);
        colX += colWidths.km;
        
        // Market Price
        pdf.setTextColor(...mutedGray);
        pdf.text(formatCurrency(vehicle.expectedPrice), colX, y + 5.5);
        colX += colWidths.marketPrice;
        
        // Actual Price
        pdf.setTextColor(...darkText);
        pdf.text(formatCurrency(vehicle.prix), colX, y + 5.5);
        colX += colWidths.price;
        
        // Savings (green bold)
        pdf.setTextColor(...successGreen);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(vehicle.deviation), colX, y + 5.5);

        y += 8;
      });

      // === FOOTER ===
      y = pageHeight - 15;
      
      // Footer separator
      pdf.setDrawColor(...lightGray);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y - 5, pageWidth - margin, y - 5);

      // Footer text
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Document certifié par l'algorithme La Truffe. Ne constitue pas une garantie mécanique.", margin, y);
      
      // Page number
      pdf.text(`Page 1/${pdf.getNumberOfPages()}`, pageWidth - margin, y, { align: 'right' });

      // Download
      const filename = `rapport-la-truffe-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast.success('PDF téléchargé avec succès !');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
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

import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface MarketReportGeneratorProps {
  vehicles: VehicleWithScore[];
  trendLine: { slope: number; intercept: number };
  kpis: {
    avgPrice: number;
    decotePer10k: number;
    bestOffer: VehicleWithScore | null;
    opportunitiesCount: number;
  };
}

function formatCurrency(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}

function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function cleanModelName(model: string): string {
  if (!model || model === 'Inconnu') return '';
  const cleaned = model
    .replace(/GOLE|GOLF(?!$)/gi, 'Golf')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9\s-]+$/, '')
    .trim();
  return cleaned || model;
}

export function MarketReportGenerator({ vehicles, trendLine, kpis }: MarketReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);

    try {
      const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
      const kms = vehicles.map(v => v.kilometrage).sort((a, b) => a - b);
      
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      const minKm = kms[0];
      const maxKm = kms[kms.length - 1];
      const avgKm = Math.round(kms.reduce((a, b) => a + b, 0) / kms.length);

      const brandCounts: Record<string, number> = {};
      const modelCounts: Record<string, number> = {};
      vehicles.forEach(v => {
        brandCounts[v.marque] = (brandCounts[v.marque] || 0) + 1;
        const cleanedModel = cleanModelName(v.modele);
        if (cleanedModel) {
          modelCounts[cleanedModel] = (modelCounts[cleanedModel] || 0) + 1;
        }
      });
      const mainBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const mainModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      const allWithExpected = vehicles.map(v => ({
        ...v,
        expectedPrice: trendLine.slope * v.kilometrage + trendLine.intercept,
        savings: (trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix,
        savingsPercent: ((trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix) / (trendLine.slope * v.kilometrage + trendLine.intercept) * 100,
      }));
      
      const opportunities = allWithExpected
        .filter(v => v.savingsPercent >= 15)
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5);
      
      const opportunitiesCount = allWithExpected.filter(v => v.savingsPercent >= 15).length;

      // Create PDF - Professional Light Theme
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      // Colors - Professional Light Theme
      const primaryBlue: [number, number, number] = [37, 99, 235];
      const darkText: [number, number, number] = [0, 0, 0];
      const mutedGray: [number, number, number] = [107, 114, 128];
      const lightGray: [number, number, number] = [243, 244, 246];
      const successGreen: [number, number, number] = [16, 185, 129];

      // === HEADER ===
      // Logo placeholder (blue shield)
      pdf.setFillColor(...primaryBlue);
      pdf.roundedRect(margin, y, 15, 15, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LT', margin + 7.5, y + 10, { align: 'center' });

      // Title
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text("RAPPORT D'ANALYSE DE MARCHÉ", pageWidth - margin, y + 6, { align: 'right' });
      
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const vehicleTitle = mainModel ? `${mainBrand} ${mainModel}` : mainBrand;
      
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Dossier généré le ${dateStr} pour ${vehicleTitle}`, pageWidth - margin, y + 12, { align: 'right' });

      y += 22;

      // Separator
      pdf.setDrawColor(...primaryBlue);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 15;

      // === SYNTHÈSE ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SYNTHÈSE', margin, y);

      y += 10;

      const boxWidth = (pageWidth - 2 * margin - 15) / 4;
      const boxHeight = 25;

      const kpisData = [
        { label: 'Véhicules Analysés', value: vehicles.length.toString() },
        { label: 'Prix Moyen', value: formatCurrency(kpis.avgPrice) },
        { label: 'Opportunités', value: opportunitiesCount.toString(), highlight: true },
        { label: 'Décote/10k km', value: formatCurrency(kpis.decotePer10k) },
      ];

      kpisData.forEach((kpi, index) => {
        const x = margin + index * (boxWidth + 5);
        
        pdf.setDrawColor(...lightGray);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

        pdf.setTextColor(...mutedGray);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, x + boxWidth / 2, y + 8, { align: 'center' });

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

      // === STATISTIQUES DU MARCHÉ ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STATISTIQUES DU MARCHÉ', margin, y);

      y += 10;

      const statsData = [
        ['Fourchette de Prix', `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`],
        ['Prix Médian', formatCurrency(medianPrice)],
        ['Kilométrage Moyen', `${formatNumber(avgKm)} km`],
        ['Fourchette Kilométrage', `${formatNumber(minKm)} - ${formatNumber(maxKm)} km`],
      ];
      
      pdf.setFontSize(10);
      statsData.forEach((row, i) => {
        const rowY = y + i * 8;
        pdf.setTextColor(...mutedGray);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row[0], margin, rowY);
        pdf.setTextColor(...darkText);
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[1], pageWidth - margin, rowY, { align: 'right' });
      });

      y += statsData.length * 8 + 15;

      // === TOP OPPORTUNITÉS ===
      pdf.setTextColor(...primaryBlue);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP 5 OPPORTUNITÉS', margin, y);
      
      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('(Véhicules ≥15% sous le marché)', margin + 55, y);

      y += 8;

      // Table header
      const colWidths = { rank: 10, model: 55, km: 30, price: 30, savings: 30 };
      const tableWidth = colWidths.rank + colWidths.model + colWidths.km + colWidths.price + colWidths.savings;

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
      pdf.text('Prix Affiché', colX, y + 5.5);
      colX += colWidths.price;
      pdf.text('Gain Potentiel', colX, y + 5.5);

      y += 8;

      if (opportunities.length === 0) {
        pdf.setTextColor(...mutedGray);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Aucune opportunité majeure détectée (< 15% sous le marché)', margin, y + 8);
        y += 15;
      } else {
        opportunities.forEach((opp, index) => {
          if (index % 2 === 1) {
            pdf.setFillColor(250, 250, 252);
            pdf.rect(margin, y, tableWidth, 8, 'F');
          }

          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          
          colX = margin + 2;
          
          pdf.setTextColor(...darkText);
          pdf.text(`${index + 1}`, colX, y + 5.5);
          colX += colWidths.rank;
          
          const modelName = `${opp.marque} ${cleanModelName(opp.modele)} ${opp.annee || ''}`.substring(0, 35);
          pdf.text(modelName, colX, y + 5.5);
          colX += colWidths.model;
          
          pdf.setTextColor(...mutedGray);
          pdf.text(`${formatNumber(opp.kilometrage)} km`, colX, y + 5.5);
          colX += colWidths.km;
          
          pdf.setTextColor(...darkText);
          pdf.text(formatCurrency(opp.prix), colX, y + 5.5);
          colX += colWidths.price;
          
          pdf.setTextColor(...successGreen);
          pdf.setFont('helvetica', 'bold');
          pdf.text(formatCurrency(opp.savings), colX, y + 5.5);

          y += 8;
        });
      }

      // === FOOTER ===
      y = pageHeight - 15;
      
      pdf.setDrawColor(...lightGray);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y - 5, pageWidth - margin, y - 5);

      pdf.setTextColor(...mutedGray);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Document certifié par l'algorithme La Truffe. Ne constitue pas une garantie mécanique.", margin, y);
      
      pdf.text(`Page 1/${pdf.getNumberOfPages()}`, pageWidth - margin, y, { align: 'right' });

      // Download
      const filename = `rapport-marche-${mainBrand}${mainModel ? '-' + mainModel : ''}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename.toLowerCase().replace(/\s+/g, '-'));
      
      toast.success('Rapport PDF téléchargé !');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={generateReport}
      disabled={isGenerating || vehicles.length === 0}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      Rapport PDF
    </Button>
  );
}

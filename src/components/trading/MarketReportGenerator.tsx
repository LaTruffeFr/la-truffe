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

// Format currency with spaces (French style: 18 000 €)
function formatCurrency(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}

function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Clean model name - remove garbage patterns
function cleanModelName(model: string): string {
  if (!model || model === 'Inconnu') return '';
  
  // Remove common garbage patterns
  const cleaned = model
    .replace(/GOLE|GOLF(?!$)/gi, 'Golf')
    .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading special chars
    .replace(/[^a-zA-Z0-9\s-]+$/, '') // Remove trailing special chars
    .trim();
  
  return cleaned || model;
}

export function MarketReportGenerator({ vehicles, trendLine, kpis }: MarketReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);

    try {
      // Calculate stats
      const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
      const kms = vehicles.map(v => v.kilometrage).sort((a, b) => a - b);
      
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      const minKm = kms[0];
      const maxKm = kms[kms.length - 1];
      const avgKm = Math.round(kms.reduce((a, b) => a + b, 0) / kms.length);

      // Get main brand/model from data
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

      // Get opportunities - ONLY vehicles at least 15% below trend line
      const allWithExpected = vehicles.map(v => ({
        ...v,
        expectedPrice: trendLine.slope * v.kilometrage + trendLine.intercept,
        savings: (trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix,
        savingsPercent: ((trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix) / (trendLine.slope * v.kilometrage + trendLine.intercept) * 100,
      }));
      
      // Filter: at least 15% below trend
      const opportunities = allWithExpected
        .filter(v => v.savingsPercent >= 15)
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5);
      
      const opportunitiesCount = allWithExpected.filter(v => v.savingsPercent >= 15).length;

      // Years distribution
      const yearCounts: Record<number, number> = {};
      vehicles.forEach(v => {
        if (v.annee) yearCounts[v.annee] = (yearCounts[v.annee] || 0) + 1;
      });
      const yearsData = Object.entries(yearCounts)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => b.year - a.year)
        .slice(0, 5);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Colors
      const greenColor: [number, number, number] = [34, 197, 94];
      const goldColor: [number, number, number] = [245, 158, 11];
      const darkBg: [number, number, number] = [26, 26, 26];
      const textColor: [number, number, number] = [250, 250, 250];
      const mutedColor: [number, number, number] = [136, 136, 136];

      // Background
      pdf.setFillColor(...darkBg);
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');

      // Header Banner
      pdf.setFillColor(...greenColor);
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, 40, 3, 3, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      const headerTitle = mainModel ? `${mainBrand} ${mainModel}` : mainBrand;
      pdf.text(headerTitle, pageWidth / 2, y + 18, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Rapport d\'Analyse de Marché', pageWidth / 2, y + 28, { align: 'center' });
      
      pdf.setFontSize(9);
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      pdf.text(`Généré le ${dateStr}`, pageWidth / 2, y + 36, { align: 'center' });
      
      y += 50;

      // Section: Vue d'ensemble
      pdf.setFillColor(40, 40, 40);
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, 45, 3, 3, 'F');
      
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vue d\'ensemble', margin + 5, y + 10);
      
      // KPI boxes
      const kpiWidth = (pageWidth - 2 * margin - 30) / 4;
      const kpiData = [
        { label: 'Véhicules', value: vehicles.length.toString() },
        { label: 'Prix Moyen', value: formatCurrency(kpis.avgPrice), color: greenColor },
        { label: 'Opportunités', value: opportunitiesCount.toString(), color: goldColor },
        { label: 'Décote/10k km', value: formatCurrency(kpis.decotePer10k) },
      ];
      
      kpiData.forEach((kpi, i) => {
        const x = margin + 5 + i * (kpiWidth + 6);
        pdf.setFillColor(20, 20, 20);
        pdf.roundedRect(x, y + 16, kpiWidth, 24, 2, 2, 'F');
        
        pdf.setTextColor(...mutedColor);
        pdf.setFontSize(8);
        pdf.text(kpi.label.toUpperCase(), x + kpiWidth / 2, y + 24, { align: 'center' });
        
        pdf.setTextColor(...(kpi.color || textColor));
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value, x + kpiWidth / 2, y + 35, { align: 'center' });
      });
      
      y += 55;

      // Section: Statistiques du Marché
      pdf.setFillColor(40, 40, 40);
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, 55, 3, 3, 'F');
      
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Statistiques du Marché', margin + 5, y + 10);
      
      const statsData = [
        ['Fourchette de Prix', `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`],
        ['Prix Médian', formatCurrency(medianPrice)],
        ['Kilométrage Moyen', `${formatNumber(avgKm)} km`],
        ['Fourchette Kilométrage', `${formatNumber(minKm)} - ${formatNumber(maxKm)} km`],
      ];
      
      pdf.setFontSize(10);
      statsData.forEach((row, i) => {
        const rowY = y + 20 + i * 8;
        pdf.setTextColor(...mutedColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row[0], margin + 8, rowY);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[1], pageWidth - margin - 8, rowY, { align: 'right' });
      });
      
      y += 65;

      // Section: Répartition par Année + Dépréciation
      pdf.setFillColor(40, 40, 40);
      pdf.roundedRect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 50, 3, 3, 'F');
      
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Répartition par Année', margin + 5, y + 10);
      
      if (yearsData.length > 0) {
        pdf.setFontSize(9);
        yearsData.slice(0, 4).forEach((item, i) => {
          const rowY = y + 20 + i * 7;
          pdf.setTextColor(...mutedColor);
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.year.toString(), margin + 8, rowY);
          pdf.setTextColor(...textColor);
          const pct = Math.round(item.count / vehicles.length * 100);
          pdf.text(`${item.count} (${pct}%)`, margin + (pageWidth - 2 * margin) / 2 - 15, rowY, { align: 'right' });
        });
      }

      // Dépréciation box (simplified - no technical jargon)
      const rightBoxX = margin + (pageWidth - 2 * margin) / 2 + 5;
      pdf.setFillColor(40, 40, 40);
      pdf.roundedRect(rightBoxX, y, (pageWidth - 2 * margin) / 2 - 5, 50, 3, 3, 'F');
      
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dépréciation', rightBoxX + 5, y + 10);
      
      // Simple depreciation message
      pdf.setFontSize(10);
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      
      const depreciationText = `Ce modèle perd en moyenne`;
      const depreciationValue = formatCurrency(kpis.decotePer10k);
      const depreciationText2 = `tous les 10 000 km parcourus.`;
      
      pdf.text(depreciationText, rightBoxX + 8, y + 24);
      pdf.setTextColor(...goldColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(depreciationValue, rightBoxX + 8, y + 35);
      pdf.setTextColor(...mutedColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(depreciationText2, rightBoxX + 8, y + 44);
      
      y += 60;

      // Section: Top Opportunités (15%+ below trend)
      pdf.setFillColor(40, 40, 40);
      const oppHeight = 18 + opportunities.length * 20;
      pdf.roundedRect(margin, y, pageWidth - 2 * margin, Math.max(oppHeight, 45), 3, 3, 'F');
      
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Opportunités', margin + 5, y + 10);
      
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('(Véhicules au moins 15% sous le prix du marché)', margin + 65, y + 10);
      
      if (opportunities.length === 0) {
        pdf.setTextColor(...mutedColor);
        pdf.setFontSize(10);
        pdf.text('Aucune opportunité majeure détectée (< 15% sous le marché)', pageWidth / 2, y + 28, { align: 'center' });
      } else {
        opportunities.forEach((opp, i) => {
          const rowY = y + 22 + i * 20;
          
          // Background
          pdf.setFillColor(20, 20, 20);
          pdf.roundedRect(margin + 5, rowY - 4, pageWidth - 2 * margin - 10, 17, 2, 2, 'F');
          
          // Rank
          pdf.setTextColor(...goldColor);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`#${i + 1}`, margin + 12, rowY + 6);
          
          // Vehicle info - clean model name
          const cleanedModel = cleanModelName(opp.modele);
          const vehicleName = cleanedModel ? `${opp.marque} ${cleanedModel}` : opp.marque;
          pdf.setTextColor(...textColor);
          pdf.setFontSize(11);
          pdf.text(vehicleName, margin + 28, rowY + 5);
          
          pdf.setTextColor(...mutedColor);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${opp.annee || 'N/A'} • ${formatNumber(opp.kilometrage)} km • Prix affiché : ${formatCurrency(opp.prix)}`, margin + 28, rowY + 12);
          
          // Savings badge - "Gain potentiel" in green
          pdf.setFillColor(...greenColor);
          pdf.roundedRect(pageWidth - margin - 48, rowY - 2, 43, 14, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Gain potentiel', pageWidth - margin - 26.5, rowY + 3, { align: 'center' });
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${formatCurrency(opp.savings)}`, pageWidth - margin - 26.5, rowY + 10, { align: 'center' });
        });
      }
      
      y += oppHeight + 10;

      // Footer
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(9);
      pdf.text('Rapport généré par', pageWidth / 2 - 20, pdf.internal.pageSize.getHeight() - 15, { align: 'center' });
      pdf.setTextColor(...goldColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('La Truffe', pageWidth / 2 + 15, pdf.internal.pageSize.getHeight() - 15, { align: 'center' });
      
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`© ${new Date().getFullYear()} - Données à titre indicatif`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });

      // Download
      const filename = `rapport-marche-${mainBrand}${mainModel ? '-' + mainModel : ''}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename.toLowerCase().replace(/\s+/g, '-'));
      
      toast.success('Rapport téléchargé !');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="gold" 
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

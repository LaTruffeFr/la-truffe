import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

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
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function MarketReportGenerator({ vehicles, trendLine, kpis }: MarketReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsGenerating(true);

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
      modelCounts[v.modele] = (modelCounts[v.modele] || 0) + 1;
    });
    const mainBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const mainModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Get opportunities
    const opportunities = vehicles
      .map(v => ({
        ...v,
        expectedPrice: trendLine.slope * v.kilometrage + trendLine.intercept,
        savings: (trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix,
      }))
      .filter(v => v.savings > 0)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5);

    // Years distribution
    const yearCounts: Record<number, number> = {};
    vehicles.forEach(v => {
      if (v.annee) yearCounts[v.annee] = (yearCounts[v.annee] || 0) + 1;
    });
    const yearsData = Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Veuillez autoriser les popups pour générer le rapport');
      setIsGenerating(false);
      return;
    }

    const reportHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Marché - ${mainBrand} ${mainModel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      background: #0a0a0a; 
      color: #fafafa;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    
    /* Header */
    .header { 
      background: linear-gradient(135deg, #16a34a 0%, #065f46 100%);
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
    .header .subtitle { font-size: 1.1rem; opacity: 0.9; }
    .header .date { font-size: 0.9rem; opacity: 0.7; margin-top: 16px; }
    
    /* Section */
    .section { 
      background: #1a1a1a; 
      border: 1px solid #2a2a2a;
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 20px;
    }
    .section-title { 
      font-size: 1.3rem; 
      font-weight: 600; 
      margin-bottom: 20px;
      color: #22c55e;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title::before {
      content: '';
      width: 4px;
      height: 24px;
      background: #22c55e;
      border-radius: 2px;
    }
    
    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card { 
      background: #0f0f0f; 
      border: 1px solid #2a2a2a;
      border-radius: 10px; 
      padding: 20px; 
      text-align: center;
    }
    .kpi-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .kpi-value { font-size: 1.8rem; font-weight: 700; font-family: 'Monaco', monospace; }
    .kpi-value.primary { color: #22c55e; }
    .kpi-value.gold { color: #f59e0b; }
    
    /* Stats Table */
    .stats-table { width: 100%; border-collapse: collapse; }
    .stats-table tr { border-bottom: 1px solid #2a2a2a; }
    .stats-table tr:last-child { border-bottom: none; }
    .stats-table td { padding: 14px 0; }
    .stats-table td:first-child { color: #888; }
    .stats-table td:last-child { text-align: right; font-weight: 600; font-family: 'Monaco', monospace; }
    
    /* Opportunity List */
    .opp-list { display: flex; flex-direction: column; gap: 12px; }
    .opp-item { 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      background: #0f0f0f;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      padding: 16px;
    }
    .opp-info { flex: 1; }
    .opp-title { font-weight: 600; margin-bottom: 4px; }
    .opp-details { font-size: 0.85rem; color: #888; }
    .opp-savings { 
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-family: 'Monaco', monospace;
    }
    
    /* Chart placeholder */
    .chart-note {
      background: #0f0f0f;
      border: 2px dashed #2a2a2a;
      border-radius: 10px;
      padding: 40px;
      text-align: center;
      color: #666;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 0.9rem;
    }
    .footer .brand { color: #f59e0b; font-weight: 600; }
    
    /* Print styles */
    @media print {
      body { background: white; color: #1a1a1a; }
      .container { padding: 20px; }
      .section { background: #f9f9f9; border-color: #e0e0e0; }
      .kpi-card { background: #fff; border-color: #e0e0e0; }
      .opp-item { background: #fff; border-color: #e0e0e0; }
      .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .opp-savings { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${mainBrand} ${mainModel}</h1>
      <p class="subtitle">Rapport d'Analyse de Marché</p>
      <p class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <!-- KPIs Overview -->
    <div class="section">
      <h2 class="section-title">Vue d'ensemble</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <p class="kpi-label">Véhicules Analysés</p>
          <p class="kpi-value">${vehicles.length}</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Prix Moyen</p>
          <p class="kpi-value primary">${formatCurrency(kpis.avgPrice)}</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Opportunités</p>
          <p class="kpi-value gold">${kpis.opportunitiesCount}</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Décote / 10k km</p>
          <p class="kpi-value">${formatCurrency(kpis.decotePer10k)}</p>
        </div>
      </div>
    </div>
    
    <!-- Market Statistics -->
    <div class="section">
      <h2 class="section-title">Statistiques du Marché</h2>
      <table class="stats-table">
        <tr>
          <td>Fourchette de Prix</td>
          <td>${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}</td>
        </tr>
        <tr>
          <td>Prix Médian</td>
          <td>${formatCurrency(medianPrice)}</td>
        </tr>
        <tr>
          <td>Kilométrage Moyen</td>
          <td>${formatNumber(avgKm)} km</td>
        </tr>
        <tr>
          <td>Fourchette Kilométrage</td>
          <td>${formatNumber(minKm)} - ${formatNumber(maxKm)} km</td>
        </tr>
        <tr>
          <td>Décote par 10 000 km</td>
          <td>${formatCurrency(kpis.decotePer10k)}</td>
        </tr>
        <tr>
          <td>Tendance Linéaire (pente)</td>
          <td>${trendLine.slope.toFixed(4)} €/km</td>
        </tr>
      </table>
    </div>
    
    <!-- Years Distribution -->
    <div class="section">
      <h2 class="section-title">Répartition par Année</h2>
      <table class="stats-table">
        ${yearsData.map(({ year, count }) => `
        <tr>
          <td>${year}</td>
          <td>${count} véhicule${count > 1 ? 's' : ''} (${Math.round(count / vehicles.length * 100)}%)</td>
        </tr>
        `).join('')}
      </table>
    </div>
    
    <!-- Top Opportunities -->
    <div class="section">
      <h2 class="section-title">Top 5 Opportunités</h2>
      <div class="opp-list">
        ${opportunities.length > 0 ? opportunities.map((opp, i) => `
        <div class="opp-item">
          <div class="opp-info">
            <p class="opp-title">#${i + 1} - ${opp.marque} ${opp.modele}</p>
            <p class="opp-details">${opp.annee || 'N/A'} • ${formatNumber(opp.kilometrage)} km • Affiché: ${formatCurrency(opp.prix)}</p>
          </div>
          <div class="opp-savings">-${formatCurrency(opp.savings)}</div>
        </div>
        `).join('') : '<p style="color: #888; text-align: center; padding: 20px;">Aucune opportunité détectée</p>'}
      </div>
    </div>
    
    <!-- Methodology Note -->
    <div class="section">
      <h2 class="section-title">Méthodologie</h2>
      <p style="color: #888; line-height: 1.8;">
        Cette analyse est basée sur <strong style="color: #fafafa;">${vehicles.length} annonces</strong> 
        collectées sur le marché. Les valeurs aberrantes ont été filtrées via la méthode IQR 
        (Interquartile Range). La ligne de tendance est calculée par régression linéaire 
        sur les données filtrées. Les opportunités sont identifiées comme les véhicules 
        dont le prix est inférieur au prix attendu selon la tendance du marché.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Rapport généré par <span class="brand">La Truffe</span> - Analyse de Marché Automobile</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} - Données à titre indicatif</p>
    </div>
  </div>
  
  <script>
    // Auto print
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    setIsGenerating(false);
    toast.success('Rapport généré !');
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

const stats = [
  { value: "1 500+", label: "Rapports générés" },
  { value: "2 400 €", label: "Économie moyenne par rapport" },
  { value: "100%", label: "Analyse Indépendante" }
];

export function StatisticsSection() {
  return (
    <section className="py-16 bg-[#0F172A]">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-white/70 text-lg">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

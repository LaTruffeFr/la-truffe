import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Est-ce fiable ?",
    answer: "Nos données proviennent de l'analyse en temps réel de toutes les plateformes majeures (Leboncoin, LaCentrale...). Notre algorithme IA croise des milliers de points de données pour vous fournir une estimation précise."
  },
  {
    question: "Combien ça coûte ?",
    answer: "19€ par rapport complet. Pas d'abonnement caché. Vous payez uniquement pour les rapports dont vous avez besoin."
  },
  {
    question: "Et si je ne trouve pas d'économie ?",
    answer: "C'est que vous achetez au bon prix ! Le rapport vous évite aussi de perdre de l'argent en surpayant. Dans tous les cas, vous avez une vision claire du marché."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Questions Fréquentes
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card rounded-lg mb-3 px-6 border shadow-sm"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "D'où viennent vos données ?",
    answer: "Nous scannons en temps réel les plus grandes plateformes d'annonces européennes pour établir un prix de marché ultra-précis."
  },
  {
    question: "Est-ce que ça marche pour toutes les voitures ?",
    answer: "Oui, tant qu'il y a suffisamment d'annonces comparables sur le marché pour que notre algorithme puisse travailler."
  },
  {
    question: "Pourquoi payer 19€ ?",
    answer: "Pour économiser 2000€. C'est l'investissement le plus rentable de votre achat auto."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Questions Fréquentes
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full animate-fade-in-up animate-delay-100">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card rounded-lg mb-3 px-6 border shadow-sm hover:shadow-md transition-shadow"
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

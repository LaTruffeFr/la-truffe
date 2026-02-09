import { useEffect, useMemo, useState } from 'react';

// Scénarios synchronisés (Marque / Modèle / Précision)
const scenarios = [
  { make: 'Renault', model: 'Clio 4', precision: 'RS Trophy' },
  { make: 'Porsche', model: '911', precision: 'Carrera S' },
  { make: 'Volkswagen', model: 'Golf 7', precision: 'GTI Performance' },
  { make: 'Audi', model: 'RS3', precision: 'Sportback' },
] as const;

type Scenario = (typeof scenarios)[number];

type TypewriterState = {
  make: string;
  model: string;
  precision: string;
};

/**
 * Hook Typewriter synchronisé.
 * - 100ms pour écrire
 * - 50ms pour effacer
 * - 2000ms de pause quand le scénario est entièrement écrit
 */
export function useTypewriter(isPaused: boolean = false) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  const scenario: Scenario = scenarios[scenarioIndex];

  const maxLen = useMemo(() => {
    return Math.max(scenario.make.length, scenario.model.length, scenario.precision.length);
  }, [scenario]);

  const [currentPlaceholder, setCurrentPlaceholder] = useState<TypewriterState>({
    make: '',
    model: '',
    precision: '',
  });

  useEffect(() => {
    if (isPaused) return;

    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDuration = 2000;

    let timeoutId: ReturnType<typeof setTimeout>;

    // 1) ÉCRITURE
    if (!isDeleting) {
      if (charIndex < maxLen) {
        timeoutId = setTimeout(() => {
          const nextIndex = charIndex + 1;
          setCurrentPlaceholder({
            make: scenario.make.slice(0, nextIndex),
            model: scenario.model.slice(0, nextIndex),
            precision: scenario.precision.slice(0, nextIndex),
          });
          setCharIndex(nextIndex);
        }, typingSpeed);
      } else {
        // Fin de l'écriture: pause 2 secondes puis suppression
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }

      return () => clearTimeout(timeoutId);
    }

    // 2) SUPPRESSION
    if (charIndex > 0) {
      timeoutId = setTimeout(() => {
        const nextIndex = charIndex - 1;
        setCurrentPlaceholder({
          make: scenario.make.slice(0, nextIndex),
          model: scenario.model.slice(0, nextIndex),
          precision: scenario.precision.slice(0, nextIndex),
        });
        setCharIndex(nextIndex);
      }, deletingSpeed);

      return () => clearTimeout(timeoutId);
    }

    // 3) FIN DE SUPPRESSION -> scénario suivant
    setIsDeleting(false);
    setScenarioIndex((prev) => (prev + 1) % scenarios.length);
    // charIndex est déjà à 0
  }, [isPaused, scenario, scenarioIndex, charIndex, isDeleting, maxLen]);

  return currentPlaceholder;
}


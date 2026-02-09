import { useState, useEffect, useCallback } from 'react';

interface TypewriterScenario {
  marque: string;
  modele: string;
  precision: string;
}

interface TypewriterState {
  marque: string;
  modele: string;
  precision: string;
}

const SCENARIOS: TypewriterScenario[] = [
  { marque: 'Renault', modele: 'Clio 4', precision: 'RS Trophy' },
  { marque: 'Porsche', modele: '911', precision: 'Carrera S' },
  { marque: 'Volkswagen', modele: 'Golf 7', precision: 'GTI Performance' },
  { marque: 'Audi', modele: 'RS3', precision: 'Sportback' },
];

type Phase = 'typing' | 'pausing' | 'deleting';

export function useTypewriter(isPaused: boolean = false) {
  const [displayText, setDisplayText] = useState<TypewriterState>({
    marque: '',
    modele: '',
    precision: '',
  });
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');

  const currentScenario = SCENARIOS[scenarioIndex];
  
  // Get the maximum length among all fields in current scenario
  const maxLength = Math.max(
    currentScenario.marque.length,
    currentScenario.modele.length,
    currentScenario.precision.length
  );

  useEffect(() => {
    if (isPaused) return;

    let timeout: NodeJS.Timeout;

    if (phase === 'typing') {
      if (charIndex < maxLength) {
        timeout = setTimeout(() => {
          setDisplayText({
            marque: currentScenario.marque.slice(0, charIndex + 1),
            modele: currentScenario.modele.slice(0, charIndex + 1),
            precision: currentScenario.precision.slice(0, charIndex + 1),
          });
          setCharIndex((prev) => prev + 1);
        }, 80); // Typing speed
      } else {
        // Finished typing, pause
        timeout = setTimeout(() => {
          setPhase('pausing');
        }, 100);
      }
    } else if (phase === 'pausing') {
      // Wait 2 seconds before deleting
      timeout = setTimeout(() => {
        setPhase('deleting');
      }, 2000);
    } else if (phase === 'deleting') {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          const newIndex = charIndex - 1;
          setDisplayText({
            marque: currentScenario.marque.slice(0, newIndex),
            modele: currentScenario.modele.slice(0, newIndex),
            precision: currentScenario.precision.slice(0, newIndex),
          });
          setCharIndex(newIndex);
        }, 40); // Deleting speed (faster)
      } else {
        // Move to next scenario
        timeout = setTimeout(() => {
          setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
          setPhase('typing');
        }, 300);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, phase, isPaused, currentScenario, maxLength]);

  return displayText;
}

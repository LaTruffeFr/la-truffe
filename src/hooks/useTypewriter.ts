import { useState, useEffect, useRef, useCallback } from 'react';

interface TypewriterScenario {
  make: string;
  model: string;
  precision: string;
}

const SCENARIOS: TypewriterScenario[] = [
  { make: 'Renault', model: 'Clio 4', precision: 'RS Trophy' },
  { make: 'Porsche', model: '911', precision: 'Carrera S' },
  { make: 'Volkswagen', model: 'Golf 7', precision: 'GTI Performance' },
  { make: 'Audi', model: 'RS3', precision: 'Sportback' },
];

interface TypewriterState {
  make: string;
  model: string;
  precision: string;
}

interface UseTypewriterOptions {
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function useTypewriter(
  isPaused: boolean = false,
  options: UseTypewriterOptions = {}
) {
  const {
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 2000,
  } = options;

  const [currentText, setCurrentText] = useState<TypewriterState>({
    make: '',
    model: '',
    precision: '',
  });
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [isPausedInternal, setIsPausedInternal] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentScenario = SCENARIOS[scenarioIndex];
  const maxLength = Math.max(
    currentScenario.make.length,
    currentScenario.model.length,
    currentScenario.precision.length
  );

  const tick = useCallback(() => {
    if (isPaused || isPausedInternal) return;

    if (!isDeleting) {
      // TYPING
      if (charIndex < maxLength) {
        setCurrentText({
          make: currentScenario.make.slice(0, charIndex + 1),
          model: currentScenario.model.slice(0, charIndex + 1),
          precision: currentScenario.precision.slice(0, charIndex + 1),
        });
        setCharIndex((prev) => prev + 1);
      } else {
        // Finished typing - pause before deleting
        setIsPausedInternal(true);
        timeoutRef.current = setTimeout(() => {
          setIsPausedInternal(false);
          setIsDeleting(true);
        }, pauseDuration);
        return;
      }
    } else {
      // DELETING
      if (charIndex > 0) {
        const newIndex = charIndex - 1;
        setCurrentText({
          make: currentScenario.make.slice(0, newIndex),
          model: currentScenario.model.slice(0, newIndex),
          precision: currentScenario.precision.slice(0, newIndex),
        });
        setCharIndex(newIndex);
      } else {
        // Finished deleting - move to next scenario
        setIsDeleting(false);
        setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
      }
    }
  }, [isPaused, isPausedInternal, isDeleting, charIndex, maxLength, currentScenario, pauseDuration]);

  useEffect(() => {
    if (isPaused || isPausedInternal) return;

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    timeoutRef.current = setTimeout(tick, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tick, isDeleting, typingSpeed, deletingSpeed, isPaused, isPausedInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return currentText;
}

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
  /** Distance de montée en pixels ; 0 pour un simple fondu. */
  readonly y?: number;
}

/**
 * Entrée d'un bloc à son apparition : opacité et translation seulement.
 * En `prefers-reduced-motion`, le contenu est posé d'emblée.
 */
export function Reveal({ children, delay = 0, className, y = 18 }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Extraction du bloc de raisonnement <think>...</think> émis par Hermes 4.

export interface ParsedAssistant {
  /** Contenu visible (réponse finale). */
  content: string;
  /** Contenu du bloc de raisonnement, si présent. */
  think?: string;
}

const OPEN = "<think>";
const CLOSE = "</think>";

/**
 * Sépare le raisonnement du contenu visible. Tolère un bloc <think>
 * non encore fermé (utile pendant le streaming).
 */
export function parseAssistant(raw: string): ParsedAssistant {
  const open = raw.indexOf(OPEN);
  if (open === -1) return { content: raw };

  const before = raw.slice(0, open);
  const close = raw.indexOf(CLOSE, open);
  if (close === -1) {
    // Bloc en cours d'écriture : tout ce qui suit <think> est du raisonnement.
    return { content: before, think: raw.slice(open + OPEN.length) };
  }
  const think = raw.slice(open + OPEN.length, close);
  const after = raw.slice(close + CLOSE.length);
  return { content: (before + after).trim(), think };
}

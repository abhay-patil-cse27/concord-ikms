/**
 * CONCORD Academic Thinking Verbs
 * Curated, erudite gerund-form verbs capturing deep deliberation, 
 * rigorous synthesis, and scholarly inquiry.
 */

export const CONCORD_THINKING_VERBS = [
  // Deep Deliberation & Intellectual Reflection
  'Cogitating',
  'Deliberating',
  'Elucidating',
  'Pondering',
  'Ruminating',
  'Cerebrating',
  'Contemplating',
  'Meditating',
  'Philosophizing',

  // Rigorous Analysis & Discovery
  'Deciphering',
  'Dissecting',
  'Distilling',
  'Interrogating',
  'Scrutinizing',
  'Examining',
  'Deconstructing',
  'Synthesizing',
  'Unravelling',

  // Verification & Cross-Referencing
  'Corroborating',
  'Triangulating',
  'Cross-referencing',
  'Substantiating',
  'Authenticating',
  'Validating',
  'Calibrating',

  // Articulation & Formulation
  'Articulating',
  'Formulating',
  'Structuring',
  'Distillating',
  'Percolating',
  'Assembling',
  'Harmonizing',
  'Crystallizing',
  'Composing',
];

/**
 * Returns a randomized permutation of the thinking verbs so each query feels fresh.
 */
export function getShuffledThinkingVerbs() {
  const arr = [...CONCORD_THINKING_VERBS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

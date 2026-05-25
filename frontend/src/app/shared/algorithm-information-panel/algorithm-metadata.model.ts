export interface AlgorithmMeasure {
  label:        string;
  value:        string;
  colorClass:   'color-best' | 'color-avg' | 'color-worst' | 'color-space' | 'color-info';
}

/**
 * Modèle unifié pour les métadonnées d'algorithme (tri et pathfinding).
 * - `measures`       : tableau de mesures affichées dans la grille de complexité
 * - `codeByLanguage` : optionnel — absent pour les algo de pathfinding si non applicable
 */
export interface AlgorithmMetadata {
  name:            string;
  description:     string;
  wikipediaUrl:    string;
  measures:        AlgorithmMeasure[];
  badges?:         AlgorithmBadge[];
  codeByLanguage?: Record<string, string>;
}

export interface AlgorithmBadge {
  label: string;
  value: string | boolean;
}

// ── Helpers de construction ────────────────────────────────────────────────

export function buildSortingMetadata(raw: {
  name:             string;
  complexity:       string;
  worstCase:        string;
  bestCase:         string;
  spaceComplexity:  string;
  description:      string;
  wikipediaUrl:     string;
  stableSort:       boolean;
  codeByLanguage:   Record<string, string>;
}): AlgorithmMetadata {
  return {
    name:        raw.name,
    description: raw.description,
    wikipediaUrl: raw.wikipediaUrl,
    measures: [
      { label: 'Best',  value: raw.bestCase,        colorClass: 'color-best'  },
      { label: 'Avg',   value: raw.complexity,       colorClass: 'color-avg'   },
      { label: 'Worst', value: raw.worstCase,        colorClass: 'color-worst' },
      { label: 'Space', value: raw.spaceComplexity,  colorClass: 'color-space' },
    ],
    badges: [
      { label: 'Stable', value: raw.stableSort },
    ],
    codeByLanguage: raw.codeByLanguage,
  };
}

export function buildPathfindingMetadata(raw: {
  name:            string;
  timeComplexity:  string;
  spaceComplexity: string;
  optimal:         string;
  complete:        string;
  description:     string;
  wikipediaUrl:    string;
}): AlgorithmMetadata {
  return {
    name:        raw.name,
    description: raw.description,
    wikipediaUrl: raw.wikipediaUrl,
    measures: [
      { label: 'Temps',  value: raw.timeComplexity,  colorClass: 'color-avg'   },
      { label: 'Espace', value: raw.spaceComplexity, colorClass: 'color-space' },
      { label: 'Optimal', value: raw.optimal.startsWith('Oui') ? '✓' : '✗',
        colorClass: raw.optimal.startsWith('Oui') ? 'color-best' : 'color-worst' },
      { label: 'Complet', value: raw.complete.startsWith('Oui') ? '✓' : '✗',
        colorClass: raw.complete.startsWith('Oui') ? 'color-best' : 'color-worst' },
    ],
    badges: [
      { label: 'Optimal',  value: raw.optimal  },
      { label: 'Complet', value: raw.complete },
    ],
  };
}

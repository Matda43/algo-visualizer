export interface AlgoMetadata {
  name: string;
  complexity: string;
  worstCase: string;
  bestCase: string;
  spaceComplexity: string;
  description: string;
  wikipediaUrl: string;
  codeByLanguage: Record<string, string>;
}
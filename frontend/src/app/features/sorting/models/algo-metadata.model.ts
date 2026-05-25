export interface AlgoMetadata {
  name:             string;
  complexity:       string;
  worstCase:        string;
  bestCase:         string;
  spaceComplexity:  string;
  description:      string;
  wikipediaUrl:     string;
  stableSort:       boolean;
  codeByLanguage:   Record<string, string>;
}
import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SelectOptionComponent } from '../select-option/select-option';
import { AlgorithmMetadata } from './algorithm-metadata.model';
import { buildOptionType, DataType } from '../../features/sorting/models/sorting.models';

export type CodeLanguage = string;

@Component({
  selector:    'app-algorithm-information-panel',
  standalone:  true,
  imports:     [SelectOptionComponent],
  templateUrl: './algorithm-information-panel.html',
  styleUrl:    './algorithm-information-panel.scss',
})
export class AlgorithmInformationPanelComponent {

  private readonly sanitizer = inject(DomSanitizer);

  metadata = input.required<AlgorithmMetadata>();
  /** Optionnel : utile uniquement pour les algo de tri */
  dataType = input<DataType>('int');

  selectedLanguage = signal<CodeLanguage>('Java');

  hasCode = computed(() => {
    const code = this.metadata()?.codeByLanguage;
    return !!code && Object.keys(code).length > 0;
  });

  availableLanguages = computed(() =>
    buildOptionType(Object.keys(this.metadata()?.codeByLanguage ?? {}))
  );

  codeLines = computed(() => {
    const code = this.metadata()?.codeByLanguage?.[this.selectedLanguage()] ?? '';
    return this.applyDataType(code, this.dataType()).split('\n');
  });

  selectLanguage(lang: CodeLanguage): void {
    this.selectedLanguage.set(lang);
  }

  private applyDataType(code: string, type: DataType): string {
    if (type === 'int') return code;
    return code
      .replace(/\bint(?=\s+\w)/g, type)
      .replace(/\bint\[\]/g, `${type}[]`);
  }

  highlightLine(line: string): SafeHtml {
    if (!line.trim()) return this.sanitizer.bypassSecurityTrustHtml('&nbsp;');
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = escaped
      .replace(/(["'`][^"'`]*["'`])/g,
        '<span class="hl-string">$1</span>')
      .replace(/\b(void|bool|boolean|return|if|else|for|while|break|true|false|null|new|class|function|def|let|const|var|static|public|private|import|from|int|float|double|long)\b/g,
        '<span class="hl-keyword">$1</span>')
      .replace(/\b(Arrays|Math|count|len|range|intdiv|vector|swap|print|console)\b/g,
        '<span class="hl-builtin">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g,
        '<span class="hl-number">$1</span>')
      .replace(/(\/\/.*$)/g,
        '<span class="hl-comment">$1</span>')
      .replace(/(#.*$)/g,
        '<span class="hl-comment">$1</span>')
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        '<span class="hl-fn">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
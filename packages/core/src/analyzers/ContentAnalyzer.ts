import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult } from '../types/index.js';

export class ContentAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Content Quality';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const textContent = this.parser.getTextContent();
    const wordCount = this.parser.getWordCount();
    const language = this.parser.getLanguage();

    let penalty = 0;

    penalty += this.analyzeWordCount(wordCount);
    penalty += this.analyzeLanguage(language);
    penalty += this.analyzeReadability(textContent);
    penalty += this.analyzeKeywordDensity(textContent);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        wordCount,
        language,
        readabilityMetrics: this.calculateReadabilityMetrics(textContent),
      },
    };
  }

  private analyzeWordCount(wordCount: number): number {
    let penalty = 0;

    if (wordCount < 300) {
      this.addIssue({
        code: 'THIN_CONTENT',
        message: `Page has thin content (${wordCount} words)`,
        severity: 'warning',
        recommendation: 'Consider adding more valuable content. Aim for at least 300 words for better SEO',
      });
      penalty += 20;
    } else if (wordCount < 600) {
      this.addIssue({
        code: 'LOW_WORD_COUNT',
        message: `Page has relatively low word count (${wordCount} words)`,
        severity: 'info',
        recommendation: 'Consider expanding content to provide more value. Aim for 600+ words for in-depth topics',
      });
      penalty += 10;
    }

    return penalty;
  }

  private analyzeLanguage(language: string | undefined): number {
    if (!language) {
      this.addIssue({
        code: 'MISSING_LANG',
        message: 'Page is missing lang attribute on <html> tag',
        severity: 'warning',
        recommendation: 'Add lang="en" (or appropriate language code) to the <html> tag',
      });
      return 10;
    }
    return 0;
  }

  private analyzeReadability(text: string): number {
    let penalty = 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length > 0) {
      const avgWordsPerSentence = words.length / sentences.length;

      if (avgWordsPerSentence > 25) {
        this.addIssue({
          code: 'LONG_SENTENCES',
          message: `Average sentence length is high (${avgWordsPerSentence.toFixed(1)} words)`,
          severity: 'info',
          recommendation: 'Break up long sentences for better readability. Aim for 15-20 words per sentence',
        });
        penalty += 5;
      }
    }

    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 3 && words.length > 300) {
      this.addIssue({
        code: 'FEW_PARAGRAPHS',
        message: 'Content has few paragraph breaks',
        severity: 'info',
        recommendation: 'Break up content into smaller paragraphs for better readability',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeKeywordDensity(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length > 3) {
        wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
      }
    }

    const totalWords = words.length;
    let penalty = 0;

    for (const [word, count] of wordFreq) {
      const density = (count / totalWords) * 100;
      if (density > 5) {
        this.addIssue({
          code: 'KEYWORD_STUFFING',
          message: `Word "${word}" appears too frequently (${density.toFixed(1)}% density)`,
          severity: 'warning',
          recommendation: 'Reduce repetition of this word. Aim for 1-3% keyword density',
        });
        penalty += 10;
      }
    }

    return penalty;
  }

  private calculateReadabilityMetrics(text: string): Record<string, number> {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = this.countSyllables(text);

    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

    // Flesch-Kincaid Reading Ease
    const fleschReadingEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
      fleschReadingEase: Math.round(Math.max(0, Math.min(100, fleschReadingEase))),
      fleschKincaidGrade: Math.round(Math.max(0, fleschKincaidGrade) * 10) / 10,
    };
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
      totalSyllables += this.countWordSyllables(word);
    }

    return totalSyllables;
  }

  private countWordSyllables(word: string): number {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length <= 3) return 1;

    let count = 0;
    const vowels = 'aeiouy';
    let prevIsVowel = false;

    for (const char of cleanWord) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevIsVowel) {
        count++;
      }
      prevIsVowel = isVowel;
    }

    // Handle silent 'e'
    if (cleanWord.endsWith('e')) {
      count--;
    }

    // Handle suffixes
    if (cleanWord.endsWith('le') && cleanWord.length > 2) {
      const beforeLe = cleanWord[cleanWord.length - 3];
      if (!vowels.includes(beforeLe)) {
        count++;
      }
    }

    return Math.max(1, count);
  }
}

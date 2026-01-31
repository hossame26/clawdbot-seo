import type { PlatformInfo, PageData } from '../types/index.js';

export abstract class BasePlatformDetector {
  protected pageData: PageData;

  constructor(pageData: PageData) {
    this.pageData = pageData;
  }

  abstract detect(): PlatformInfo | null;
}

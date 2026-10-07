/**
 * @fileOverview Template Service.
 * Manages loading, saving, and caching Document Templates independently from SQLite data.
 */

import { DocumentTemplate, DocumentType, TemplateFormat } from './template-types';
import { createDefaultTemplate, getAllDefaultTemplates } from './default-templates';

const STORAGE_KEY = 'dubsar_document_templates';

export class TemplateService {
  /**
   * Retrieves all templates, initializing defaults if storage is empty.
   */
  static getAllTemplates(): DocumentTemplate[] {
    if (typeof window === 'undefined') return getAllDefaultTemplates();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: DocumentTemplate[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load templates from localStorage:", e);
    }

    // Default initialization
    const defaults = getAllDefaultTemplates();
    this.saveAllTemplates(defaults);
    return defaults;
  }

  /**
   * Retrieves a specific template for a document type and format.
   */
  static getTemplate(documentType: DocumentType, format: TemplateFormat = '80mm'): DocumentTemplate {
    const all = this.getAllTemplates();
    const found = all.find(t => t.documentType === documentType && t.format === format);
    if (found) return found;

    const fallback = createDefaultTemplate(documentType, format);
    all.push(fallback);
    this.saveAllTemplates(all);
    return fallback;
  }

  /**
   * Saves or updates a template.
   */
  static saveTemplate(template: DocumentTemplate): void {
    const all = this.getAllTemplates();
    const index = all.findIndex(t => t.id === template.id || (t.documentType === template.documentType && t.format === template.format));
    
    if (index >= 0) {
      all[index] = template;
    } else {
      all.push(template);
    }

    this.saveAllTemplates(all);
  }

  /**
   * Resets a template or all templates to factory defaults.
   */
  static resetToDefault(documentType?: DocumentType, format?: TemplateFormat): void {
    if (!documentType) {
      const defaults = getAllDefaultTemplates();
      this.saveAllTemplates(defaults);
      return;
    }

    const all = this.getAllTemplates();
    const defaults = getAllDefaultTemplates();
    const filtered = all.filter(t => !(t.documentType === documentType && (!format || t.format === format)));
    
    const restored = defaults.filter(t => t.documentType === documentType && (!format || t.format === format));
    this.saveAllTemplates([...filtered, ...restored]);
  }

  private static saveAllTemplates(templates: DocumentTemplate[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      } catch (e) {
        console.error("Failed to persist templates:", e);
      }
    }
  }
}

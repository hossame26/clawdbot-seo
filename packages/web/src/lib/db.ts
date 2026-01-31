// Version sans base de données (pour Vercel)
// Les audits ne sont pas sauvegardés - uniquement en temps réel

import type { AuditResult } from './types';

export interface Project {
  id: number;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface AuditRecord {
  id: number;
  project_id: number | null;
  url: string;
  result: AuditResult;
  overall_score: number;
  technical_score: number;
  content_score: number;
  performance_score: number;
  mobile_score: number;
  issues_count: number;
  critical_count: number;
  created_at: string;
}

// Fonctions mock - retournent des données vides
export function createProject(name: string, url: string): Project {
  return {
    id: 1,
    name,
    url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getProject(id: number): Project | undefined {
  return undefined;
}

export function getProjectByUrl(url: string): Project | undefined {
  return undefined;
}

export function getAllProjects(): Project[] {
  return [];
}

export function saveAudit(url: string, result: AuditResult, projectId?: number): AuditRecord {
  const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
  return {
    id: Date.now(),
    project_id: projectId ?? null,
    url,
    result,
    overall_score: result.scores.overall,
    technical_score: result.scores.technical,
    content_score: result.scores.content,
    performance_score: result.scores.performance,
    mobile_score: result.scores.mobile,
    issues_count: result.issues.length,
    critical_count: criticalCount,
    created_at: new Date().toISOString(),
  };
}

export function getAudit(id: number): AuditRecord | undefined {
  return undefined;
}

export function getAuditsByProject(projectId: number, limit = 10): AuditRecord[] {
  return [];
}

export function getRecentAudits(limit = 10): AuditRecord[] {
  return [];
}

export function getSetting(key: string): string | undefined {
  return undefined;
}

export function setSetting(key: string, value: string): void {
  // No-op
}

export function deleteProject(id: number): void {
  // No-op
}

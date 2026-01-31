import { NextRequest, NextResponse } from 'next/server';
import { runLightAudit } from '@/lib/auditor';
import { saveAudit, getProjectByUrl } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const result = await runLightAudit(url);

    // Check if project exists for this URL
    let project;
    try {
      project = getProjectByUrl(new URL(url).origin);
    } catch {
      // Database might not exist yet
    }

    // Save to database
    let savedAudit;
    try {
      savedAudit = saveAudit(url, result, project?.id);
    } catch {
      // Continue without saving if DB fails
      savedAudit = { id: Date.now() };
    }

    return NextResponse.json({
      id: savedAudit.id,
      url: result.url,
      scores: result.scores,
      issuesCount: result.issues.length,
      criticalCount: result.issues.filter((i) => i.severity === 'critical').length,
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Audit failed' },
      { status: 500 }
    );
  }
}

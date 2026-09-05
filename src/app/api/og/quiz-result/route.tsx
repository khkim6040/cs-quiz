import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const VALID_TYPES = ['daily', 'topic', 'review'] as const;
const TYPE_LABELS: Record<string, string> = {
  daily: '오늘의 퀴즈',
  topic: '주제별 퀴즈',
  review: '복습 퀴즈',
};

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  if (value == null || value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawType = searchParams.get('type') || 'daily';
  const type = (VALID_TYPES as readonly string[]).includes(rawType) ? rawType : 'daily';
  const score = clampInt(searchParams.get('score'), 0, 0, 100);
  const total = clampInt(searchParams.get('total'), 0, 1, 200);
  const correct = clampInt(searchParams.get('correct'), 0, 0, total);
  const streakRaw = searchParams.get('streak');
  const streak = streakRaw ? clampInt(streakRaw, 0, 0, 9999) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b4e 50%, #1a1a2e 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px', height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px', color: 'white' }}>💡</span>
          </div>
          <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>CS Quiz</span>
        </div>
        <div style={{ fontSize: '20px', color: '#a78bfa', marginBottom: '12px', fontWeight: 600 }}>
          {TYPE_LABELS[type]}
        </div>
        <div style={{ fontSize: '96px', fontWeight: 'bold', color: '#fb923c', lineHeight: 1 }}>
          {score}점
        </div>
        <div style={{ fontSize: '28px', color: '#94a3b8', marginTop: '12px' }}>
          {correct} / {total} 정답
        </div>
        {streak !== null && streak > 0 && (
          <div
            style={{
              marginTop: '24px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'rgba(251, 146, 60, 0.2)',
              border: '1px solid rgba(251, 146, 60, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontSize: '18px', color: '#fb923c', fontWeight: 600 }}>연속 {streak}일</span>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

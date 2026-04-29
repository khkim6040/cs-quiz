import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'daily';
  const score = searchParams.get('score') || '0';
  const correct = searchParams.get('correct') || '0';
  const total = searchParams.get('total') || '0';
  const streak = searchParams.get('streak');

  const typeLabel: Record<string, string> = {
    daily: '오늘의 퀴즈',
    topic: '주제별 퀴즈',
    review: '복습 퀴즈',
  };

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
          {typeLabel[type] || typeLabel.daily}
        </div>
        <div style={{ fontSize: '96px', fontWeight: 'bold', color: '#fb923c', lineHeight: 1 }}>
          {score}점
        </div>
        <div style={{ fontSize: '28px', color: '#94a3b8', marginTop: '12px' }}>
          {correct} / {total} 정답
        </div>
        {streak && Number(streak) > 0 && (
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

import prisma from './prisma';

const TOPIC_ORDER = [
  'algorithm',
  'dataStructure',
  'operatingSystem',
  'computerNetworking',
  'database',
  'computerSecurity',
  'computerArchitecture',
  'softwareEngineering',
  'springBoot',
];

function getWeekStart(date: Date = new Date()): Date {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(date.getTime() + kstOffset);
  const day = kst.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  // KST Monday 00:00:00 = UTC Sunday 15:00:00 (subtract KST offset)
  const mondayKST = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + diff));
  return new Date(mondayKST.getTime() - kstOffset);
}

function getWeekNumber(date: Date): number {
  const start = new Date(Date.UTC(2026, 0, 5)); // 2026-01-05 Monday baseline
  const weekStart = getWeekStart(date);
  const diff = weekStart.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export async function getCurrentChallenge() {
  const weekStart = getWeekStart();

  let challenge = await prisma.weeklyChallenge.findUnique({
    where: { weekStart },
    include: { topic: { select: { id: true, name_ko: true, name_en: true } } },
  });

  if (!challenge) {
    const weekNum = getWeekNumber(new Date());
    const topicId = TOPIC_ORDER[((weekNum % TOPIC_ORDER.length) + TOPIC_ORDER.length) % TOPIC_ORDER.length];

    try {
      challenge = await prisma.weeklyChallenge.create({
        data: { weekStart, topicId },
        include: { topic: { select: { id: true, name_ko: true, name_en: true } } },
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        challenge = await prisma.weeklyChallenge.findUnique({
          where: { weekStart },
          include: { topic: { select: { id: true, name_ko: true, name_en: true } } },
        });
        if (!challenge) throw e;
      } else {
        throw e;
      }
    }
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const remainingMs = weekEnd.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  return { challenge, weekStart, weekEnd, remainingDays };
}

export { getWeekStart };

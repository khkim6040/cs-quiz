// src/lib/timezone.ts

/**
 * 한국 시간(KST, UTC+9) 기준으로 오늘 날짜를 계산합니다.
 * 데이터베이스에는 UTC 기준 날짜로 저장되지만, 
 * 실제 날짜는 한국 시간을 기준으로 합니다.
 * 
 * @returns UTC 기준으로 저장할 날짜 (시간은 00:00:00.000)
 */
export function getTodayInKST(): Date {
  const now = new Date();
  const kstOffset = 9 * 60; // 9시간을 분으로
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  // UTC 기준으로 한국 시간의 날짜만 추출하여 00:00:00으로 설정
  return new Date(Date.UTC(
    kstTime.getUTCFullYear(),
    kstTime.getUTCMonth(),
    kstTime.getUTCDate(),
    0, 0, 0, 0
  ));
}

/**
 * 특정 날짜를 한국 시간 기준으로 변환합니다.
 * 
 * @param date 변환할 날짜
 * @returns 한국 시간으로 변환된 날짜
 */
export function toKST(date: Date): Date {
  const kstOffset = 9 * 60;
  return new Date(date.getTime() + kstOffset * 60 * 1000);
}

/** Korea-first geo labels for Live Dashboard drill-down. */

export type LiveGeoLevel = 'world' | 'country' | 'metro' | 'district' | 'gym' | 'user';

export interface LiveGeoNode {
  level: LiveGeoLevel;
  code: string;
  name: { ko: string; en: string };
  flag?: string;
}

export const LIVE_COUNTRIES: LiveGeoNode[] = [
  { level: 'country', code: 'KR', name: { ko: '대한민국', en: 'South Korea' }, flag: '🇰🇷' },
  { level: 'country', code: 'US', name: { ko: '미국', en: 'United States' }, flag: '🇺🇸' },
  { level: 'country', code: 'JP', name: { ko: '일본', en: 'Japan' }, flag: '🇯🇵' },
  { level: 'country', code: 'CN', name: { ko: '중국', en: 'China' }, flag: '🇨🇳' },
];

export const LIVE_KR_METROS: LiveGeoNode[] = [
  { level: 'metro', code: 'seoul', name: { ko: '서울특별시', en: 'Seoul' } },
  { level: 'metro', code: 'gyeonggi', name: { ko: '경기도', en: 'Gyeonggi' } },
  { level: 'metro', code: 'busan', name: { ko: '부산광역시', en: 'Busan' } },
  { level: 'metro', code: 'incheon', name: { ko: '인천광역시', en: 'Incheon' } },
  { level: 'metro', code: 'daegu', name: { ko: '대구광역시', en: 'Daegu' } },
  { level: 'metro', code: 'daejeon', name: { ko: '대전광역시', en: 'Daejeon' } },
  { level: 'metro', code: 'gwangju', name: { ko: '광주광역시', en: 'Gwangju' } },
  { level: 'metro', code: 'ulsan', name: { ko: '울산광역시', en: 'Ulsan' } },
  { level: 'metro', code: 'gangwon', name: { ko: '강원특별자치도', en: 'Gangwon' } },
  { level: 'metro', code: 'chungbuk', name: { ko: '충청북도', en: 'Chungbuk' } },
  { level: 'metro', code: 'chungnam', name: { ko: '충청남도', en: 'Chungnam' } },
  { level: 'metro', code: 'jeonbuk', name: { ko: '전북특별자치도', en: 'Jeonbuk' } },
  { level: 'metro', code: 'jeonnam', name: { ko: '전라남도', en: 'Jeonnam' } },
  { level: 'metro', code: 'gyeongbuk', name: { ko: '경상북도', en: 'Gyeongbuk' } },
  { level: 'metro', code: 'gyeongnam', name: { ko: '경상남도', en: 'Gyeongnam' } },
  { level: 'metro', code: 'jeju', name: { ko: '제주특별자치도', en: 'Jeju' } },
];

export const LIVE_KR_DISTRICTS: Record<string, LiveGeoNode[]> = {
  seoul: [
    { level: 'district', code: 'gangnam', name: { ko: '강남구', en: 'Gangnam-gu' } },
    { level: 'district', code: 'gangseo', name: { ko: '강서구', en: 'Gangseo-gu' } },
    { level: 'district', code: 'mapo', name: { ko: '마포구', en: 'Mapo-gu' } },
    { level: 'district', code: 'songpa', name: { ko: '송파구', en: 'Songpa-gu' } },
    { level: 'district', code: 'nowon', name: { ko: '노원구', en: 'Nowon-gu' } },
    { level: 'district', code: 'yongsan', name: { ko: '용산구', en: 'Yongsan-gu' } },
  ],
  gyeonggi: [
    { level: 'district', code: 'suwon', name: { ko: '수원시', en: 'Suwon' } },
    { level: 'district', code: 'seongnam', name: { ko: '성남시', en: 'Seongnam' } },
    { level: 'district', code: 'goyang', name: { ko: '고양시', en: 'Goyang' } },
    { level: 'district', code: 'bucheon', name: { ko: '부천시', en: 'Bucheon' } },
    { level: 'district', code: 'yongin', name: { ko: '용인시', en: 'Yongin' } },
    { level: 'district', code: 'anyang', name: { ko: '안양시', en: 'Anyang' } },
  ],
  busan: [
    { level: 'district', code: 'haeundae', name: { ko: '해운대구', en: 'Haeundae-gu' } },
    { level: 'district', code: 'busanjin', name: { ko: '부산진구', en: 'Busanjin-gu' } },
    { level: 'district', code: 'dongnae', name: { ko: '동래구', en: 'Dongnae-gu' } },
    { level: 'district', code: 'sasang', name: { ko: '사상구', en: 'Sasang-gu' } },
  ],
  incheon: [
    { level: 'district', code: 'namdong', name: { ko: '남동구', en: 'Namdong-gu' } },
    { level: 'district', code: 'yeonsu', name: { ko: '연수구', en: 'Yeonsu-gu' } },
    { level: 'district', code: 'bupyeong', name: { ko: '부평구', en: 'Bupyeong-gu' } },
    { level: 'district', code: 'michuhol', name: { ko: '미추홀구', en: 'Michuhol-gu' } },
  ],
  daegu: [
    { level: 'district', code: 'suseong', name: { ko: '수성구', en: 'Suseong-gu' } },
    { level: 'district', code: 'dalseo', name: { ko: '달서구', en: 'Dalseo-gu' } },
    { level: 'district', code: 'jung', name: { ko: '중구', en: 'Jung-gu' } },
  ],
  daejeon: [
    { level: 'district', code: 'yuseong', name: { ko: '유성구', en: 'Yuseong-gu' } },
    { level: 'district', code: 'seo', name: { ko: '서구', en: 'Seo-gu' } },
    { level: 'district', code: 'jung', name: { ko: '중구', en: 'Jung-gu' } },
  ],
  gwangju: [
    { level: 'district', code: 'buk', name: { ko: '북구', en: 'Buk-gu' } },
    { level: 'district', code: 'seo', name: { ko: '서구', en: 'Seo-gu' } },
    { level: 'district', code: 'nam', name: { ko: '남구', en: 'Nam-gu' } },
  ],
  ulsan: [
    { level: 'district', code: 'nam', name: { ko: '남구', en: 'Nam-gu' } },
    { level: 'district', code: 'jung', name: { ko: '중구', en: 'Jung-gu' } },
    { level: 'district', code: 'dong', name: { ko: '동구', en: 'Dong-gu' } },
  ],
  gangwon: [
    { level: 'district', code: 'chuncheon', name: { ko: '춘천시', en: 'Chuncheon' } },
    { level: 'district', code: 'wonju', name: { ko: '원주시', en: 'Wonju' } },
    { level: 'district', code: 'gangneung', name: { ko: '강릉시', en: 'Gangneung' } },
  ],
  chungbuk: [
    { level: 'district', code: 'cheongju', name: { ko: '청주시', en: 'Cheongju' } },
    { level: 'district', code: 'chungju', name: { ko: '충주시', en: 'Chungju' } },
  ],
  chungnam: [
    { level: 'district', code: 'cheonan', name: { ko: '천안시', en: 'Cheonan' } },
    { level: 'district', code: 'asan', name: { ko: '아산시', en: 'Asan' } },
  ],
  jeonbuk: [
    { level: 'district', code: 'jeonju', name: { ko: '전주시', en: 'Jeonju' } },
    { level: 'district', code: 'iksan', name: { ko: '익산시', en: 'Iksan' } },
  ],
  jeonnam: [
    { level: 'district', code: 'mokpo', name: { ko: '목포시', en: 'Mokpo' } },
    { level: 'district', code: 'yeosu', name: { ko: '여수시', en: 'Yeosu' } },
  ],
  gyeongbuk: [
    { level: 'district', code: 'pohang', name: { ko: '포항시', en: 'Pohang' } },
    { level: 'district', code: 'gumi', name: { ko: '구미시', en: 'Gumi' } },
  ],
  gyeongnam: [
    { level: 'district', code: 'changwon', name: { ko: '창원시', en: 'Changwon' } },
    { level: 'district', code: 'gimhae', name: { ko: '김해시', en: 'Gimhae' } },
  ],
  jeju: [
    { level: 'district', code: 'jeju', name: { ko: '제주시', en: 'Jeju City' } },
    { level: 'district', code: 'seogwipo', name: { ko: '서귀포시', en: 'Seogwipo' } },
  ],
};

export function liveGeoLabel(
  level: LiveGeoLevel,
  code: string,
  locale: string,
  fallback = code
): string {
  const ko = locale.startsWith('ko');
  if (level === 'world') return ko ? '전 세계' : 'World';
  if (level === 'country') {
    const hit = LIVE_COUNTRIES.find((c) => c.code === code);
    return hit ? (ko ? hit.name.ko : hit.name.en) : fallback;
  }
  if (level === 'metro') {
    const hit = LIVE_KR_METROS.find((m) => m.code === code);
    return hit ? (ko ? hit.name.ko : hit.name.en) : fallback;
  }
  if (level === 'district') {
    for (const list of Object.values(LIVE_KR_DISTRICTS)) {
      const hit = list.find((d) => d.code === code);
      if (hit) return ko ? hit.name.ko : hit.name.en;
    }
  }
  return fallback;
}

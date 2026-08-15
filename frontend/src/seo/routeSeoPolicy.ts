/**
 * Index / noindex policy by app path (react-router pathname, no basename).
 * Keep in sync with public/robots.txt and sitemap generator.
 */

export type SeoPathPolicy = {
  robots: 'index,follow' | 'noindex,nofollow' | 'noindex,follow';
  defaultTitle?: string;
  defaultDescription?: string;
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

const FORCE_NOINDEX: RegExp[] = [
  /^\/login$/,
  /^\/auth(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/owner(\/|$)/,
  /^\/my-page(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/fortune(\/|$)/,
  /^\/records(\/|$)/,
  /^\/history(\/|$)/,
  /^\/favorites(\/|$)/,
  /^\/recommend(\/|$)/,
  /^\/friends(\/|$)/,
  /^\/push(\/|$)/,
  /^\/notifications(\/|$)/,
  /^\/easy(\/|$)/,
  /^\/scan(\/|$)/,
  /^\/qr(\/|$)/,
  /^\/equipment(\/|$)/,
  /^\/report-machine(\/|$)/,
  /^\/trainer(\/|$)/,
  /^\/growth-analysis(\/|$)/,
  /^\/online-pt(\/|$)/,
  /^\/trade(\/|$)/,
  /^\/community\/(requests|free|photo|templates|posts)(\/|$)/,
  /^\/community\/notices\/[^/]+$/,
  /^\/gyms\/[^/]+$/,
  /^\/support\/[^/]+$/,
];

type Rule = { match: (p: string) => boolean; policy: SeoPathPolicy };

const INDEX_RULES: Rule[] = [
  {
    match: (p) => p === '/',
    policy: {
      robots: 'index,follow',
      defaultTitle: 'MachineFit | 헬스장 머신 운동과 운동기록',
      defaultDescription:
        '헬스장 머신별 맞춤 세팅과 운동 기록을 MachineFit에서 관리하세요. 브랜드·머신 검색부터 추천 중량까지.',
    },
  },
  {
    match: (p) => p === '/machines',
    policy: {
      robots: 'index,follow',
      defaultTitle: '헬스장 머신 검색',
      defaultDescription:
        '해머 스트렝스, 사이벡스, 라이프 피트니스, 테크노짐 등 헬스장 머신을 검색하고 맞춤 세팅을 확인하세요.',
    },
  },
  {
    match: (p) => /^\/machines\/[^/]+$/.test(p),
    policy: {
      robots: 'index,follow',
      defaultTitle: '머신 상세',
      defaultDescription: '헬스장 머신 사용법과 맞춤 세팅을 MachineFit에서 확인하세요.',
    },
  },
  {
    match: (p) => p === '/brands',
    policy: {
      robots: 'index,follow',
      defaultTitle: '헬스 머신 브랜드',
      defaultDescription:
        'Hammer Strength, Cybex, Life Fitness, Technogym 등 헬스장 머신 브랜드를 MachineFit에서 살펴보세요.',
    },
  },
  {
    match: (p) => /^\/brands\/[^/]+$/.test(p),
    policy: {
      robots: 'index,follow',
      defaultTitle: '브랜드 머신',
      defaultDescription: '브랜드별 헬스장 머신 목록과 세팅 가이드를 MachineFit에서 확인하세요.',
    },
  },
  {
    match: (p) => p === '/gyms',
    policy: {
      robots: 'index,follow',
      defaultTitle: '헬스장 찾기',
      defaultDescription: '내 주변 헬스장을 찾고 MachineFit으로 운동을 기록하세요.',
    },
  },
  {
    match: (p) =>
      [
        '/terms',
        '/privacy',
        '/security',
        '/refund',
        '/location-policy',
        '/community-policy',
        '/copyright',
      ].includes(p) || p.startsWith('/legal/'),
    policy: {
      robots: 'index,follow',
      defaultTitle: '약관 및 정책',
      defaultDescription: 'MachineFit 서비스 이용약관과 개인정보 처리방침 등 법적 고지입니다.',
    },
  },
  {
    match: (p) => p === '/community',
    policy: {
      robots: 'index,follow',
      defaultTitle: '커뮤니티',
      defaultDescription: 'MachineFit 커뮤니티 — 머신 요청, 공지, 템플릿 공유 허브.',
    },
  },
  {
    match: (p) => p === '/community/notices',
    policy: {
      robots: 'index,follow',
      defaultTitle: '공지사항',
      defaultDescription: 'MachineFit 서비스 공지사항을 확인하세요.',
    },
  },
  {
    match: (p) => p === '/support',
    policy: {
      robots: 'index,follow',
      defaultTitle: '고객 지원',
      defaultDescription: 'MachineFit 고객 지원 및 문의 안내입니다.',
    },
  },
];

export function resolveSeoPathPolicy(
  pathname: string,
  search = ''
): SeoPathPolicy {
  const path = normalizePath(pathname);
  const hasQuery = Boolean(search && search !== '?');

  for (const re of FORCE_NOINDEX) {
    if (re.test(path)) {
      return { robots: 'noindex,nofollow' };
    }
  }

  for (const rule of INDEX_RULES) {
    if (rule.match(path)) {
      if (hasQuery) {
        return {
          ...rule.policy,
          robots: 'noindex,follow',
        };
      }
      return rule.policy;
    }
  }

  return { robots: 'noindex,follow' };
}

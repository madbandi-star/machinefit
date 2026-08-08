/** UI-only maps for displaying stem/branch Han with Korean labels. */

export type StemCode =
  | 'jia'
  | 'yi'
  | 'bing'
  | 'ding'
  | 'wu'
  | 'ji'
  | 'geng'
  | 'xin'
  | 'ren'
  | 'gui';

export type BranchCode =
  | 'zi'
  | 'chou'
  | 'yin'
  | 'mao'
  | 'chen'
  | 'si'
  | 'wu'
  | 'wei'
  | 'shen'
  | 'you'
  | 'xu'
  | 'hai';

export type ElementCode = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const STEM_BY_HAN: Record<
  string,
  { code: StemCode; ko: string; element: ElementCode; yinYang: 'yin' | 'yang' }
> = {
  甲: { code: 'jia', ko: '갑', element: 'wood', yinYang: 'yang' },
  乙: { code: 'yi', ko: '을', element: 'wood', yinYang: 'yin' },
  丙: { code: 'bing', ko: '병', element: 'fire', yinYang: 'yang' },
  丁: { code: 'ding', ko: '정', element: 'fire', yinYang: 'yin' },
  戊: { code: 'wu', ko: '무', element: 'earth', yinYang: 'yang' },
  己: { code: 'ji', ko: '기', element: 'earth', yinYang: 'yin' },
  庚: { code: 'geng', ko: '경', element: 'metal', yinYang: 'yang' },
  辛: { code: 'xin', ko: '신', element: 'metal', yinYang: 'yin' },
  壬: { code: 'ren', ko: '임', element: 'water', yinYang: 'yang' },
  癸: { code: 'gui', ko: '계', element: 'water', yinYang: 'yin' },
};

const BRANCH_BY_HAN: Record<
  string,
  { code: BranchCode; ko: string; element: ElementCode; yinYang: 'yin' | 'yang' }
> = {
  子: { code: 'zi', ko: '자', element: 'water', yinYang: 'yang' },
  丑: { code: 'chou', ko: '축', element: 'earth', yinYang: 'yin' },
  寅: { code: 'yin', ko: '인', element: 'wood', yinYang: 'yang' },
  卯: { code: 'mao', ko: '묘', element: 'wood', yinYang: 'yin' },
  辰: { code: 'chen', ko: '진', element: 'earth', yinYang: 'yang' },
  巳: { code: 'si', ko: '사', element: 'fire', yinYang: 'yin' },
  午: { code: 'wu', ko: '오', element: 'fire', yinYang: 'yang' },
  未: { code: 'wei', ko: '미', element: 'earth', yinYang: 'yin' },
  申: { code: 'shen', ko: '신', element: 'metal', yinYang: 'yang' },
  酉: { code: 'you', ko: '유', element: 'metal', yinYang: 'yin' },
  戌: { code: 'xu', ko: '술', element: 'earth', yinYang: 'yang' },
  亥: { code: 'hai', ko: '해', element: 'water', yinYang: 'yin' },
};

export function resolveStem(han: string | null | undefined) {
  if (!han) return null;
  return STEM_BY_HAN[han] ?? null;
}

export function resolveBranch(han: string | null | undefined) {
  if (!han) return null;
  return BRANCH_BY_HAN[han] ?? null;
}

export interface PillarDisplay {
  stemHan: string;
  branchHan: string;
  stemKo: string;
  branchKo: string;
  stemCode: StemCode | null;
  branchCode: BranchCode | null;
  stemElement: ElementCode | null;
  branchElement: ElementCode | null;
  stemYinYang: 'yin' | 'yang' | null;
  label: string;
}

export function buildPillarDisplay(
  stemHan: string | null | undefined,
  branchHan: string | null | undefined
): PillarDisplay | null {
  if (!stemHan || !branchHan) return null;
  const stem = resolveStem(stemHan);
  const branch = resolveBranch(branchHan);
  return {
    stemHan,
    branchHan,
    stemKo: stem?.ko ?? stemHan,
    branchKo: branch?.ko ?? branchHan,
    stemCode: stem?.code ?? null,
    branchCode: branch?.code ?? null,
    stemElement: stem?.element ?? null,
    branchElement: branch?.element ?? null,
    stemYinYang: stem?.yinYang ?? null,
    label: stem && branch ? `${stem.ko}${branch.ko}(${stemHan}${branchHan})` : `${stemHan}${branchHan}`,
  };
}

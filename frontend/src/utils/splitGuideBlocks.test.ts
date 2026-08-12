import assert from 'node:assert/strict';
import {
  flattenGuidePlainText,
  sourcePlainText,
  splitGuideBlocks,
  splitSentences,
} from './splitGuideBlocks.ts';

const privacyS1 =
  '소셜 로그인 제공자 식별자·이메일(제공 시)·프로필 사진 URL(제공 시), 표시 이름(아이디), 가입 시 필수 생년월일(만 14세 확인용, 주민등록번호 미수집), 성별·키·몸무게·나이·출생시간(입력 시, 운세 등), 운동 목표·경력·표시 단위, 홈 헬스장, 지역(선택·시군구 등 행정구역만; 회원 GPS·현재위치 좌표는 수집·저장·서버 전송하지 않음), 운동 기록·계획 카드·템플릿·업적·성장/DNA 분석 파생값, 친구·알림·사진·거래·온라인 PT·문의·신고, 결제·구독 메타데이터(Polar 고객/구독 ID 등; 카드번호는 결제사 보관), 기능별 사용량(일/월 집계), 운영 텔레메트리(페이지 경로·체류시간·세션 ID·기기/OS/브라우저 분류·IP·User-Agent·회원별 활동일; 장애·보안·품질용), 동의·로그인 로그(IP·UA), 배너 노출·클릭(세션 ID만, 회원 ID 미저장), 세션 갱신 토큰(sessionStorage 및 HttpOnly 쿠키), 기기 localStorage의 UI 설정·검색·닫기 기록 등을 처리할 수 있습니다. 헬스장 오너 시설 회원명부(이름·이메일·생년월일 등)는 시설 관리용이며 만 14세 미만이 포함될 수 있습니다(머신핏 계정과 별개).';

const cookieNotice =
  '광고·마케팅 추적 쿠키·외부 광고 SDK는 쓰지 않습니다. 로그인 유지를 위해 브라우저 sessionStorage와 (허용 시) HttpOnly 쿠키를 쓰고, UI 설정·최근 검색·공지 닫기·PWA 관련 플래그 등은 기기 localStorage에 저장할 수 있습니다. 서비스 품질·장애 대응을 위한 운영 이용 통계는 쿠키가 아니라 앱→서버 API로 수집합니다(개인정보처리방침 참조).';

const deleteConfirm =
  '탈퇴하면 머신핏 이용이 종료됩니다.\n\n• 바로 처리: 이메일·이름 등 식별정보 익명화, 지역·홈헬스장·신체/출생 정보 삭제, 활성 소셜 로그인 연결 해제, 세션 토큰 삭제. 유료 구독은 해지를 시도합니다.\n• 약 30일 후 삭제: 운동기록·즐겨찾기·친구·게시글·사진·거래·온라인PT·문의·템플릿·업적, 기능 사용량, 운영 활동/접속 로그(회원 연결분), 본인 헬스장 회원명부, 업로드 파일.\n• 남는 것: 결제·구독 증빙, 동의 기록, 무료체험 남용방지 식별키, 소셜제공자 식별자 아카이브(재가입·감사·분쟁 대응). 자동 만료 삭제는 하지 않으며 목적 달성·법령 기간 후 별도 파기합니다.\n• 재가입해도 기존 계정·기록은 복구되지 않습니다.';

function assertWordingPreserved(source: string) {
  const blocks = splitGuideBlocks(source);
  assert.equal(flattenGuidePlainText(blocks), sourcePlainText(source));
}

assert.deepEqual(splitSentences('한 문장입니다.'), ['한 문장입니다.']);
assert.equal(splitSentences(cookieNotice).length, 3);

const cookieBlocks = splitGuideBlocks(cookieNotice);
assert.ok(cookieBlocks.length >= 2);
assert.ok(cookieBlocks.length <= 3);
assertWordingPreserved(cookieNotice);

const privacyBlocks = splitGuideBlocks(privacyS1);
assert.equal(privacyBlocks.length, 2);
assert.equal(privacyBlocks[0]?.type, 'p');
assert.equal(privacyBlocks[1]?.type, 'p');
assertWordingPreserved(privacyS1);

const termsS1 = splitGuideBlocks(
  'MachineFit은 헬스장 머신 설정·운동 기록·커뮤니티 기능을 제공하는 참고용 서비스입니다. 의료·재활 진단을 대체하지 않습니다.'
);
assert.equal(termsS1.length, 2);
assert.equal(termsS1[0]?.type, 'p');
assert.equal(termsS1[1]?.type, 'note');
assertWordingPreserved(
  'MachineFit은 헬스장 머신 설정·운동 기록·커뮤니티 기능을 제공하는 참고용 서비스입니다. 의료·재활 진단을 대체하지 않습니다.'
);

const deleteBlocks = splitGuideBlocks(deleteConfirm);
assert.equal(deleteBlocks[0]?.type, 'p');
assert.equal(deleteBlocks[1]?.type, 'list');
if (deleteBlocks[1]?.type === 'list') {
  assert.equal(deleteBlocks[1].items.length, 4);
  assert.ok(deleteBlocks[1].items[0]?.startsWith('바로 처리:'));
}
assertWordingPreserved(deleteConfirm);

const emailBody =
  '개인정보 보호 관련 문의는 고객센터 이메일(machinefit.official@gmail.com) 또는 앱 내 문의하기를 이용해 주세요.';
assert.equal(splitGuideBlocks(emailBody).length, 1);
assertWordingPreserved(emailBody);

const short = splitGuideBlocks('지역은 설정에서 직접 선택하는 선택 항목입니다.');
assert.equal(short.length, 1);
assert.equal(short[0]?.type, 'p');

console.log('splitGuideBlocks.test.ts ok');

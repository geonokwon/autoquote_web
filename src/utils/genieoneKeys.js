// 지니원 혜택 상품 key 추출 함수
export function extractGenieoneKeys(benefitResults) {
  if (!benefitResults || !benefitResults.productBenefits) return [];
  // 모든 지니원혜택 title을 합침
  const titles = benefitResults.productBenefits
    .filter(b => b.title && b.title.includes('지니원혜택'))
    .map(b => b.title)
    .join(' ');
  if (!titles) return [];
  const keyMap = {
    '인터넷': 'internet',
    '전화': 'phone',
    'CCTV': 'cctv',
    'POS': 'pos',
    '하이오더': 'highorder',
    '서빙로봇': 'servingbot',
    '정수기': 'water'
  };
  // 인터넷이 들어가 있고, 다른 결합상품도 같이 있으면 title에 포함된 상품만 칩으로 표기
  if (titles.includes('인터넷')) {
    const hasOther = Object.keys(keyMap).some(kor => kor !== '인터넷' && titles.includes(kor));
    if (hasOther) {
      return Object.entries(keyMap)
        .filter(([kor]) => titles.includes(kor))
        .map(([_, key]) => key);
    } else {
      // 인터넷만 단독이면 칩 없음
      return [];
    }
  }
  // 아니면 기존대로
  return Object.entries(keyMap)
    .filter(([kor]) => titles.includes(kor))
    .map(([_, key]) => key);
} 
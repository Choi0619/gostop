// 화투 48장 정의
// type: gwang(광), yeol(열끗), tti(띠), pi(피)
// ttiColor: hong(홍단), cheong(청단), cho(초단), plain(비띠)
// special: ssangpi(쌍피), gukjin(국진=9월열끗, 쌍피 선택가능), bigwang(비광)

export const MONTHS = {
  1: { name: '송학', plant: '소나무', color: '#2d6a4f' },
  2: { name: '매조', plant: '매화', color: '#c9184a' },
  3: { name: '벚꽃', plant: '벚꽃', color: '#ff8fab' },
  4: { name: '흑싸리', plant: '등나무', color: '#5a189a' },
  5: { name: '난초', plant: '난초', color: '#7209b7' },
  6: { name: '모란', plant: '모란', color: '#d00000' },
  7: { name: '홍싸리', plant: '싸리', color: '#9d0208' },
  8: { name: '공산', plant: '억새', color: '#495057' },
  9: { name: '국진', plant: '국화', color: '#e85d04' },
  10: { name: '단풍', plant: '단풍', color: '#bc3908' },
  11: { name: '오동', plant: '오동', color: '#1b4332' },
  12: { name: '비', plant: '버들', color: '#343a40' },
};

// id: `${month}-${index}`
export const CARDS = [
  // 1월 송학
  { id: '1-0', month: 1, type: 'gwang', label: '송학 광' },
  { id: '1-1', month: 1, type: 'tti', ttiColor: 'hong', label: '홍단' },
  { id: '1-2', month: 1, type: 'pi', label: '피' },
  { id: '1-3', month: 1, type: 'pi', label: '피' },
  // 2월 매조
  { id: '2-0', month: 2, type: 'yeol', animal: '꾀꼬리', godori: true, label: '열끗' },
  { id: '2-1', month: 2, type: 'tti', ttiColor: 'hong', label: '홍단' },
  { id: '2-2', month: 2, type: 'pi', label: '피' },
  { id: '2-3', month: 2, type: 'pi', label: '피' },
  // 3월 벚꽃
  { id: '3-0', month: 3, type: 'gwang', label: '벚꽃 광' },
  { id: '3-1', month: 3, type: 'tti', ttiColor: 'hong', label: '홍단' },
  { id: '3-2', month: 3, type: 'pi', label: '피' },
  { id: '3-3', month: 3, type: 'pi', label: '피' },
  // 4월 흑싸리
  { id: '4-0', month: 4, type: 'yeol', animal: '두견새', godori: true, label: '열끗' },
  { id: '4-1', month: 4, type: 'tti', ttiColor: 'cho', label: '초단' },
  { id: '4-2', month: 4, type: 'pi', label: '피' },
  { id: '4-3', month: 4, type: 'pi', label: '피' },
  // 5월 난초
  { id: '5-0', month: 5, type: 'yeol', animal: '다리', label: '열끗' },
  { id: '5-1', month: 5, type: 'tti', ttiColor: 'cho', label: '초단' },
  { id: '5-2', month: 5, type: 'pi', label: '피' },
  { id: '5-3', month: 5, type: 'pi', label: '피' },
  // 6월 모란
  { id: '6-0', month: 6, type: 'yeol', animal: '나비', label: '열끗' },
  { id: '6-1', month: 6, type: 'tti', ttiColor: 'cheong', label: '청단' },
  { id: '6-2', month: 6, type: 'pi', label: '피' },
  { id: '6-3', month: 6, type: 'pi', label: '피' },
  // 7월 홍싸리
  { id: '7-0', month: 7, type: 'yeol', animal: '멧돼지', label: '열끗' },
  { id: '7-1', month: 7, type: 'tti', ttiColor: 'cho', label: '초단' },
  { id: '7-2', month: 7, type: 'pi', label: '피' },
  { id: '7-3', month: 7, type: 'pi', label: '피' },
  // 8월 공산
  { id: '8-0', month: 8, type: 'gwang', label: '공산 광' },
  { id: '8-1', month: 8, type: 'yeol', animal: '기러기', godori: true, label: '열끗' },
  { id: '8-2', month: 8, type: 'pi', label: '피' },
  { id: '8-3', month: 8, type: 'pi', label: '피' },
  // 9월 국진
  { id: '9-0', month: 9, type: 'yeol', special: 'gukjin', animal: '술잔', label: '국진' },
  { id: '9-1', month: 9, type: 'tti', ttiColor: 'cheong', label: '청단' },
  { id: '9-2', month: 9, type: 'pi', label: '피' },
  { id: '9-3', month: 9, type: 'pi', label: '피' },
  // 10월 단풍
  { id: '10-0', month: 10, type: 'yeol', animal: '사슴', label: '열끗' },
  { id: '10-1', month: 10, type: 'tti', ttiColor: 'cheong', label: '청단' },
  { id: '10-2', month: 10, type: 'pi', label: '피' },
  { id: '10-3', month: 10, type: 'pi', label: '피' },
  // 11월 오동
  { id: '11-0', month: 11, type: 'gwang', label: '오동 광' },
  { id: '11-1', month: 11, type: 'pi', special: 'ssangpi', label: '쌍피' },
  { id: '11-2', month: 11, type: 'pi', label: '피' },
  { id: '11-3', month: 11, type: 'pi', label: '피' },
  // 12월 비
  { id: '12-0', month: 12, type: 'gwang', special: 'bigwang', label: '비광' },
  { id: '12-1', month: 12, type: 'yeol', animal: '제비', label: '열끗' },
  { id: '12-2', month: 12, type: 'tti', ttiColor: 'plain', label: '비띠' },
  { id: '12-3', month: 12, type: 'pi', special: 'ssangpi', label: '쌍피' },
];

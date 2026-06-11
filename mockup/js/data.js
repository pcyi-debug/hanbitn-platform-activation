/* =========================================================
   목업 데이터 — 한빛앤(주) 플랫폼 활성화 대시보드
   모든 수치는 PRD/KPI 문서 기반의 예시(가정) 데이터입니다.
   화면은 이 데이터를 읽어 렌더링됩니다.
   ========================================================= */

const MOCK = {
  // 상단 KPI (북극성 + 선행/후행)
  kpis: {
    nsm: {
      label: "활성화율 (NSM) · 첫 결과물 생성 도달률",
      value: 38,
      unit: "%",
      delta: +5,
      baseline: 30,
      q1Target: 45,
      q2Target: 55,
      foot: "팀(워크스페이스) 단위 · 가입 팀 중 첫 결과물 생성 도달",
    },
    cards: [
      { label: "온보딩 완료율", value: "61%", delta: +4, foot: "선행 지표" },
      { label: "첫 결과물 도달률", value: "38%", delta: +5, foot: "선행 지표" },
      { label: "D7 팀 리텐션", value: "15%", delta: +3, foot: "후행 지표 · 목표 17%" },
      { label: "주간 활성 팀 수", value: "842", delta: +38, deltaUnit: "팀", foot: "후행 지표 · WAU(팀)" },
    ],
  },

  // 헤더 필터 → 화면에 실제로 반영되는 세그먼트 프로파일.
  // 워크스페이스 셀렉터가 KPI/퍼널 수치를 바꾸고, 기간 셀렉터가 변화량(delta)을 조정한다.
  workspaceProfiles: {
    "전체 워크스페이스": { nsm: 38, totalTeams: 2200, funnelPct: [100, 61, 38, 24, 15], cards: ["61%", "38%", "15%", "842"] },
    "엔터프라이즈 팀": { nsm: 52, totalTeams: 540, funnelPct: [100, 74, 52, 36, 24], cards: ["78%", "52%", "23%", "312"] },
    "스타트업 팀": { nsm: 34, totalTeams: 980, funnelPct: [100, 58, 34, 20, 12], cards: ["57%", "34%", "13%", "348"] },
    "신규 가입 팀": { nsm: 22, totalTeams: 680, funnelPct: [100, 49, 22, 11, 6], cards: ["48%", "22%", "7%", "182"] },
  },
  // 기간 셀렉터 → 변화량 배율과 갱신 주기 라벨
  periodFactors: {
    "최근 30일": { mult: 1, cadence: "일간 갱신" },
    "최근 7일": { mult: 0.4, cadence: "주간 갱신" },
    "이번 분기": { mult: 2.3, cadence: "분기 갱신" },
  },

  // 활성화 퍼널 (팀 단위) — 가입을 100% 기준. 단계 이름/설명은 고정,
  // 수치는 선택된 workspaceProfile에서 파생된다.
  funnel: {
    totalTeams: 2200,
    steps: [
      { name: "가입", sub: "워크스페이스 생성", teams: 2200, pct: 100, leak: 0 },
      { name: "온보딩 완료", sub: "초기 설정 마침", teams: 1342, pct: 61, leak: 39 },
      { name: "첫 결과물 생성", sub: "Aha Moment", teams: 836, pct: 38, leak: 38 },
      { name: "D1 재방문", sub: "다음날 복귀", teams: 528, pct: 24, leak: 37 },
      { name: "D7 습관화", sub: "1주 후 활성", teams: 330, pct: 15, leak: 38 },
    ],
    biggestLeak: "온보딩 완료 → 첫 결과물 생성 (-23%p, 누수율 38%)",
  },

  // 활성화율 추세 (월별)
  activationTrend: [
    { label: "기준", value: 30 },
    { label: "1월", value: 31 },
    { label: "2월", value: 33 },
    { label: "3월", value: 35 },
    { label: "4월", value: 36 },
    { label: "5월", value: 38 },
  ],

  // 코호트 리텐션 히트맵 (가입 주차 × D-period, 단위 %)
  cohort: {
    periods: ["D1", "D7", "D14", "D30"],
    rows: [
      { cohort: "5월 4주차", size: 412, values: [46, 19, 14, null] },
      { cohort: "5월 3주차", size: 388, values: [44, 18, 13, 11] },
      { cohort: "5월 2주차", size: 401, values: [41, 17, 12, 10] },
      { cohort: "5월 1주차", size: 376, values: [39, 15, 11, 9] },
      { cohort: "4월 4주차", size: 354, values: [37, 14, 10, 9] },
      { cohort: "4월 3주차", size: 369, values: [35, 13, 10, 8] },
    ],
    d7Trend: { baseline: 12, q1: 17, q2: 22, current: 15 },
  },

  // 세그먼트: 활성 팀 vs 이탈 팀
  segments: [
    {
      key: "active",
      name: "활성 팀",
      teams: 842,
      activation: 100,
      tone: "active",
      traits: [
        { k: "평균 시트(좌석) 수", v: "5.4명" },
        { k: "첫 결과물까지 소요(TTV)", v: "1.2일" },
        { k: "주간 결과물 생성", v: "8.3건" },
        { k: "온보딩 완료율", v: "94%" },
      ],
    },
    {
      key: "churn",
      name: "이탈 위험/이탈 팀",
      teams: 1358,
      activation: 9,
      tone: "churn",
      traits: [
        { k: "평균 시트(좌석) 수", v: "1.3명" },
        { k: "첫 결과물까지 소요(TTV)", v: "미도달" },
        { k: "주간 결과물 생성", v: "0.4건" },
        { k: "온보딩 완료율", v: "41%" },
      ],
    },
  ],
  segmentInsight:
    "1인 가입·온보딩 미완료 팀에서 이탈이 집중됩니다. '팀 초대 + 첫 결과물 생성'을 함께 유도하는 개입이 활성화율 반등의 핵심 레버입니다.",

  // A/B 실험 추적
  experiments: [
    {
      name: "온보딩 가이드 재설계 (S2)",
      hypothesis: "단일 핵심행동 유도 시 첫 결과물 도달률↑",
      metric: "첫 결과물 도달률",
      control: 30.1,
      variant: 38.4,
      sample: 1840,
      lift: +8.3,
      pvalue: 0.004,
      status: "win",
    },
    {
      name: "빈 상태 템플릿 CTA (S3)",
      hypothesis: "템플릿 제공 시 Time-to-Value↓",
      metric: "당일 첫 결과물률",
      control: 21.7,
      variant: 25.9,
      sample: 1320,
      lift: +4.2,
      pvalue: 0.03,
      status: "running",
    },
    {
      name: "인앱 넛지 카피 A/B (S4)",
      hypothesis: "행동 지향 카피가 넛지 클릭률↑",
      metric: "넛지 클릭률",
      control: 11.2,
      variant: 12.0,
      sample: 980,
      lift: +0.8,
      pvalue: 0.41,
      status: "flat",
    },
  ],

  // 온보딩 체크리스트
  onboarding: [
    { step: "워크스페이스 만들기", done: true },
    { step: "팀원 초대하기", done: true },
    { step: "첫 결과물 생성하기 (Aha)", done: false, current: true },
    { step: "결과물 공유 / 내보내기", done: false },
  ],
  templates: [
    { icon: "📄", name: "주간 업무 보고서" },
    { icon: "📊", name: "프로젝트 대시보드" },
    { icon: "✅", name: "팀 액션 아이템" },
  ],

  // 리텐션/재참여 트리거 시퀀스
  triggers: [
    { when: "+1시간", channel: "인앱", title: "첫 결과물 미완료 넛지", body: "‘첫 결과물 생성’ 단계가 남아있어요. 템플릿으로 30초 만에 시작하세요." },
    { when: "D1", channel: "이메일", title: "어제 만든 결과물 이어가기", body: "팀원과 공유하면 재방문율이 2배 높아집니다. 지금 공유해 보세요." },
    { when: "D3", channel: "푸시", title: "팀 활동 요약", body: "이번 주 팀이 만든 결과물 요약을 확인하세요." },
    { when: "D7", channel: "이메일", title: "습관화 리마인드", body: "매주 같은 시간, 주간 보고서를 자동 초안으로 받아보세요." },
  ],
  winback: [
    { segment: "온보딩 미완료 이탈", offer: "1:1 온보딩 세션 초대", cta: "세션 예약 링크" },
    { segment: "첫 결과물 미도달 이탈", offer: "템플릿 패키지 + 가이드 영상", cta: "템플릿 받기" },
    { segment: "1인 가입 휴면", offer: "팀 초대 시 프리미엄 30일", cta: "팀원 초대하기" },
  ],
};

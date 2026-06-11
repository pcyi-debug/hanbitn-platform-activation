/* =========================================================
   app.js — 화면 렌더링 + SPA 네비게이션
   data.js의 MOCK 데이터를 읽어 6개 화면을 그립니다.
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const deltaTag = (d, unit = "%p") =>
    `<span class="delta delta--${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}${unit}</span>`;

  /* ---------- 헤더 필터 상태 (워크스페이스/기간 → 화면 수치 구동) ---------- */
  const filter = { ws: "전체 워크스페이스", period: "최근 30일" };
  const profile = () =>
    MOCK.workspaceProfiles[filter.ws] || MOCK.workspaceProfiles["전체 워크스페이스"];
  const period = () =>
    MOCK.periodFactors[filter.period] || MOCK.periodFactors["최근 30일"];
  // 기간 배율을 적용한 변화량 (부호 보존, 0으로 사라지지 않게 최소 1)
  const scaledDelta = (d) => {
    const r = Math.round(d * period().mult);
    return r !== 0 ? r : d > 0 ? 1 : d < 0 ? -1 : 0;
  };

  /* ---------- 색상 스케일 (히트맵) ---------- */
  function heatColor(v, max) {
    if (v == null) return null;
    const t = Math.min(1, v / max);
    // 연한 파랑 → 진한 브랜드 블루
    const r = Math.round(225 - 180 * t);
    const g = Math.round(233 - 130 * t);
    const b = Math.round(250 - 14 * t);
    return `rgb(${r},${g},${b})`;
  }

  /* ===================== KPI Row ===================== */
  function renderKpis() {
    const row = $("#kpiRow");
    const { nsm, cards } = MOCK.kpis;
    const p = profile();
    const nsmValue = p.nsm;
    const progress = Math.round(
      ((nsmValue - nsm.baseline) / (nsm.q2Target - nsm.baseline)) * 100
    );
    row.innerHTML = "";
    row.appendChild(
      el(`
      <div class="card kpi kpi--nsm">
        <div class="kpi__label">${nsm.label}</div>
        <div class="flex items-center gap-3">
          <div class="kpi__value">${nsmValue}${nsm.unit}</div>
          ${deltaTag(scaledDelta(nsm.delta))}
        </div>
        <div class="bar mt-2"><div class="bar__fill" style="width:${Math.max(4, progress)}%"></div></div>
        <div class="kpi__foot">${nsm.baseline}% → Q1 ${nsm.q1Target}% → Q2 ${nsm.q2Target}% 목표 · ${nsm.foot}</div>
      </div>
    `)
    );
    cards.forEach((c, i) => {
      row.appendChild(
        el(`
        <div class="card kpi">
          <div class="kpi__label">${c.label}</div>
          <div class="flex items-center gap-3">
            <div class="kpi__value" style="font-size:26px">${p.cards[i] != null ? p.cards[i] : c.value}</div>
            ${deltaTag(scaledDelta(c.delta), c.deltaUnit || "%p")}
          </div>
          <div class="kpi__foot">${c.foot}</div>
        </div>
      `)
      );
    });
  }

  /* ===================== 1. 활성화 퍼널 ===================== */
  function renderFunnel() {
    const f = MOCK.funnel;
    const t = MOCK.activationTrend;
    const p = profile();
    const maxTrend = 60;

    // 선택된 워크스페이스 프로파일에서 단계별 수치 파생 (이름/설명은 고정)
    const steps = f.steps.map((s, i) => {
      const pct = p.funnelPct[i];
      const prev = i === 0 ? pct : p.funnelPct[i - 1];
      const leak = i === 0 ? 0 : Math.round(((prev - pct) / prev) * 100);
      return { name: s.name, sub: s.sub, pct, teams: Math.round((p.totalTeams * pct) / 100), leak };
    });
    // 최대 누수 단계 동적 산출
    let bl = { leak: -1 };
    steps.forEach((s, i) => {
      if (i > 0 && s.leak > bl.leak) bl = { ...s, from: steps[i - 1].name };
    });
    const biggestLeak =
      bl.leak >= 0 ? `${bl.from} → ${bl.name} (누수율 ${bl.leak}%)` : f.biggestLeak;

    const stepsHtml = steps
      .map(
        (s) => `
        <div class="fstep">
          <div class="fstep__name">${s.name}<small>${s.sub}</small></div>
          <div class="fbar">
            <div class="fbar__fill" style="width:${s.pct}%">${s.teams.toLocaleString()}팀 · ${s.pct}%</div>
          </div>
          <div class="fstep__metrics">
            <div class="fstep__conv">${s.pct}%</div>
            ${s.leak ? `<div class="fstep__leak">누수 ${s.leak}%</div>` : `<div class="section-note">기준</div>`}
          </div>
        </div>`
      )
      .join("");

    const trendBars = t
      .map(
        (p) => `
        <div class="flex" style="flex-direction:column;align-items:center;gap:6px;flex:1">
          <div style="font-size:12px;font-weight:700">${p.value}%</div>
          <div style="width:100%;display:flex;align-items:flex-end;height:120px">
            <div style="width:100%;background:linear-gradient(180deg,var(--c-brand-400),var(--c-brand-500));border-radius:6px 6px 0 0;height:${(p.value / maxTrend) * 100}%"></div>
          </div>
          <div class="muted" style="font-size:12px">${p.label}</div>
        </div>`
      )
      .join("");

    $("#page-funnel").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">활성화 퍼널</div>
          <div class="page__desc">가입부터 D7 습관화까지 단계별 전환율·누수율 (${period().cadence})</div>
        </div>
        <div class="flex gap-2">
          <span class="tag tag--team">◎ ${filter.ws}</span>
          <span class="tag">총 ${p.totalTeams.toLocaleString()}팀</span>
        </div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">전환 퍼널</div>
          <div class="section-note">⚠ 최대 누수: ${biggestLeak}</div>
        </div>
        <div class="funnel">${stepsHtml}</div>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head">
            <div class="card__title">활성화율 추세</div>
            <div class="card__sub">기준 30% → 목표 Q1 45% / Q2 55%</div>
          </div>
          <div class="flex" style="gap:10px;align-items:flex-end">${trendBars}</div>
          <div class="mt-4 section-note">정체 구간을 벗어나 상승 반전 시작 (현재 ${p.nsm}%)</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">목표 대비 진행</div></div>
          ${goalRow("baseline", "기준선", 30, 30)}
          ${goalRow("current", "현재", p.nsm, 55)}
          ${goalRow("q1", "Q1 목표", 45, 55)}
          ${goalRow("q2", "Q2 목표", 55, 55)}
          <div class="mt-4 section-note">R1.1 퍼널 · R1.3 Aha 정의 · R1.4 팀 단위 집계 충족</div>
        </div>
      </div>`;
  }
  function goalRow(key, label, val, max) {
    const w = Math.round((val / max) * 100);
    const isCur = key === "current";
    return `
      <div class="mt-2">
        <div class="profile__row"><span>${label}</span><b>${val}%</b></div>
        <div class="bar mt-2"><div class="bar__fill" style="width:${w}%;background:${isCur ? "var(--c-success)" : "var(--c-brand-500)"}"></div></div>
      </div>`;
  }

  /* ===================== 2. 코호트 리텐션 ===================== */
  function renderCohort() {
    const c = MOCK.cohort;
    const maxV = 50;
    const head = `<tr><th class="label">가입 코호트</th><th>팀 수</th>${c.periods
      .map((p) => `<th>${p}</th>`)
      .join("")}</tr>`;
    const body = c.rows
      .map((r) => {
        const cells = r.values
          .map((v) => {
            if (v == null)
              return `<td><div class="cell cell--empty">—</div></td>`;
            const bg = heatColor(v, maxV);
            const dark = v / maxV > 0.4;
            return `<td><div class="cell" style="background:${bg};color:${dark ? "#fff" : "var(--c-ink-700)"}">${v}%</div></td>`;
          })
          .join("");
        return `<tr><td class="label">${r.cohort}</td><td class="muted" style="text-align:center">${r.size}</td>${cells}</tr>`;
      })
      .join("");

    const d = c.d7Trend;
    $("#page-cohort").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">코호트 리텐션</div>
          <div class="page__desc">가입 주차별 D1/D7/D14/D30 팀 리텐션 히트맵 (주간 갱신)</div>
        </div>
        <span class="tag tag--team">◎ 팀 단위</span>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">리텐션 히트맵</div>
          <div class="section-note">색이 진할수록 높은 리텐션 · 최근 코호트일수록 개선</div>
        </div>
        <table class="heatmap">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><div class="card__title">D7 리텐션 추세</div></div>
          <div class="flex" style="gap:12px;align-items:flex-end;height:160px">
            ${d7Bar("기준", d.baseline, 25, false)}
            ${d7Bar("현재", d.current, 25, true)}
            ${d7Bar("Q1 목표", d.q1, 25, false)}
            ${d7Bar("Q2 목표", d.q2, 25, false)}
          </div>
          <div class="mt-4 section-note">R1.2 코호트 리텐션 추적 충족 · 추세 12% → 22% 목표</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">읽는 법</div></div>
          <p class="muted" style="font-size:14px;line-height:1.7">
            • 각 <b>행</b>은 같은 주에 가입한 팀 묶음(코호트)입니다.<br/>
            • 오른쪽으로 갈수록 시간이 지난 뒤의 잔존율입니다.<br/>
            • <b>아래→위</b>로 갈수록 최근 코호트 → 곡선이 위로 올라오면 개선 신호.<br/>
            • <b>D7 평탄화 지점</b>이 핵심 사용자 비율을 나타냅니다.
          </p>
        </div>
      </div>`;
  }
  function d7Bar(label, val, max, cur) {
    return `
      <div class="flex" style="flex-direction:column;align-items:center;gap:6px;flex:1">
        <div style="font-size:13px;font-weight:700">${val}%</div>
        <div style="width:100%;display:flex;align-items:flex-end;height:110px">
          <div style="width:100%;height:${(val / max) * 100}%;border-radius:6px 6px 0 0;background:${cur ? "var(--c-success)" : "var(--c-brand-500)"}"></div>
        </div>
        <div class="muted" style="font-size:12px">${label}</div>
      </div>`;
  }

  /* ===================== 3. 세그먼트 ===================== */
  function renderSegment() {
    const segs = MOCK.segments;
    const cards = segs
      .map((s) => {
        const traits = s.traits
          .map(
            (t) =>
              `<div class="profile__row"><span>${t.k}</span><b>${t.v}</b></div>`
          )
          .join("");
        return `
        <div class="card profile">
          <div class="card__head">
            <div class="card__title">${s.name}</div>
            <span class="pill pill--${s.tone}">${s.tone === "active" ? "활성" : "이탈 위험"}</span>
          </div>
          <div class="flex between items-center">
            <div><div class="kpi__value" style="font-size:30px">${s.teams.toLocaleString()}</div><div class="muted" style="font-size:13px">팀</div></div>
            <div style="text-align:right"><div class="kpi__value" style="font-size:30px">${s.activation}%</div><div class="muted" style="font-size:13px">활성화율</div></div>
          </div>
          <div style="border-top:1px solid var(--c-line);padding-top:12px">${traits}</div>
        </div>`;
      })
      .join("");

    const total = segs.reduce((a, s) => a + s.teams, 0);
    const aPct = Math.round((segs[0].teams / total) * 100);
    $("#page-segment").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">세그먼트 분석</div>
          <div class="page__desc">활성 팀 vs 이탈 팀 프로파일 비교 (주간 갱신) · "평균은 진실을 숨긴다"</div>
        </div>
        <span class="tag tag--team">◎ 팀 단위</span>
      </div>

      <div class="card">
        <div class="card__head"><div class="card__title">활성 vs 이탈 구성</div><div class="card__sub">전체 ${total.toLocaleString()}팀</div></div>
        <div class="compare-bar">
          <i style="width:${aPct}%;background:var(--c-success)"></i>
          <i style="width:${100 - aPct}%;background:var(--c-danger)"></i>
        </div>
        <div class="flex between mt-2 muted" style="font-size:13px">
          <span>● 활성 ${aPct}%</span><span>이탈 위험 ${100 - aPct}% ●</span>
        </div>
      </div>

      <div class="grid grid--2">${cards}</div>

      <div class="card">
        <div class="card__title" style="margin-bottom:8px">인사이트</div>
        <p class="muted" style="font-size:14px;line-height:1.7">${MOCK.segmentInsight}</p>
      </div>`;
  }

  /* ===================== 4. A/B 실험 ===================== */
  function renderExperiment() {
    const exps = MOCK.experiments;
    const statusMap = {
      win: { cls: "win", label: "유의미 승리" },
      running: { cls: "running", label: "진행 중" },
      flat: { cls: "flat", label: "차이 없음" },
    };
    const rows = exps
      .map((e) => {
        const st = statusMap[e.status];
        const sig = e.pvalue < 0.05;
        return `
        <tr>
          <td>
            <div style="font-weight:700">${e.name}</div>
            <div class="muted" style="font-size:12px">${e.hypothesis}</div>
          </td>
          <td>${e.metric}</td>
          <td>${e.control}%</td>
          <td><b>${e.variant}%</b></td>
          <td><span class="delta delta--${e.lift >= 0 ? "up" : "down"}">${e.lift >= 0 ? "▲" : "▼"} ${Math.abs(e.lift)}%p</span></td>
          <td>${e.sample.toLocaleString()}</td>
          <td style="color:${sig ? "var(--c-success)" : "var(--c-ink-500)"};font-weight:600">p=${e.pvalue}${sig ? " ✓" : ""}</td>
          <td><span class="pill pill--${st.cls}">${st.label}</span></td>
        </tr>`;
      })
      .join("");

    const win = exps.find((e) => e.status === "win");
    const winBanner = win
      ? `
      <div class="card" style="background:var(--c-success-50);border-color:transparent">
        <div class="flex gap-3 items-center">
          <div style="font-size:28px">🏆</div>
          <div>
            <div style="font-weight:700">검증 완료: ${win.name}</div>
            <div class="muted" style="font-size:13px">
              첫 결과물 도달률 ${win.control}% → <b>${win.variant}%</b> (+${win.lift}%p), p=${win.pvalue} → 통계적으로 유의미하게 개선됨. 전체 배포 권장.
            </div>
          </div>
        </div>
      </div>`
      : "";
    $("#page-experiment").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">A/B 실험 추적</div>
          <div class="page__desc">온보딩 개입 실험 결과 (실험별 갱신) · 통계적 유의성 p&lt;0.05 기준</div>
        </div>
        <button class="btn btn--primary">+ 새 실험</button>
      </div>

      ${winBanner}

      <div class="card">
        <table class="table">
          <thead>
            <tr><th>실험 / 가설</th><th>지표</th><th>Control</th><th>Variant</th><th>Lift</th><th>표본</th><th>유의성</th><th>상태</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  /* ===================== 5. 온보딩 ===================== */
  function renderOnboarding() {
    const list = MOCK.onboarding;
    const doneN = list.filter((i) => i.done).length;
    const pct = Math.round((doneN / list.length) * 100);
    const items = list
      .map((i) => {
        const cls = i.done ? "is-done" : i.current ? "is-current" : "";
        return `
        <div class="check ${cls}">
          <div class="check__box">${i.done ? "✓" : ""}</div>
          <div class="check__txt">${i.step}</div>
          ${i.current ? `<a class="btn btn--primary btn--sm check__cta">지금 시작 →</a>` : ""}
        </div>`;
      })
      .join("");

    const tpl = MOCK.templates
      .map((t) => `<div class="template">${t.icon} ${t.name}</div>`)
      .join("");

    $("#page-onboarding").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">온보딩 / 활성화 경험</div>
          <div class="page__desc">가입 직후 단일 핵심행동(첫 결과물 생성)으로 유도 · Time-to-Value 단축</div>
        </div>
        <span class="tag">R2.1 · R2.2 · R2.3</span>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head">
            <div class="card__title">시작하기 체크리스트</div>
            <div class="card__sub">${doneN}/${list.length} 완료</div>
          </div>
          <div class="bar" style="margin-bottom:16px"><div class="bar__fill" style="width:${pct}%"></div></div>
          <div class="checklist">${items}</div>
        </div>

        <div class="card">
          <div class="card__head"><div class="card__title">빈 상태 (Empty State)</div></div>
          <div class="empty">
            <div class="empty__icon">🗂️</div>
            <div class="empty__title">아직 결과물이 없어요</div>
            <div class="empty__desc">템플릿으로 시작하면 30초 만에 첫 결과물을 만들 수 있어요. 가장 인기 있는 템플릿을 골라보세요.</div>
            <div class="template-row">${tpl}</div>
            <button class="btn btn--primary mt-2">빈 문서로 시작</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><div class="card__title">인앱 넛지 (첫 결과물 미완료 팀)</div></div>
        <div class="nudge">
          <div class="nudge__icon">💡</div>
          <div style="flex:1">
            <div class="nudge__title">첫 결과물 생성까지 한 단계 남았어요</div>
            <div class="nudge__desc">팀의 64%가 템플릿으로 첫 결과물을 만들었어요. 지금 만들고 팀과 공유해 보세요.</div>
          </div>
          <button class="btn btn--primary btn--sm">템플릿 보기</button>
        </div>
      </div>`;
  }

  /* ===================== 6. 재참여 ===================== */
  function renderRetention() {
    const tl = MOCK.triggers
      .map(
        (t) => `
        <div class="tl">
          <div class="tl__when">${t.when}</div>
          <div class="tl__card">
            <div class="tl__chan">${t.channel}</div>
            <div class="tl__title">${t.title}</div>
            <div class="tl__body">${t.body}</div>
          </div>
        </div>`
      )
      .join("");

    const wb = MOCK.winback
      .map(
        (w) => `
        <div class="card">
          <span class="pill pill--churn">${w.segment}</span>
          <div style="font-weight:700;margin:10px 0 4px">${w.offer}</div>
          <a class="btn btn--sm">${w.cta} →</a>
        </div>`
      )
      .join("");

    $("#page-retention").innerHTML = `
      <div class="page__head">
        <div>
          <div class="page__title">리텐션 / 재참여</div>
          <div class="page__desc">첫 결과물 생성 후 재방문(D1/D7) 유도 트리거 · 이탈 팀 윈백</div>
        </div>
        <span class="tag">R3.1 · R3.2</span>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><div class="card__title">재방문 유도 트리거 시퀀스</div></div>
          <div class="timeline">${tl}</div>
        </div>
        <div class="flex" style="flex-direction:column;gap:16px">
          <div class="card">
            <div class="card__title" style="margin-bottom:6px">윈백 시나리오</div>
            <div class="card__sub">이탈 팀 세그먼트별 재참여 오퍼</div>
          </div>
          ${wb}
        </div>
      </div>`;
  }

  /* ===================== Navigation ===================== */
  const TITLES = {
    funnel: "활성화 퍼널",
    cohort: "코호트 리텐션",
    segment: "세그먼트",
    experiment: "A/B 실험",
    onboarding: "온보딩",
    retention: "재참여",
  };

  function go(page) {
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("is-active"));
    const target = $("#page-" + page);
    if (target) target.classList.add("is-active");

    document
      .querySelectorAll(".nav__item")
      .forEach((b) => b.classList.toggle("is-active", b.dataset.page === page));
    $("#headerTitle").textContent = TITLES[page] || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    renderKpis();
    renderFunnel();
    renderCohort();
    renderSegment();
    renderExperiment();
    renderOnboarding();
    renderRetention();

    $("#nav").addEventListener("click", (e) => {
      const btn = e.target.closest(".nav__item");
      if (btn) go(btn.dataset.page);
    });

    // 헤더 필터 → KPI·퍼널 즉시 재렌더 (정적이지만 살아있는 데모)
    const onFilter = () => {
      renderKpis();
      renderFunnel();
    };
    $("#workspaceSelect").addEventListener("change", (e) => {
      filter.ws = e.target.value;
      onFilter();
    });
    $("#periodSelect").addEventListener("change", (e) => {
      filter.period = e.target.value;
      onFilter();
    });

    go("funnel");
    console.log("[목업] 한빛앤 활성화 대시보드 초기화 완료 — 6개 화면 렌더됨");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

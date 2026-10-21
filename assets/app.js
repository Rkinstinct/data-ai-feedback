/* Anonymous feedback form — welcome → 5 steps → thanks. */
(function () {
  const CFG = window.FB_CONFIG;
  const TOTAL_STEPS = 5;
  const DRAFT_KEY = "fb_draft_v1";
  const SUBMITTED_KEY = "fb_submitted_v1";

  const app = document.getElementById("app");
  const header = document.getElementById("siteHeader");
  const strip = document.getElementById("progressStrip");
  const fill = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  document.getElementById("orgLine1").textContent = CFG.orgLine1;
  document.getElementById("orgLine2").textContent = CFG.orgLine2;

  let state = {
    view: "welcome", // welcome | form | thanks | already
    step: 0,
    submitting: false,
    error: null,
    data: {},
  };

  // restore draft
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d && typeof d === "object") state.data = d;
  } catch (e) {}

  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.data)); } catch (e) {}
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function ratingControl(field) {
    const v = state.data[field];
    return `
      <div class="rating-grid" role="radiogroup">
        ${CFG.scale.map((s) => `
          <button type="button" class="rating-option ${v === s.value ? "is-selected" : ""}"
            data-field="${field}" data-value="${s.value}" role="radio" aria-checked="${v === s.value}"
            aria-label="${s.value} - ${esc(s.label)}">
            <span class="emoji">${s.emoji}</span>
            <span class="num">${s.value}</span>
          </button>`).join("")}
      </div>
      <div class="rating-scale-labels"><span>1 — ${esc(CFG.scale[0].label)}</span><span>5 — ${esc(CFG.scale[4].label)}</span></div>`;
  }

  function commentField(field, labelText, rows) {
    return `
      <div style="margin-top:1rem">
        <label class="field-label" for="f_${field}">${esc(labelText)}</label>
        <textarea class="brand-input" id="f_${field}" data-comment="${field}" rows="${rows || 3}" maxlength="2000">${esc(state.data[field] || "")}</textarea>
      </div>`;
  }

  const steps = [
    () => `
      <h2 class="step-title">1. הערכת סגל ההדרכה</h2>
      <p class="step-help">עד כמה היית שבע/ת רצון מאופן העברת התכנים על ידי כל אחד מהמרצים (מקצועיות, בהירות ההסברים, יצירת עניין ומענה לשאלות)?</p>
      ${CFG.instructors.map((ins) => `
        <div class="q-block">
          <div class="q-head"><h4>${esc(ins.name)}</h4><span>${esc(ins.topic)}</span></div>
          ${ratingControl(ins.key)}
        </div>`).join("")}
      ${commentField("instructor_comments", "הערות / הארות על המרצים (רשות)")}`,
    () => `
      <h2 class="step-title">2. רלוונטיות החומר הנלמד</h2>
      <p class="step-help">באיזו מידה התכנים שהועברו בקורס היו רלוונטיים, מעשיים ותרמו לארגז הכלים המקצועי שלך?</p>
      <div class="q-block">${ratingControl("relevance_rating")}</div>
      ${commentField("relevance_comments", "הערות / הארות (רשות)")}`,
    () => `
      <h2 class="step-title">3. סביבת הלמידה והארגון</h2>
      <p class="step-help">עד כמה היית שבע/ת רצון מסביבת הלמידה, התנאים הפיזיים והארגון הלוגיסטי של הקורס מטעם אגף משאבי אנוש?</p>
      <div class="q-block">${ratingControl("environment_rating")}</div>
      ${commentField("environment_comments", "הערות / הארות (רשות)")}`,
    () => `
      <h2 class="step-title">4. שביעות רצון כללית</h2>
      <p class="step-help">באופן כללי, עד כמה היית מרוצה מהקורס והאם היית ממליץ/ה לסטודנטים אחרים להשתתף במחזורים עתידיים?</p>
      <div class="q-block">${ratingControl("overall_rating")}</div>
      ${commentField("overall_comments", "הערות / הארות (רשות)")}`,
    () => `
      <h2 class="step-title">5. נקודות לשימור ולשיפור</h2>
      <p class="step-help">שאלה אחרונה — אילו דברים נוספים כדאי לנו לשמר בקורסים הבאים, ומה היית מציע/ה לנו לשפר?</p>
      ${commentField("improvement_comments", "ההערות שלך (רשות)", 6)}`,
  ];

  function stepValid() {
    if (state.step === 0) return CFG.instructors.every((i) => state.data[i.key]);
    if (state.step === 1) return !!state.data.relevance_rating;
    if (state.step === 2) return !!state.data.environment_rating;
    if (state.step === 3) return !!state.data.overall_rating;
    return true;
  }

  function render() {
    header.classList.toggle("slim", state.view === "form");
    strip.hidden = state.view !== "form";

    if (state.view === "welcome") {
      app.innerHTML = `
        <section class="wrap hero">
          <div class="brand-card">
            <span class="badge">${esc(CFG.badge)}</span>
            <h1>${esc(CFG.courseTitle)}</h1>
            <p class="lead">אגף משאבי אנוש מודה לך על השתתפותך בקורס. כדי שנוכל להמשיך להשתפר, נשמח לקבל ממך משוב קצר.
              אנא סמן/י את הסמיילי המשקף בצורה הטובה ביותר את שביעות רצונך בכל שאלה. בכל שאלה ניתן גם להוסיף הערות חופשיות.</p>
            <div class="anon-box">
              <h3>🔒 המשוב אנונימי לחלוטין</h3>
              <ul>
                <li>אין צורך בהתחברות, שם או אימייל</li>
                <li>לא נשמרת כתובת IP, סוג דפדפן או שעת מילוי</li>
                <li>נשמרות רק התשובות שתבחר/י — ותו לא</li>
                <li>מניעת מילוי כפול מתבצעת במכשיר שלך בלבד</li>
                <li>נא לא לכתוב פרטים מזהים בהערות החופשיות</li>
              </ul>
            </div>
            <button class="btn btn-primary btn-block" id="startBtn">התחל עכשיו</button>
            <p class="meta-line">5 שאלות · כ-3 דקות · המשוב אנונימי</p>
          </div>
        </section>`;
      document.getElementById("startBtn").onclick = () => {
        if (localStorage.getItem(SUBMITTED_KEY)) { state.view = "already"; }
        else { state.view = "form"; state.step = 0; }
        render();
      };
      window.scrollTo(0, 0);
      return;
    }

    if (state.view === "already") {
      app.innerHTML = `
        <div class="center-stage"><div class="brand-card status-card">
          <h1>כבר מילאת את המשוב</h1>
          <p>ניתן למלא את השאלון פעם אחת בלבד מאותו מכשיר. תודה על השתתפותך!</p>
          <button class="btn btn-primary" id="backHome">לדף הבית</button>
        </div></div>`;
      document.getElementById("backHome").onclick = () => { state.view = "welcome"; render(); };
      return;
    }

    if (state.view === "thanks") {
      app.innerHTML = `
        <div class="center-stage"><div class="brand-card status-card">
          <div class="check-circle">✓</div>
          <h1>תודה על המשוב!</h1>
          <p>התשובות שלך נשמרו באופן אנונימי ויעזרו לנו לשפר את הקורסים הבאים. אגף משאבי אנוש מודה לך על השתתפותך.</p>
          <button class="btn btn-primary" id="backHome">חזרה לדף הבית</button>
        </div></div>`;
      document.getElementById("backHome").onclick = () => { state.view = "welcome"; render(); };
      window.scrollTo(0, 0);
      return;
    }

    // form view
    label.textContent = `שלב ${state.step + 1} מתוך ${TOTAL_STEPS}`;
    fill.style.width = `${((state.step + 1) / TOTAL_STEPS) * 100}%`;
    const last = state.step === TOTAL_STEPS - 1;
    app.innerHTML = `
      <div class="step-area">
        ${steps[state.step]()}
        ${state.error ? `<p class="error-text">${esc(state.error)}</p>` : ""}
        <div class="nav-row">
          <button type="button" class="btn btn-ghost" id="backBtn" ${state.step === 0 ? "disabled" : ""}>→ חזרה</button>
          <button type="button" class="btn btn-primary" id="nextBtn" ${!stepValid() || state.submitting ? "disabled" : ""}>
            ${last ? (state.submitting ? "שומר..." : "סיום ושליחה ✓") : "המשך ←"}
          </button>
        </div>
        ${!stepValid() && !last ? '<p class="hint-text">נא לבחור דירוג כדי להמשיך</p>' : ""}
        ${last ? '<p class="hint-text">🔒 השליחה אנונימית לחלוטין — לא נשמר שום פרט מזהה</p>' : ""}
      </div>`;

    app.querySelectorAll(".rating-option").forEach((btn) => {
      btn.onclick = () => {
        state.data[btn.dataset.field] = parseInt(btn.dataset.value, 10);
        saveDraft();
        render();
      };
    });
    app.querySelectorAll("[data-comment]").forEach((ta) => {
      ta.oninput = () => { state.data[ta.dataset.comment] = ta.value; saveDraft(); };
    });
    document.getElementById("backBtn").onclick = () => { if (state.step > 0) { state.step--; state.error = null; render(); } };
    document.getElementById("nextBtn").onclick = () => { if (!stepValid() || state.submitting) return; last ? submit() : (state.step++, state.error = null, render()); };
    window.scrollTo(0, 0);
  }

  async function submit() {
    state.submitting = true; state.error = null; render();
    const payload = { website: document.getElementById("hpField").value || "" };
    CFG.ratingFields.forEach((f) => (payload[f.key] = state.data[f.key]));
    CFG.commentFields.forEach((f) => (payload[f.key] = state.data[f.key] || null));
    try {
      const res = await fetch(CFG.apiBase + "/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || "אירעה שגיאה בשמירת המשוב. נא לנסה/י שוב.");
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem(SUBMITTED_KEY, "1");
      state.data = {}; state.view = "thanks"; state.submitting = false;
      render();
    } catch (e) {
      state.error = e.message && e.message.includes("שגיאה") ? e.message : "אירעה שגיאה בשמירת המשוב. נא לנסה/י שוב.";
      state.submitting = false;
      render();
    }
  }

  document.getElementById("homeLink").onclick = (e) => { e.preventDefault(); state.view = "welcome"; render(); };
  render();
})();

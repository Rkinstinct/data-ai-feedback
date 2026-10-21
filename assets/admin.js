/* Admin dashboard — login + averages + per-response cards. Stateless: the password
   is kept in sessionStorage only and sent over HTTPS as a Bearer token. */
(function () {
  const CFG = window.FB_CONFIG;
  const app = document.getElementById("adminApp");
  document.getElementById("orgLine1").textContent = CFG.orgLine1;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const getPw = () => sessionStorage.getItem("fb_admin_pw") || "";
  const setPw = (v) => sessionStorage.setItem("fb_admin_pw", v);

  let state = { loading: false, error: null, data: null };

  function renderLogin() {
    app.innerHTML = `
      <div class="center-stage"><div class="brand-card status-card">
        <h1>כניסת מנהל</h1>
        <p>אזור זה מיועד למנהל הקורס בלבד.</p>
        <div style="text-align:right">
          <label class="field-label" for="u">שם משתמש</label>
          <input class="brand-input" id="u" value="admin" autocomplete="username" style="margin-bottom:.8rem">
          <label class="field-label" for="p">סיסמה</label>
          <input class="brand-input" id="p" type="password" autocomplete="current-password" dir="ltr" style="text-align:left">
        </div>
        ${state.error ? `<p class="error-text">${esc(state.error)}</p>` : ""}
        <button class="btn btn-primary btn-block" id="loginBtn" style="margin-top:1rem" ${state.loading ? "disabled" : ""}>
          ${state.loading ? "בודק..." : "התחברות"}
        </button>
      </div></div>`;
    const doLogin = async () => {
      const pw = document.getElementById("p").value;
      const u = document.getElementById("u").value.trim();
      if (!pw) { state.error = "נא להזין סיסמה"; renderLogin(); return; }
      state.loading = true; state.error = null; renderLogin();
      try {
        const res = await fetch(CFG.apiBase + "/api/admin/check", {
          method: "POST", headers: { Authorization: "Bearer " + pw },
        });
        if (res.status === 503) { state.loading = false; state.error = "הסיסמה עדיין לא הוגדרה במערכת."; renderLogin(); return; }
        if (res.status === 401 || u !== "admin") { state.loading = false; state.error = "שם משתמש או סיסמה שגויים"; renderLogin(); return; }
        if (!res.ok) throw new Error("server");
        setPw(pw); state.loading = false; state.data = null; loadResults();
      } catch (e) {
        state.loading = false; state.error = "אירעה שגיאת תקשורת. נא לנסות שוב."; renderLogin();
      }
    };
    document.getElementById("loginBtn").onclick = doLogin;
    document.getElementById("p").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  }

  const avg = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);

  function barColor(a) { return a >= 4 ? "#3A5591" : a >= 3 ? "#5A6480" : "#B3261E"; }

  function renderDashboard() {
    const items = state.data.responses || [];
    const topicStats = CFG.ratingFields.map((f) => {
      const vals = items.map((r) => r[f.key]).filter((v) => v != null);
      const dist = [1, 2, 3, 4, 5].map((n) => vals.filter((v) => v === n).length);
      return { ...f, avg: avg(vals), dist, count: vals.length };
    });
    const overallAvg = avg(topicStats.map((t) => t.avg));
    const maxDist = Math.max(1, ...topicStats.flatMap((t) => t.dist));

    app.innerHTML = `
      <div class="admin-wrap">
        <div class="admin-head">
          <div>
            <h1>תוצאות המשוב</h1>
            <p class="admin-sub">סיכום שביעות רצון — ${esc(CFG.courseTitle)} · המשובים אנונימיים לחלוטין</p>
          </div>
          <div class="toolbar">
            <button class="btn btn-ghost" id="refreshBtn">↻ רענון</button>
            <button class="btn btn-ghost" id="logoutBtn">יציאה</button>
          </div>
        </div>

        ${items.length === 0 ? `
          <div class="panel empty-state">עדיין אין משובים. המשוב הראשון יופיע כאן לאחר שליחה.</div>
        ` : `
          <div class="stat-grid">
            <div class="stat-card"><p class="num">${items.length}</p><p class="lbl">סה"כ משובים</p></div>
            <div class="stat-card"><p class="num">${overallAvg.toFixed(2)}</p><p class="lbl">ממוצע כללי (1-5)</p></div>
            <div class="stat-card"><p class="num">${Math.round((overallAvg / 5) * 100)}%</p><p class="lbl">שביעות רצון</p></div>
          </div>

          <div class="panel">
            <h2>ממוצע דירוגים לפי נושא</h2>
            <div class="dist-axis">${[1,2,3,4,5].map((n) => `<span>${n}</span>`).join("")}</div>
            ${topicStats.map((t) => `
              <div class="bar-row">
                <span class="bar-label">${esc(t.label)}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${(t.avg / 5) * 100}%;background:${barColor(t.avg)}"></div></div>
                <span class="bar-val">${t.avg.toFixed(2)}</span>
              </div>
              <div class="dist-row">
                ${t.dist.map((c) => `
                  <div class="dist-cell">
                    <div class="dist-bar" style="height:${Math.max(3, (c / maxDist) * 42)}px" title="${c} דירוגים"></div>
                    <div class="dist-num">${c || ""}</div>
                  </div>`).join("")}
              </div>`).join("")}
          </div>

          <div class="panel">
            <h2>כל המשובים (${items.length})</h2>
            ${items.map((r, i) => {
              const rAvg = avg(CFG.ratingFields.map((f) => r[f.key]).filter((v) => v != null));
              return `
              <details class="resp-card">
                <summary>
                  <span>
                    <span class="resp-title">משוב #${items.length - i}</span>
                    <span class="resp-sub"> · ממוצע ${rAvg.toFixed(1)} · אנונימי</span>
                  </span>
                  <span class="chev">▼</span>
                </summary>
                <div class="resp-body">
                  ${CFG.ratingFields.map((f) => `
                    <div class="qa-row">
                      <p class="q">${esc(f.label)}</p>
                      <p class="a"><span class="stars">${r[f.key] != null ? "★".repeat(r[f.key]) + "☆".repeat(5 - r[f.key]) : "—"}</span>
                        ${r[f.key] != null ? ` (${r[f.key]}/5 — ${esc((CFG.scale.find((s) => s.value === r[f.key]) || {}).label || "")})` : ""}</p>
                    </div>`).join("")}
                  ${CFG.commentFields.map((f) => r[f.key] ? `
                    <div class="qa-row">
                      <p class="q">${esc(f.label)}</p>
                      <p class="a">${esc(r[f.key])}</p>
                    </div>` : "").join("")}
                </div>
              </details>`;
            }).join("")}
          </div>
        `}
      </div>`;

    document.getElementById("refreshBtn").onclick = loadResults;
    document.getElementById("logoutBtn").onclick = () => { sessionStorage.removeItem("fb_admin_pw"); state.data = null; renderLogin(); };
  }

  async function loadResults() {
    state.loading = true; state.error = null;
    app.innerHTML = `<div class="center-stage"><div class="empty-state">טוען תוצאות...</div></div>`;
    try {
      const res = await fetch(CFG.apiBase + "/api/admin/results", { headers: { Authorization: "Bearer " + getPw() } });
      if (res.status === 401) { sessionStorage.removeItem("fb_admin_pw"); renderLogin(); return; }
      if (!res.ok) throw new Error("server");
      state.data = await res.json();
      state.loading = false;
      renderDashboard();
    } catch (e) {
      app.innerHTML = `<div class="center-stage"><div class="brand-card status-card">
        <h1>שגיאת תקשורת</h1><p>לא ניתן לטעון את התוצאות כרגע.</p>
        <button class="btn btn-primary" id="retryBtn">נסה שוב</button></div></div>`;
      document.getElementById("retryBtn").onclick = loadResults;
    }
  }

  if (getPw()) loadResults(); else renderLogin();
})();

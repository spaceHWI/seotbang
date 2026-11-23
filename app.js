/* 서트방 미션 빙고 */
(() => {
"use strict";

// [칸 제목, 덧붙는 조건]
const CELLS = [
  ["서트방 단체사진 참여하기", ""],
  ["누적 상승 10,000m", ""],
  ["오름 2개 연속 오르기", ""],
  ["해안도로 러닝 중 일출 보기", ""],
  ["백록담 다녀오기", ""],

  ["야간 트레일 러닝", "19:00 이후"],
  ["러닝 중 셀카 찍기", ""],
  ["7분대 조깅", "30분 이상"],
  ["처음 가는 코스", ""],
  ["트랙벙 참여", ""],

  ["월 마일리지 350km", ""],
  ["모닝벙 후 모닝커피", ""],
  ["연속 4일 운동", ""],
  ["멋진 풍경 사진 자랑하기", "러닝 중 만난"],
  ["찍터벌", "남 찍어주기"],

  ["새로운 러닝 친구 사귀기", ""],
  ["돈평돈", ""],
  ["모닝런 후 아이싱", "막숙, 자구리 등"],
  ["5km TT", ""],
  ["주 5일 운동", ""],

  ["PB 세우기", "코스, 거리 무관"],
  ["06:00 전 러닝", ""],
  ["한라산에서 일출", "윗세오름, 백록담, 평궤 등"],
  ["소정방 폭포수 맞기", ""],
  ["월 마일리지 200km", ""],
];

const LINES = (() => {
  const L = [];
  for (let r = 0; r < 5; r++) L.push({ cells: [0,1,2,3,4].map(c => r*5+c), x1: .12, y1: r+.5, x2: 4.88, y2: r+.5 });
  for (let c = 0; c < 5; c++) L.push({ cells: [0,1,2,3,4].map(r => r*5+c), x1: c+.5, y1: .12, x2: c+.5, y2: 4.88 });
  L.push({ cells: [0,6,12,18,24], x1: .2, y1: .2, x2: 4.8, y2: 4.8 });
  L.push({ cells: [4,8,12,16,20], x1: 4.8, y1: .2, x2: .2, y2: 4.8 });
  return L;
})();

const STATUS_WORD = { pending: "확인 중", approved: "승인", rejected: "다시 올리기" };

const $ = (s, el = document) => el.querySelector(s);
const cssUrl = u => String(u).replace(/['"()\\\s]/g, c => encodeURIComponent(c) === c ? "%" + c.charCodeAt(0).toString(16) : encodeURIComponent(c));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

/* ---------- 저장소: Supabase 또는 미리보기(localStorage) ---------- */
const cfg = window.BINGO_CONFIG || {};
const LIVE = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase);

function liveApi() {
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const BUCKET = "bingo-proofs";
  const rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    async listPlayers() {
      const { data, error } = await sb.from("bingo_players").select("id,nickname,created_at").order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
    async listSubs() {
      const { data, error } = await sb.from("bingo_submissions")
        .select("id,player_id,cell,photo_path,status,reject_reason,created_at").order("created_at");
      if (error) throw new Error(error.message);
      return data.map(s => ({ ...s, photo_url: sb.storage.from(BUCKET).getPublicUrl(s.photo_path).data.publicUrl }));
    },
    join: (nick, pass) => rpc("bingo_join", { p_nickname: nick, p_pass: pass }),
    async login(nick, pass) {
      const r = await rpc("bingo_login", { p_nickname: nick, p_pass: pass });
      if (!r) throw new Error("닉네임이나 비밀번호가 맞지 않아요.");
      return r;
    },
    logout: token => rpc("bingo_logout", { p_token: token }),
    async submit(me, cell, blob) {
      const path = `${me.id}/${cell}-${Date.now()}.jpg`;
      const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", headers: { "x-bingo-token": me.token } });
      if (up.error) throw new Error("사진을 올리지 못했어요. " + up.error.message);
      await rpc("bingo_submit", { p_token: me.token, p_cell: cell, p_path: path });
    },
    cancel: (me, cell) => rpc("bingo_cancel", { p_token: me.token, p_cell: cell }),
    adminIsSet: () => rpc("bingo_admin_is_set", {}),
    adminInit: pass => rpc("bingo_admin_init", { p_pass: pass }),
    async adminLogin(pass) {
      const t = await rpc("bingo_admin_login", { p_pass: pass });
      if (!t) throw new Error("운영진 비밀번호가 맞지 않아요.");
      return t;
    },
    adminCheck: token => rpc("bingo_admin_check", { p_token: token }),
    review: (token, id, status, reason) =>
      rpc("bingo_review", { p_token: token, p_submission: id, p_status: status, p_reason: reason || null }),
  };
}

function demoApi() {
  const KEY = "stb-bingo-demo";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const db = Object.assign({ players: [], subs: [], admin: null }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* 용량 초과 시 화면에만 유지 */ } };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  const toDataUrl = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); });
  const auth = me => { if (!db.players.some(p => p.id === me.id && p.pass === me.token)) throw new Error("로그인이 풀렸어요. 다시 들어와 주세요."); };
  return {
    async listPlayers() { return db.players.map(({ id, nickname, created_at }) => ({ id, nickname, created_at })); },
    async listSubs() { return db.subs.map(s => ({ ...s })); },
    async join(nick, pass) {
      nick = nick.trim();
      if (nick.length < 1 || nick.length > 12) throw new Error("닉네임은 1~12자로 정해 주세요.");
      if (pass.length < 4) throw new Error("비밀번호는 4자 이상으로 정해 주세요.");
      if (db.players.some(p => p.nickname === nick)) throw new Error('이미 있는 닉네임이에요. 본인이면 "이어서 하기"로 들어오세요.');
      const p = { id: uid(), nickname: nick, pass, created_at: new Date().toISOString() };
      db.players.push(p); save(); return { id: p.id, token: pass };
    },
    async login(nick, pass) {
      const p = db.players.find(p => p.nickname === nick.trim() && p.pass === pass);
      if (!p) throw new Error("닉네임이나 비밀번호가 맞지 않아요.");
      return { id: p.id, token: pass };
    },
    async logout() {},
    async submit(me, cell, blob) {
      auth(me);
      const old = db.subs.find(s => s.player_id === me.id && s.cell === cell);
      if (old && old.status === "approved") throw new Error("이미 승인된 칸이에요.");
      const photo_url = await toDataUrl(blob);
      db.subs = db.subs.filter(s => s !== old);
      db.subs.push({ id: uid(), player_id: me.id, cell, photo_url, status: "pending", reject_reason: null, created_at: new Date().toISOString() });
      save();
    },
    async cancel(me, cell) { auth(me); db.subs = db.subs.filter(s => !(s.player_id === me.id && s.cell === cell && s.status !== "approved")); save(); },
    async adminIsSet() { return !!db.admin; },
    async adminInit(pass) {
      if (pass.length < 10) throw new Error("운영진 비밀번호는 10자 이상으로 정해 주세요.");
      if (db.admin) throw new Error("운영진 비밀번호가 이미 정해져 있어요.");
      db.admin = pass; save(); return pass;
    },
    async adminLogin(pass) { if (db.admin !== pass) throw new Error("운영진 비밀번호가 맞지 않아요."); return pass; },
    async adminCheck(token) { return !!db.admin && db.admin === token; },
    async review(pass, id, status, reason) {
      if (db.admin !== pass) throw new Error("운영진 로그인이 풀렸어요. 다시 들어와 주세요.");
      const s = db.subs.find(s => s.id === id); if (!s) return;
      s.status = status; s.reject_reason = status === "rejected" ? (reason || null) : null; save();
    },
  };
}

const api = LIVE ? liveApi() : demoApi();

/* ---------- 상태 ---------- */
const ME_KEY = "stb-bingo-me";
const state = {
  players: [], subs: [],
  me: (() => { try { const m = JSON.parse(localStorage.getItem(ME_KEY)); return m && m.token ? m : null; } catch { return null; } })(),
  adminToken: sessionStorage.getItem("stb-bingo-admin") || "",
  adminFilter: "pending",
  drawn: new Set(), // 이미 그어진 줄(다시 그리는 애니메이션 방지)
};
const setMe = me => { state.me = me; me ? localStorage.setItem(ME_KEY, JSON.stringify(me)) : localStorage.removeItem(ME_KEY); };

async function refresh() {
  const [players, subs] = await Promise.all([api.listPlayers(), api.listSubs()]);
  state.players = players; state.subs = subs;
  if (state.me && !players.some(p => p.id === state.me.id)) setMe(null);
}

const subsOf = pid => { const m = {}; for (const s of state.subs) if (s.player_id === pid) m[s.cell] = s; return m; };
function score(pid) {
  const m = subsOf(pid);
  const done = new Set(Object.values(m).filter(s => s.status === "approved").map(s => s.cell));
  const lines = LINES.map((l, i) => l.cells.every(c => done.has(c)) ? i : -1).filter(i => i >= 0);
  return { done, lines };
}

/* ---------- 공통 UI ---------- */
let toastTimer;
function toast(msg, bad) {
  const t = $("#toast"); t.textContent = msg; t.className = "show" + (bad ? " bad" : "");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = ""), 3600);
}
async function busy(btn, fn) {
  if (btn) btn.disabled = true;
  try { return await fn(); }
  catch (e) { toast(e.message || "문제가 생겼어요. 잠시 뒤 다시 해 주세요.", true); }
  finally { if (btn) btn.disabled = false; }
}

function renderNav() {
  $("#nav").innerHTML = state.me
    ? `<a href="#/">내 빙고판</a><a href="#/all">참가자</a><a href="#/admin">운영진</a><button type="button" class="linkish" id="logout">${esc(state.me.nickname)} 나가기</button>`
    : `<a href="#/">시작하기</a><a href="#/all">참가자</a><a href="#/admin">운영진</a>`;
  const lo = $("#logout");
  if (lo) lo.onclick = () => { if (confirm("이 기기에서 로그아웃할까요? 기록은 그대로 남아요.")) { api.logout(state.me.token).catch(() => {}); setMe(null); route(); } };
}

/* ---------- 빙고판 ---------- */
function boardHtml(pid, mine) {
  const m = subsOf(pid), { lines } = score(pid);
  const cells = CELLS.map(([title, sub], i) => {
    const s = m[i], st = s ? s.status : "empty";
    const bg = st === "approved" ? ` style="background-image:url('${esc(cssUrl(s.photo_url))}')"` : "";
    const tag = st === "pending" || st === "rejected" ? `<span class="tag">${STATUS_WORD[st]}</span>` : "";
    const label = `${title}${sub ? ", " + sub : ""}${s ? ", " + STATUS_WORD[st] : ""}`;
    return `<button type="button" class="cell is-${st}" data-cell="${i}" aria-label="${esc(label)}"${bg}>
      ${tag}<span class="cell-title">${esc(title)}</span>${sub ? `<span class="cell-sub">${esc(sub)}</span>` : ""}
    </button>`;
  }).join("");
  const strokes = lines.map(i => {
    const l = LINES[i], k = pid + ":" + i, fresh = !state.drawn.has(k); state.drawn.add(k);
    const a = `x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" pathLength="1"`;
    return `<g class="${fresh ? "fresh" : ""}"><line class="lane-edge" ${a}/><line class="lane" ${a}/></g>`;
  }).join("");
  return `<div class="board${mine ? " mine" : ""}" data-player="${esc(pid)}">
    <div class="grid">${cells}</div>
    <svg class="lines" viewBox="0 0 5 5" preserveAspectRatio="none" aria-hidden="true">${strokes}</svg>
  </div>`;
}

function tallyHtml(pid) {
  const { done, lines } = score(pid);
  const waiting = Object.values(subsOf(pid)).filter(s => s.status === "pending").length;
  return `<p class="tally"><b>${lines.length}</b>빙고<span>채운 칸 ${done.size}/25</span>${waiting ? `<span>확인 중 ${waiting}</span>` : ""}</p>`;
}

function bindBoard(root) {
  root.querySelectorAll(".board").forEach(b => {
    const pid = b.dataset.player, mine = b.classList.contains("mine");
    b.querySelectorAll(".cell").forEach(c => (c.onclick = () => openCell(pid, +c.dataset.cell, mine)));
  });
}

/* ---------- 칸 열기 / 인증샷 올리기 ---------- */
async function shrink(file) {
  const MAX = 1600;
  let src, w, h;
  try { src = await createImageBitmap(file); w = src.width; h = src.height; }
  catch {
    src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error("이 사진은 열 수 없어요. 다른 사진으로 해 주세요.")); im.src = URL.createObjectURL(file); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const k = Math.min(1, MAX / Math.max(w, h));
  const cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  cv.getContext("2d").drawImage(src, 0, 0, cv.width, cv.height);
  return new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error("사진을 줄이지 못했어요.")), "image/jpeg", 0.82));
}

function openCell(pid, cell, mine) {
  const dlg = $("#dlg"), [title, sub] = CELLS[cell];
  const s = subsOf(pid)[cell], st = s ? s.status : "empty";
  const owner = state.players.find(p => p.id === pid);
  const note = {
    empty: mine ? "인증샷을 올리면 운영진이 확인하고 칸을 채워 줘요." : "아직 인증샷이 없어요.",
    pending: "운영진이 확인하고 있어요.",
    approved: "승인됐어요.",
    rejected: "반려됐어요." + (s && s.reject_reason ? ` 사유: ${s.reject_reason}` : "") + (mine ? " 사진을 다시 올려 주세요." : ""),
  }[st];
  const canUpload = mine && st !== "approved";
  dlg.innerHTML = `
    <form method="dialog" class="sheet">
      <button class="close" aria-label="닫기">닫기</button>
      <h2>${esc(title)}</h2>
      ${sub ? `<p class="cond">${esc(sub)}</p>` : ""}
      ${!mine && owner ? `<p class="by">${esc(owner.nickname)} 님의 칸</p>` : ""}
      ${s ? `<img class="proof" src="${esc(s.photo_url)}" alt="인증샷">` : ""}
      <p class="note is-${st}">${esc(note)}</p>
      ${canUpload ? `
        <label class="pick">
          <input type="file" accept="image/*" id="file">
          <span>${s ? "다른 사진 고르기" : "사진 고르기"}</span>
        </label>
        <img class="proof" id="preview" alt="고른 사진 미리보기" hidden>
        <button type="button" class="btn" id="send" hidden>인증샷 올리기</button>
        ${st === "pending" || st === "rejected" ? `<button type="button" class="linkish" id="cancel">올린 사진 지우기</button>` : ""}
      ` : ""}
    </form>`;
  if (canUpload) {
    let blob = null;
    const file = $("#file", dlg), send = $("#send", dlg), prev = $("#preview", dlg);
    file.onchange = async () => {
      if (!file.files[0]) return;
      try { blob = await shrink(file.files[0]); } catch (e) { return toast(e.message, true); }
      prev.src = URL.createObjectURL(blob); prev.hidden = false; send.hidden = false;
      const old = dlg.querySelector("img.proof:not(#preview)"); if (old) old.hidden = true;
    };
    send.onclick = () => busy(send, async () => {
      send.textContent = "올리는 중…";
      try { await api.submit(state.me, cell, blob); } finally { send.textContent = "인증샷 올리기"; }
      await refresh(); dlg.close(); route();
      toast("인증샷을 올렸어요. 운영진이 확인하면 칸이 채워져요.");
    });
    const cancel = $("#cancel", dlg);
    if (cancel) cancel.onclick = () => busy(cancel, async () => {
      await api.cancel(state.me, cell); await refresh(); dlg.close(); route(); toast("올린 사진을 지웠어요.");
    });
  }
  dlg.showModal();
}
$("#dlg").addEventListener("click", e => { if (e.target.id === "dlg") e.target.close(); });

/* ---------- 화면: 시작 / 내 빙고판 ---------- */
const HOWTO = `
  <ol class="howto">
    <li><b>닉네임 만들기</b><span>톡방 닉네임과 비밀번호만 정하면 끝.</span></li>
    <li><b>칸을 눌러 인증샷 올리기</b><span>미션을 한 날, 그 칸을 누르고 사진 한 장.</span></li>
    <li><b>승인되면 칸이 채워져요</b><span>가로·세로·대각선 한 줄이 차면 빙고 줄이 그어져요.</span></li>
  </ol>`;

function viewHome() {
  const app = $("#app");
  if (state.me) {
    app.innerHTML = `
      <section class="mine-head">
        <h1>${esc(state.me.nickname)}의 빙고판</h1>
        ${tallyHtml(state.me.id)}
      </section>
      ${boardHtml(state.me.id, true)}
      <p class="hint">칸을 누르면 인증샷을 올릴 수 있어요.</p>
      <details class="fold"><summary>참여 방법 다시 보기</summary>${HOWTO}</details>`;
    bindBoard(app);
    return;
  }
  app.innerHTML = `
    <section class="hero">
      <img class="hero-logo" src="assets/logo.png" alt="" width="360" height="373">
      <div>
        <h1>12월 미션 빙고</h1>
        <p class="lede">달리고, 찍고, 줄을 그어요. 스물다섯 칸 가운데 몇 줄을 만들 수 있을까요.</p>
      </div>
    </section>
    ${HOWTO}
    <section class="enter">
      <div class="tabs" role="tablist">
        <button type="button" role="tab" id="t-join" aria-selected="true">처음이에요</button>
        <button type="button" role="tab" id="t-login" aria-selected="false">이어서 하기</button>
      </div>
      <form id="enter-form">
        <label>닉네임<input name="nick" maxlength="12" autocomplete="username" required placeholder="톡방에서 쓰는 이름"></label>
        <label>비밀번호<input name="pass" type="password" minlength="4" autocomplete="current-password" required placeholder="4자 이상"></label>
        <p class="small" id="enter-help">비밀번호는 다른 기기에서 이어서 할 때 써요. 잊어버리면 운영진도 찾아 줄 수 없어요.</p>
        <button class="btn" id="enter-go">빙고판 만들기</button>
      </form>
    </section>
    <section>
      <h2>빙고판 미리 보기</h2>
      <div class="board"><div class="grid">${CELLS.map(([t, s]) => `<div class="cell is-empty"><span class="cell-title">${esc(t)}</span>${s ? `<span class="cell-sub">${esc(s)}</span>` : ""}</div>`).join("")}</div></div>
    </section>`;
  let mode = "join";
  const setMode = m => {
    mode = m;
    $("#t-join").setAttribute("aria-selected", m === "join"); $("#t-login").setAttribute("aria-selected", m === "login");
    $("#enter-go").textContent = m === "join" ? "빙고판 만들기" : "내 빙고판 열기";
    $("#enter-help").hidden = m !== "join";
  };
  $("#t-join").onclick = () => setMode("join"); $("#t-login").onclick = () => setMode("login");
  $("#enter-form").onsubmit = e => {
    e.preventDefault();
    const f = e.target, nick = f.nick.value.trim(), pass = f.pass.value;
    busy($("#enter-go"), async () => {
      const r = await (mode === "join" ? api.join(nick, pass) : api.login(nick, pass));
      setMe({ id: r.id, nickname: nick, token: r.token });
      await refresh(); route();
      if (mode === "join") toast("빙고판이 만들어졌어요. 칸을 눌러 인증샷을 올려 보세요.");
    });
  };
}

/* ---------- 화면: 참가자 ---------- */
function viewAll() {
  const rows = state.players.map(p => ({ p, ...score(p.id) }))
    .sort((a, b) => b.lines.length - a.lines.length || b.done.size - a.done.size || a.p.nickname.localeCompare(b.p.nickname, "ko"));
  $("#app").innerHTML = `
    <h1>참가자 ${rows.length}명</h1>
    ${rows.length ? `<ol class="roster">${rows.map(r => `
      <li><a href="#/u/${esc(r.p.id)}">
        <span class="mini" aria-hidden="true">${CELLS.map((_, i) => `<i class="${r.done.has(i) ? "on" : ""}"></i>`).join("")}</span>
        <span class="who">${esc(r.p.nickname)}</span>
        <span class="num"><b>${r.lines.length}</b>빙고<small>${r.done.size}칸</small></span>
      </a></li>`).join("")}</ol>`
    : `<p class="empty">아직 참가자가 없어요. <a href="#/">첫 번째로 빙고판을 만들어 보세요.</a></p>`}`;
}

function viewUser(pid) {
  const p = state.players.find(p => p.id === pid);
  if (!p) { $("#app").innerHTML = `<p class="empty">없는 참가자예요. <a href="#/all">참가자 목록으로</a></p>`; return; }
  const mine = !!state.me && state.me.id === pid;
  $("#app").innerHTML = `
    <section class="mine-head"><h1>${esc(p.nickname)}의 빙고판</h1>${tallyHtml(pid)}</section>
    ${boardHtml(pid, mine)}
    <p class="hint">칸을 누르면 인증샷을 볼 수 있어요.</p>`;
  bindBoard($("#app"));
}

/* ---------- 화면: 운영진 ---------- */
async function viewAdmin() {
  const app = $("#app");
  if (!state.adminToken || !(await api.adminCheck(state.adminToken).catch(() => false))) {
    state.adminToken = ""; sessionStorage.removeItem("stb-bingo-admin");
    const isSet = await api.adminIsSet().catch(() => true);
    app.innerHTML = `
      <h1>운영진 확인 화면</h1>
      <form id="admin-form" class="enter">
        <label>${isSet ? "운영진 비밀번호" : "운영진 비밀번호 정하기"}
          <input name="pass" type="password" minlength="${isSet ? 1 : 10}" maxlength="72" required autocomplete="${isSet ? "current-password" : "new-password"}"${isSet ? "" : ' placeholder="10자 이상"'}></label>
        ${isSet ? "" : `<p class="small">아직 운영진 비밀번호가 없어요. 지금 입력한 값이 운영진 비밀번호가 되고, 나중에 화면에서 바꿀 수 없어요.</p>`}
        <button class="btn" id="admin-go">${isSet ? "들어가기" : "비밀번호 정하고 들어가기"}</button>
      </form>`;
    $("#admin-form").onsubmit = e => {
      e.preventDefault(); const pass = e.target.pass.value;
      busy($("#admin-go"), async () => {
        const token = isSet ? await api.adminLogin(pass) : await api.adminInit(pass);
        state.adminToken = token; sessionStorage.setItem("stb-bingo-admin", token); route();
      });
    };
    return;
  }
  const name = id => (state.players.find(p => p.id === id) || {}).nickname || "?";
  const count = st => state.subs.filter(s => s.status === st).length;
  const list = state.subs.filter(s => s.status === state.adminFilter)
    .sort((a, b) => a.created_at < b.created_at ? -1 : 1);
  const emptyMsg = { pending: "확인할 인증샷이 없어요.", approved: "승인한 인증샷이 없어요.", rejected: "반려한 인증샷이 없어요." }[state.adminFilter];
  app.innerHTML = `
    <section class="mine-head"><h1>운영진 확인 화면</h1><button type="button" class="linkish" id="admin-out">운영진 나가기</button></section>
    <div class="tabs" role="tablist">
      ${["pending", "approved", "rejected"].map(st => `<button type="button" role="tab" data-f="${st}" aria-selected="${state.adminFilter === st}">${{ pending: "확인할 것", approved: "승인함", rejected: "반려함" }[st]} ${count(st)}</button>`).join("")}
    </div>
    ${list.length ? `<ul class="queue">${list.map(s => `
      <li data-id="${esc(s.id)}">
        <a href="${esc(s.photo_url)}" target="_blank" rel="noopener"><img src="${esc(s.photo_url)}" alt="${esc(name(s.player_id))}의 인증샷" loading="lazy"></a>
        <div class="q-body">
          <p class="q-who">${esc(name(s.player_id))}</p>
          <p class="q-what">${esc(CELLS[s.cell][0])}${CELLS[s.cell][1] ? ` <small>${esc(CELLS[s.cell][1])}</small>` : ""}</p>
          <p class="small">${new Date(s.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 올림${s.reject_reason ? ` / 반려 사유: ${esc(s.reject_reason)}` : ""}</p>
          <div class="q-act">
            ${s.status !== "approved" ? `<button type="button" class="btn" data-act="approved">승인</button>` : ""}
            ${s.status !== "rejected" ? `<button type="button" class="btn ghost" data-act="rejected">반려</button>` : ""}
            ${s.status !== "pending" ? `<button type="button" class="linkish" data-act="pending">확인 전으로 되돌리기</button>` : ""}
          </div>
        </div>
      </li>`).join("")}</ul>` : `<p class="empty">${emptyMsg}</p>`}`;
  $("#admin-out").onclick = () => { api.logout(state.adminToken).catch(() => {}); state.adminToken = ""; sessionStorage.removeItem("stb-bingo-admin"); location.hash = "#/"; };
  app.querySelectorAll("[data-f]").forEach(b => (b.onclick = () => { state.adminFilter = b.dataset.f; viewAdmin(); }));
  app.querySelectorAll("[data-act]").forEach(b => (b.onclick = () => {
    const id = b.closest("li").dataset.id, act = b.dataset.act;
    let reason = null;
    if (act === "rejected") { reason = prompt("반려 사유 (참가자에게 보여요. 비워 둬도 돼요)", ""); if (reason === null) return; }
    busy(b, async () => {
      await api.review(state.adminToken, id, act, reason); await refresh(); viewAdmin();
      toast({ approved: "승인했어요.", rejected: "반려했어요.", pending: "확인 전으로 되돌렸어요." }[act]);
    });
  }));
}

/* ---------- 라우터 ---------- */
function route() {
  renderNav();
  const h = location.hash.replace(/^#\/?/, "");
  document.body.classList.toggle("demo", !LIVE);
  if (h === "all") viewAll();
  else if (h.startsWith("u/")) viewUser(h.slice(2));
  else if (h === "admin") viewAdmin();
  else viewHome();
  window.scrollTo(0, 0);
}


/* ---------- 눈 ---------- */
(() => {
  const cv = document.getElementById("snow");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, flakes = [], raf = 0, last = 0;
  const make = top => {
    const z = Math.random(); // 0 멀리, 1 가까이
    return { x: Math.random() * w, y: top ? -8 : Math.random() * h, r: 1 + z * 2.6, v: 18 + z * 42, sway: 8 + Math.random() * 18, ph: Math.random() * 6.28, a: .35 + z * .55 };
  };
  const size = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round(Math.min(110, w * h / 9000));
    flakes = Array.from({ length: n }, () => make(false));
    draw(0);
  };
  const draw = dt => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fffaf0";
    for (const f of flakes) {
      f.y += f.v * dt; f.ph += dt * .9;
      if (f.y > h + 8) Object.assign(f, make(true));
      ctx.globalAlpha = f.a;
      ctx.beginPath(); ctx.arc(f.x + Math.sin(f.ph) * f.sway, f.y, f.r, 0, 6.2832); ctx.fill();
    }
  };
  const tick = t => { const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; draw(dt); raf = requestAnimationFrame(tick); };
  const start = () => { if (!still && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  size(); start();
})();
window.addEventListener("hashchange", async () => { await refresh().catch(() => {}); route(); });
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error("framed"); }
(async () => {
  if (!LIVE) document.body.insertAdjacentHTML("afterbegin", `<p class="demo-bar">미리보기 모드예요. 올린 내용은 이 기기에만 저장돼요.</p>`);
  try { await refresh(); route(); }
  catch (e) { $("#app").innerHTML = `<p class="empty">빙고판을 불러오지 못했어요. 새로고침해 주세요.<br><small>${esc(e.message)}</small></p>`; }
})();
})();

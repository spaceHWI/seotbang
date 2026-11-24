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

// 칸 아이콘 (32x32, 선 굵기 2). f-a 주황, f-b 노랑, f-c 청록 채움 / s-a, s-c 선 색
const ICONS = [
  /* 0 단체사진 */ '<path d="M4 9V5h4M28 9V5h-4M4 23v4h4M28 23v4h-4"/><circle cx="8.5" cy="14.5" r="2.3"/><circle cx="23.5" cy="14.5" r="2.3"/><path d="M9.5 24c0-4 3-6.5 6.5-6.500s6.5 2.5 6.5 6.5"/><circle class="f-a" cx="16" cy="12" r="3.3"/>',
  /* 1 누적 상승 */ '<path d="M2.5 27l9-15 4.5 7 3-4 7 12z"/><path class="s-a" d="M25 13V4M21.5 7.500L25 4l3.5 3.5"/>',
  /* 2 오름 2개 */ '<path class="f-b" d="M2 26c2.5-8 6-12 9.5-12 3 0 5.5 3 7.5 7"/><path class="f-c" d="M11 26c2-6.5 5-10 8.5-10s7 3.5 10.5 10z"/><path d="M2 26h28"/>',
  /* 3 해안도로 일출 */ '<path class="f-b" d="M9 18a7 7 0 0114 0z"/><path d="M16 5v3M6.5 9l2 2M25.5 9l-2 2M3 18h26"/><path class="s-c" d="M4 23c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0M7 27.500c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  /* 4 백록담 */ '<path d="M2.5 27L10 12.500c.8-1.5 2-1.8 3.2-1l2.8 1.8 2.8-1.800c1.2-.8 2.4-.5 3.2 1L29.5 27z"/><ellipse class="f-c" cx="16" cy="17.5" rx="4.5" ry="1.8"/>',
  /* 5 야간 트레일 */ '<path class="f-b" d="M22.5 3.500a6.5 6.5 0 106 8.5 5 5 0 01-6-8.500z"/><path d="M8 5v4M6 7h4"/><path d="M2.5 28l8.5-12 4 5 3-3.5 8.5 10.500z"/>',
  /* 6 셀카 */ '<rect x="9" y="3" width="14" height="26" rx="3"/><circle class="f-b" cx="16" cy="13" r="4.3"/><path d="M14.2 13.800c1 1 2.6 1 3.6 0"/><circle class="f-a" cx="16" cy="24" r="1.4"/>',
  /* 7 7분대 조깅 */ '<circle cx="16" cy="18" r="9.5"/><path d="M13 3.500h6M16 3.500v5M24 9.500l2-2"/><path class="s-a" d="M16 18v-5.5"/><path d="M16 18l3.5 2"/>',
  /* 8 처음 가는 코스 */ '<path d="M16 28.500s-8.5-8.5-8.5-14.500a8.5 8.5 0 0117 0c0 6-8.5 14.5-8.5 14.500z"/><circle class="f-a" cx="16" cy="14" r="3.2"/><path class="s-a" d="M27 2.500v4M25 4.500h4"/>',
  /* 9 트랙벙 */ '<rect class="f-a" x="2.5" y="7.5" width="27" height="17" rx="8.5"/><rect class="f-cell" x="9" y="13" width="14" height="6" rx="3"/><path d="M16 7.500V13M16 19v5.5"/>',
  /* 10 350km */ '<path d="M5 22c0-2 .8-3 2-3.300l3-6.2 3 1c1 3 3 5 6 5.800l6 1.500c2 .5 3 1.7 3 3.200v1H5z"/><path class="s-a" d="M5 24.800h23"/><path d="M1.5 13.500H6M1 17.500h3.5"/><path class="f-b" d="M22 2l-4 6h3.500l-1.5 5 5-7h-3.500z"/>',
  /* 11 모닝커피 */ '<path d="M5.5 13h17v6a7 7 0 01-7 7h-3a7 7 0 01-7-7z"/><path d="M22.5 15h2a3 3 0 010 6H22M5 29.500h18"/><path class="s-a" d="M11 9.500c-1.2-1.5 1.2-2.5 0-4.500M16.5 9.500c-1.2-1.5 1.2-2.5 0-4.5"/>',
  /* 12 연속 4일 */ '<path class="f-a" d="M16.5 2.500c.5 5 6.5 7 6.5 13.500a7 7 0 01-14 0c0-2.8 1.3-4.3 2.5-5.8.4 2 1.3 3 2.5 3 0-4 .5-7.2 2.5-10.700z"/><circle class="dot" cx="8.5" cy="28" r="1.6"/><circle class="dot" cx="13.5" cy="28" r="1.6"/><circle class="dot" cx="18.5" cy="28" r="1.6"/><circle class="dot" cx="23.5" cy="28" r="1.6"/>',
  /* 13 풍경 사진 */ '<rect x="3" y="6" width="26" height="20" rx="2.5"/><circle class="f-b" cx="22.5" cy="12" r="2.6"/><path d="M3.5 23l6.5-7.5 5 5 3-3 10.5 8"/>',
  /* 14 찍터벌 */ '<path d="M11 9l2-4h6l2 4"/><rect x="3" y="9" width="26" height="17" rx="3"/><circle cx="16" cy="17.5" r="5.2"/><circle class="f-a" cx="16" cy="17.5" r="2.2"/><circle class="dot" cx="24.5" cy="13" r="1"/>',
  /* 15 새 친구 */ '<circle cx="10.5" cy="12" r="3.5"/><circle cx="22" cy="13" r="3"/><path d="M3.5 27c0-5 3-8 7-8s7 3 7 8M19 20.500c.9-.9 1.9-1.3 3-1.3 3.5 0 6 2.6 6 7.3"/><path class="f-a" d="M16.5 8c-2.2-1.6-3.3-2.7-3.3-4.100a1.8 1.8 0 013.3-1 1.8 1.8 0 013.3 1c0 1.4-1.1 2.5-3.3 4.100z"/>',
  /* 16 돈평돈 */ '<path d="M3.5 27L16 7l12.5 20"/><path class="s-a" d="M9.5 21.500l3.2-5.200M12.7 16.300l-3.4.6M12.7 16.300l.6 3.400M19.3 16.300l3.2 5.200M22.5 21.500l-3.4-.6M22.5 21.500l.6-3.4"/><path class="f-b" d="M16 7V2.500l4 1.8-4 1.7"/><circle class="dot" cx="3.5" cy="27" r="1.6"/><circle class="dot" cx="28.5" cy="27" r="1.6"/>',
  /* 17 아이싱 */ '<path class="s-c" d="M16 3v15M9.5 6.800l13 7.500M22.5 6.800l-13 7.500M13.5 4l2.5 2 2.5-2M13.5 17l2.5-2 2.5 2"/><path d="M3.5 24c2.1-2 4.2-2 6.3 0s4.1 2 6.2 0 4.1-2 6.2 0 4.2 2 6.3 0M3.5 28.500c2.1-2 4.2-2 6.3 0s4.1 2 6.2 0 4.1-2 6.2 0 4.2 2 6.3 0"/>',
  /* 18 5km TT */ '<path d="M7 3.500v25.5"/><path class="f-a" d="M7 4.500h20l-4.5 6 4.5 6H7z"/><text class="t" x="14.8" y="13.7">5K</text>',
  /* 19 주 5일 */ '<rect x="4" y="6" width="24" height="22" rx="3"/><path d="M4 12.500h24M10 3.500v5M22 3.500v5"/><circle class="f-a thin" cx="9.5" cy="17.5" r="1.9"/><circle class="f-a thin" cx="14" cy="17.5" r="1.9"/><circle class="f-a thin" cx="18.5" cy="17.5" r="1.9"/><circle class="f-a thin" cx="23" cy="17.5" r="1.9"/><circle class="f-a thin" cx="9.5" cy="23" r="1.9"/><circle class="thin" cx="14" cy="23" r="1.9"/><circle class="thin" cx="18.5" cy="23" r="1.9"/>',
  /* 20 PB */ '<path d="M10.5 3l5.5 9.500L21.5 3"/><circle class="f-b" cx="16" cy="20.5" r="8.5"/><text class="t ink" x="16" y="23.5">PB</text>',
  /* 21 06:00 전 */ '<circle cx="16" cy="17" r="10.5"/><path d="M7 5.500L3.5 9M25 5.500L28.5 9"/><path d="M16 17V10"/><path class="s-a" d="M16 17v5.5"/>',
  /* 22 한라산 일출 */ '<path class="f-b" d="M9 16a7 7 0 0114 0z"/><path d="M16 3v3M6 7l2.2 2.200M26 7l-2.2 2.2"/><path class="f-cell" d="M2 28.500l10-13 4 4 4-4 10 13z"/>',
  /* 23 소정방 폭포 */ '<path d="M3.5 4.500h9V11M28.5 4.500h-9V11"/><path class="s-c" d="M12.5 4.500V21M16 4.500v19M19.5 4.500V21"/><path d="M4.5 27c2.6-2.6 5.2-2.6 7.7 0s5.1 2.6 7.6 0 5.1-2.6 7.7 0"/>',
  /* 24 200km */ '<path d="M5 22c0-2 .8-3 2-3.300l3-6.2 3 1c1 3 3 5 6 5.800l6 1.500c2 .5 3 1.7 3 3.200v1H5z"/><path class="s-a" d="M5 24.800h23"/><path d="M1.5 13.500H6M1 17.500h3.5"/>',
];
const icon = i => `<svg class="ic" viewBox="0 0 32 32" aria-hidden="true">${ICONS[i]}</svg>`;

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
    async listItems() {
      const { data, error } = await sb.from("bingo_items")
        .select("id,player_id,title,category,description,price,pickup,photo_path,status,buyer_id,created_at").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data.map(i => ({ ...i, photo_url: sb.storage.from(BUCKET).getPublicUrl(i.photo_path).data.publicUrl }));
    },
    async listQueue() {
      const { data, error } = await sb.from("bingo_item_queue").select("item_id,player_id,offer,created_at").order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
    async itemPost(me, d, blob) {
      const path = `${me.id}/90-${Date.now()}.jpg`;
      const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", headers: { "x-bingo-token": me.token } });
      if (up.error) throw new Error("사진을 올리지 못했어요. " + up.error.message);
      return rpc("bingo_item_post", { p_token: me.token, p_title: d.title, p_category: d.category, p_description: d.description, p_price: d.price, p_pickup: d.pickup, p_path: path });
    },
    itemStatus: (me, id, status) => rpc("bingo_item_status", { p_token: me.token, p_item: id, p_status: status }),
    itemSell: (me, id, buyer) => rpc("bingo_item_sell", { p_token: me.token, p_item: id, p_buyer: buyer }),
    itemDelete: (token, id) => rpc("bingo_item_delete", { p_token: token, p_item: id }),
    queueJoin: (me, id, offer) => rpc("bingo_item_queue_join", { p_token: me.token, p_item: id, p_offer: offer }),
    queueLeave: (me, id) => rpc("bingo_item_queue_leave", { p_token: me.token, p_item: id }),
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
  const db = Object.assign({ players: [], subs: [], admin: null, items: [], queue: [] }, load());
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
    async listItems() { return db.items.map(i => ({ ...i })); },
    async listQueue() { return db.queue.map(q => ({ ...q })); },
    async itemPost(me, d, blob) {
      auth(me);
      const id = uid(); db.items.push({ id, player_id: me.id, ...d, photo_url: await toDataUrl(blob), status: "open", created_at: new Date().toISOString() }); save(); return id;
    },
    async itemStatus(me, id, status) { auth(me); const i = db.items.find(i => i.id === id && i.player_id === me.id); if (!i) throw new Error("내가 올린 물건만 바꿀 수 있어요."); i.status = status; if (status !== "done") i.buyer_id = null; save(); },
    async itemSell(me, id, buyer) {
      auth(me); const i = db.items.find(i => i.id === id && i.player_id === me.id);
      if (!i) throw new Error("내가 올린 물건만 바꿀 수 있어요.");
      if (!db.queue.some(q => q.item_id === id && q.player_id === buyer)) throw new Error("줄 선 사람 가운데에서 골라 주세요.");
      i.status = "done"; i.buyer_id = buyer; save();
    },
    async itemDelete(token, id) {
      const i = db.items.find(i => i.id === id); if (!i) return;
      const owner = db.players.find(p => p.id === i.player_id);
      if (!(db.admin && db.admin === token) && !(owner && owner.pass === token)) throw new Error("내가 올린 물건만 지울 수 있어요.");
      db.items = db.items.filter(x => x.id !== id); db.queue = db.queue.filter(q => q.item_id !== id); save();
    },
    async queueJoin(me, id, offer) {
      auth(me); const i = db.items.find(i => i.id === id);
      if (!i) throw new Error("없는 물건이에요.");
      if (i.player_id === me.id) throw new Error("내가 올린 물건에는 줄을 설 수 없어요.");
      if (i.status === "done") throw new Error("거래가 끝난 물건이에요.");
      const mine = db.queue.find(q => q.item_id === id && q.player_id === me.id);
      if (mine) mine.offer = offer; else db.queue.push({ item_id: id, player_id: me.id, offer, created_at: new Date().toISOString() });
      save();
    },
    async queueLeave(me, id) { auth(me); db.queue = db.queue.filter(q => !(q.item_id === id && q.player_id === me.id)); save(); },
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
  players: [], subs: [], items: [], queue: [], cat: "",
  me: (() => { try { const m = JSON.parse(localStorage.getItem(ME_KEY)); return m && m.token ? m : null; } catch { return null; } })(),
  adminToken: sessionStorage.getItem("stb-bingo-admin") || "",
  adminFilter: "pending",
  drawn: new Set(), // 이미 그어진 줄(다시 그리는 애니메이션 방지)
};
const setMe = me => { state.me = me; me ? localStorage.setItem(ME_KEY, JSON.stringify(me)) : localStorage.removeItem(ME_KEY); };

async function refresh() {
  const [players, subs, items, queue] = await Promise.all([api.listPlayers(), api.listSubs(), api.listItems().catch(() => []), api.listQueue().catch(() => [])]);
  state.players = players; state.subs = subs; state.items = items; state.queue = queue;
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
  catch (e) {
    const msg = e.message || "문제가 생겼어요. 잠시 뒤 다시 해 주세요.";
    toast(msg, true);
    if (msg.startsWith("로그인이 풀렸어요")) { setMe(null); $("#dlg").close(); route(); }
    if (msg.startsWith("운영진 로그인이 풀렸어요")) { state.adminToken = ""; sessionStorage.removeItem("stb-bingo-admin"); $("#dlg").close(); route(); }
  }
  finally { if (btn) btn.disabled = false; }
}

function renderNav() {
  $("#nav").innerHTML = state.me
    ? `<a href="#/">빙고판</a><a href="#/all">참가자</a><a href="#/dugeun">두근</a><a href="#/admin">운영진</a><button type="button" class="linkish" id="logout">나가기</button>`
    : `<a href="#/">시작하기</a><a href="#/all">참가자</a><a href="#/dugeun">두근</a><a href="#/admin">운영진</a>`;
  const lo = $("#logout");
  if (lo) lo.onclick = () => { if (confirm("이 기기에서 로그아웃할까요? 기록은 그대로 남아요.")) { api.logout(state.me.token).catch(() => {}); setMe(null); route(); } };
}

/* ---------- 비밀번호 입력칸 (눈 아이콘으로 보기/가리기) ---------- */
const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="slash" d="M4 4l16 16"/></svg>';
const pwField = (name, placeholder, auto, min = 4) => `<span class="pw"><input name="${name}" type="password" minlength="${min}" maxlength="72" autocomplete="${auto}" placeholder="${placeholder}"><button type="button" class="eye" aria-label="비밀번호 보기" aria-pressed="false">${EYE}</button></span>`;
function bindPw(root) {
  root.querySelectorAll(".pw .eye").forEach(b => (b.onclick = () => {
    const inp = b.previousElementSibling, show = inp.type === "password";
    inp.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", show); b.setAttribute("aria-label", show ? "비밀번호 가리기" : "비밀번호 보기");
    inp.focus();
  }));
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
      ${tag}${st === "approved" ? "" : icon(i)}<span class="cell-title">${esc(title)}</span>${sub ? `<span class="cell-sub">${esc(sub)}</span>` : ""}
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
      <div class="sheet-ic">${icon(cell)}</div>
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
      ${rankingHtml()}
      <details class="fold"><summary>참여 방법 다시 보기</summary>${HOWTO}</details>`;
    bindBoard(app);
    return;
  }
  app.innerHTML = `
    <section class="hero">
      <h1>12월 서트방 미션 빙고</h1>
      <p class="period"><time datetime="2026-12-01">2026년 12월 1일</time> ~ <time datetime="2026-12-31">31일</time></p>
      <p class="lede">달리고, 찍고, 줄을 그어요.</p>
    </section>
    ${HOWTO}
    <section class="enter" id="enter-box"></section>
    <section>
      <h2>빙고판 미리 보기</h2>
      <div class="board"><div class="grid">${CELLS.map(([t, s], i) => `<div class="cell is-empty">${icon(i)}<span class="cell-title">${esc(t)}</span>${s ? `<span class="cell-sub">${esc(s)}</span>` : ""}</div>`).join("")}</div></div>
    </section>
    ${rankingHtml()}`;
  // 닉네임 → 비밀번호 두 단계. 닉네임 칸이 있는 동안에는 비밀번호 칸을 화면에 두지 않는다.
  // (아이폰은 비밀번호 칸 바로 위 입력칸을 로그인 아이디로 보고 영문 자판만 띄울 수 있다)
  const box = $("#enter-box");
  const stepNick = keep => {
    box.innerHTML = `
      <div class="enter-step">
        <label>닉네임<input id="nick-in" lang="ko" inputmode="text" maxlength="12" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="톡방에서 쓰는 이름" value="${esc(keep || "")}"></label>
        <p class="small">처음이면 새로 만들고, 만든 적 있으면 이어서 해요.</p>
        <button type="button" class="btn" id="nick-go">다음</button>
      </div>`;
    const inp = $("#nick-in"), go = $("#nick-go");
    const next = () => {
      const nick = inp.value.trim();
      if (!nick) return toast("닉네임을 입력해 주세요.", true);
      busy(go, async () => { await refresh(); stepPass(nick, !state.players.some(p => p.nickname === nick)); });
    };
    go.onclick = next;
    inp.onkeydown = e => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); next(); } };
  };
  const stepPass = (nick, fresh) => {
    box.innerHTML = `
      <form id="enter-form" novalidate>
        <p class="who-line"><b>${esc(nick)}</b> 님, ${fresh ? "처음이네요. 비밀번호를 정해 주세요." : "다시 오셨네요. 비밀번호를 넣어 주세요."}</p>
        <label>비밀번호${pwField("pass", "4자 이상", fresh ? "new-password" : "current-password")}</label>
        ${fresh ? `<label>비밀번호 한 번 더${pwField("pass2", "같은 비밀번호", "new-password")}</label>
        <p class="small">비밀번호는 다른 기기에서 이어서 할 때 써요. 잊어버리면 운영진도 찾아 줄 수 없어요.</p>` : ""}
        <button class="btn" id="enter-go">${fresh ? "빙고판 만들기" : "내 빙고판 열기"}</button>
        <button type="button" class="linkish" id="nick-back">닉네임 다시 적기</button>
      </form>`;
    bindPw(box);
    const f = $("#enter-form");
    $("#nick-back").onclick = () => stepNick(nick);
    f.pass.focus();
    f.onsubmit = e => {
      e.preventDefault();
      const pass = f.pass.value;
      if (pass.length < 4) return toast("비밀번호는 4자 이상으로 정해 주세요.", true);
      if (fresh && f.pass2.value !== pass) { f.pass2.focus(); return toast(f.pass2.value ? "비밀번호 두 개가 서로 달라요." : "비밀번호를 한 번 더 입력해 주세요.", true); }
      busy($("#enter-go"), async () => {
        const r = await (fresh ? api.join(nick, pass) : api.login(nick, pass));
        setMe({ id: r.id, nickname: nick, token: r.token });
        await refresh(); route();
        if (fresh) toast("빙고판이 만들어졌어요. 칸을 눌러 인증샷을 올려 보세요.");
      });
    };
  };
  stepNick();
}

/* ---------- 화면: 참가자 ---------- */
function ranked() {
  const rows = state.players.map(p => ({ p, ...score(p.id) }))
    .sort((a, b) => b.lines.length - a.lines.length || b.done.size - a.done.size || a.p.nickname.localeCompare(b.p.nickname, "ko"));
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.lines.length === r.lines.length && prev.done.size === r.done.size ? prev.rank : i + 1;
  });
  return rows;
}

function rosterHtml(rows) {
  return `<ol class="roster">${rows.map(r => `
    <li class="${state.me && state.me.id === r.p.id ? "me" : ""}"><a href="#/u/${esc(r.p.id)}">
      <span class="rank">${r.rank}</span>
      <span class="mini" aria-hidden="true">${CELLS.map((_, i) => `<i class="${r.done.has(i) ? "on" : ""}"></i>`).join("")}</span>
      <span class="who">${esc(r.p.nickname)}</span>
      <span class="num"><b>${r.lines.length}</b>빙고<small>${r.done.size}칸</small></span>
    </a></li>`).join("")}</ol>`;
}

// 빙고판 아래에 붙는 현재 랭킹 (위에서 10명 + 내 순위)
function rankingHtml() {
  const rows = ranked(), TOP = 10;
  if (!rows.length) return "";
  const top = rows.slice(0, TOP);
  const mine = state.me ? rows.find(r => r.p.id === state.me.id) : null;
  if (mine && !top.includes(mine)) top.push(mine);
  return `<section class="ranking">
    <h2>현재 랭킹</h2>
    ${rosterHtml(top)}
    ${rows.length > TOP ? `<p class="more"><a href="#/all">참가자 ${rows.length}명 모두 보기</a></p>` : ""}
  </section>`;
}

function viewAll() {
  const rows = ranked();
  $("#app").innerHTML = `
    <h1>참가자 ${rows.length}명</h1>
    ${rows.length ? rosterHtml(rows)
    : `<p class="empty">아직 참가자가 없어요. <a href="#/">첫 번째로 빙고판을 만들어 보세요.</a></p>`}`;
}

function viewUser(pid) {
  const p = state.players.find(p => p.id === pid);
  if (!p) { $("#app").innerHTML = `<p class="empty">없는 참가자예요. <a href="#/all">참가자 목록으로</a></p>`; return; }
  const mine = !!state.me && state.me.id === pid;
  $("#app").innerHTML = `
    <section class="mine-head"><h1>${esc(p.nickname)}의 빙고판</h1>${tallyHtml(pid)}</section>
    ${boardHtml(pid, mine)}
    <p class="hint">칸을 누르면 인증샷을 볼 수 있어요.</p>
    ${rankingHtml()}`;
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
          ${pwField("pass", isSet ? "" : "10자 이상", isSet ? "current-password" : "new-password", isSet ? 1 : 10)}</label>
        ${isSet ? "" : `<p class="small">아직 운영진 비밀번호가 없어요. 지금 입력한 값이 운영진 비밀번호가 되고, 나중에 화면에서 바꿀 수 없어요.</p>`}
        <button class="btn" id="admin-go">${isSet ? "들어가기" : "비밀번호 정하고 들어가기"}</button>
      </form>`;
    bindPw(app);
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
    const run = (btn, reason) => busy(btn, async () => {
      await api.review(state.adminToken, id, act, reason); await refresh(); $("#dlg").close(); viewAdmin();
      toast({ approved: "승인했어요.", rejected: "반려했어요.", pending: "확인 전으로 되돌렸어요." }[act]);
    });
    if (act !== "rejected") return run(b, null);
    const dlg = $("#dlg"), s = state.subs.find(x => x.id === id);
    dlg.innerHTML = `
      <form class="sheet" id="reject-form">
        <button type="button" class="close" id="reject-close">닫기</button>
        <h2>반려하기</h2>
        <p>${esc(name(s.player_id))} · ${esc(CELLS[s.cell][0])}</p>
        <label class="field">반려 사유<input name="reason" maxlength="200" placeholder="참가자에게 보여요. 비워 둬도 돼요" autocomplete="off"></label>
        <button class="btn" id="reject-go">반려하기</button>
      </form>`;
    $("#reject-close").onclick = () => dlg.close();
    $("#reject-form").onsubmit = ev => { ev.preventDefault(); run($("#reject-go"), ev.target.reason.value.trim()); };
    dlg.showModal();
  }));
}

/* ---------- 두근 (장터) ---------- */
const CATS = ["신발", "의류", "가방·조끼", "장비", "시계·전자기기", "보급·영양", "기타"];
const ITEM_STATUS = { open: "판매 중", reserved: "예약 중", done: "거래 완료" };
const won = n => (n === 0 ? "나눔" : n.toLocaleString("ko-KR") + "원");
const nickOf = id => (state.players.find(p => p.id === id) || {}).nickname || "?";
const queueOf = id => state.queue.filter(q => q.item_id === id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
const BEAT = '<svg class="beat" viewBox="0 0 40 36" aria-hidden="true"><path class="beat-heart" d="M20 33C8 24 4 18.5 4 12.5A8.5 8.5 0 0120 9.500a8.500 8.500 0 0116 3C36 18.500 32 24 20 33z"/><path class="beat-line" d="M9.500 18.500h5.500l2.500-5 4 10 3-7 1.500 2h4.500"/></svg>'.replace(/\.500/g, ".5");
const PIN = '<svg class="pin" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.500S3.500 10 3.500 6.500a4.500 4.500 0 019 0C12.500 10 8 14.500 8 14.500z"/><circle cx="8" cy="6.500" r="1.500"/></svg>'.replace(/\.500/g, ".5");
// 달리는 사람 픽토그램 (줄 앞쪽인 왼쪽을 보고 달림)
const RUNNER = '<svg class="runner" viewBox="0 0 32 36" aria-hidden="true"><g transform="translate(32 0) scale(-1 1)"><circle cx="20.500" cy="5.500" r="3.800"/><path d="M18 11.500L14 21M18 12l5.500 3 3-3.500M17 12.500l-5.500.500-2.500 4M14 21l6.500 3-1 8M14 21l-4.500 5.500H3.500"/></g></svg>'.replace(/\.500/g, ".5").replace(/\.800/g, ".8");
const needLogin = () => { toast("먼저 빙고판을 만들어 주세요. 같은 닉네임으로 두근도 써요.", true); location.hash = "#/"; };

function tokensHtml(q, max) {
  return q.slice(0, max).map(x => `<i class="tok-s${state.me && x.player_id === state.me.id ? " me" : ""}">${RUNNER}</i>`).join("") +
    (q.length > max ? `<i class="tok-more">+${q.length - max}</i>` : "");
}

function viewDugeun() {
  const app = $("#app"), cat = state.cat;
  const order = { open: 0, reserved: 1, done: 2 };
  const all = [...state.items].sort((a, b) => order[a.status] - order[b.status] || (a.created_at < b.created_at ? 1 : -1));
  const list = cat ? all.filter(i => i.category === cat) : all;
  const count = c => all.filter(i => i.category === c).length;
  app.innerHTML = `
    <section class="dg-head">
      <div>
        <h1>${BEAT}두근</h1>
        <p class="lede">서트방 러너들의 장터. 갖고 싶으면 줄부터 서요.</p>
      </div>
      <button type="button" class="btn" id="dg-new">물건 올리기</button>
    </section>
    <div class="chips" role="tablist" aria-label="카테고리">
      <button type="button" role="tab" data-cat="" aria-selected="${!cat}">전체 ${all.length}</button>
      ${CATS.map(c => `<button type="button" role="tab" data-cat="${esc(c)}" aria-selected="${cat === c}">${esc(c)} ${count(c)}</button>`).join("")}
    </div>
    ${list.length ? `<ul class="items">${list.map(i => { const q = queueOf(i.id); return `
      <li><button type="button" class="item is-${i.status}" data-item="${esc(i.id)}">
        <span class="item-photo" style="background-image:url('${esc(cssUrl(i.photo_url))}')">${i.status !== "open" ? `<span class="badge">${ITEM_STATUS[i.status]}</span>` : ""}</span>
        <span class="item-body">
          <span class="item-title">${esc(i.title)}</span>
          <span class="item-price">${won(i.price)}</span>
          <span class="item-meta">${PIN}${esc(i.pickup)}</span>
          <span class="item-queue">${q.length ? `${tokensHtml(q, 4)}<span>줄 ${q.length}명</span>${topOffer(q) > 0 ? `<span class="offer-top">최고 ${won(topOffer(q))}</span>` : ""}` : `<span>아직 줄이 없어요</span>`}</span>
        </span>
      </button></li>`; }).join("")}</ul>`
    : `<p class="empty">${cat ? `${esc(cat)}에는 아직 올라온 물건이 없어요.` : "아직 올라온 물건이 없어요. 첫 물건을 올려 보세요."}</p>`}`;
  app.querySelectorAll("[data-cat]").forEach(b => (b.onclick = () => { state.cat = b.dataset.cat; viewDugeun(); }));
  app.querySelectorAll("[data-item]").forEach(b => (b.onclick = () => openItem(b.dataset.item)));
  $("#dg-new").onclick = () => (state.me ? openItemForm() : needLogin());
}

const topOffer = q => q.reduce((m, x) => (x.offer != null && x.offer > m ? x.offer : m), -1);

// 줄 그림: 트랙 위에 선 순서대로 달리는 사람. 말풍선은 각자 적은 제시 가격.
// 올린 사람에게는 각 러너가 버튼이 되어, 눌러서 팔 사람을 고른다.
function laneHtml(item, q, picked) {
  const mine = !!state.me && item.player_id === state.me.id;
  const inLine = !!state.me && q.some(x => x.player_id === state.me.id);
  const canJoin = !mine && !inLine && item.status !== "done";
  const canPick = mine && item.status !== "done";
  const top = topOffer(q);
  return `<div class="lane" role="list" aria-label="줄 선 순서">
    ${q.map((x, n) => {
      const me = state.me && x.player_id === state.me.id, buyer = item.buyer_id === x.player_id;
      const cls = `tok${me ? " me" : ""}${buyer ? " buyer" : ""}${picked === x.player_id ? " picked" : ""}`;
      const inner = `<em>${n + 1}</em>
        ${buyer ? `<span class="bubble sold">구매</span>` : x.offer != null ? `<span class="bubble${x.offer === top ? " top" : ""}">${x.offer === 0 ? "나눔" : x.offer.toLocaleString("ko-KR")}</span>` : `<span class="bubble none" aria-hidden="true"></span>`}
        ${RUNNER}<b>${me ? "나" : esc(nickOf(x.player_id))}</b>`;
      return canPick ? `<button type="button" class="${cls} pick-b" data-pick="${esc(x.player_id)}" aria-pressed="${picked === x.player_id}" role="listitem">${inner}</button>`
        : `<span class="${cls}" role="listitem">${inner}</span>`; }).join("")}
    ${canJoin ? `<button type="button" class="tok join" id="q-join" role="listitem"><em>${q.length + 1}</em><span class="bubble none" aria-hidden="true"></span>${RUNNER}<b>여기 서기</b></button>` : ""}
    ${!q.length && !canJoin ? `<span class="lane-empty">아직 줄 선 사람이 없어요</span>` : ""}
  </div>`;
}

function openItem(id, picked) {
  const dlg = $("#dlg"), item = state.items.find(i => i.id === id);
  if (!item) return;
  const q = queueOf(id), mine = !!state.me && item.player_id === state.me.id;
  const pos = state.me ? q.findIndex(x => x.player_id === state.me.id) : -1;
  const line = mine
    ? (item.status === "done" ? (item.buyer_id ? `${nickOf(item.buyer_id)} 님에게 판매 완료했어요.` : "거래 완료로 바꾼 물건이에요.")
      : q.length ? `${q.length}명이 줄 서 있어요.${topOffer(q) > 0 ? ` 가장 높은 제시 가격은 ${won(topOffer(q))}이에요.` : ""} 팔 사람을 눌러서 골라 주세요.` : "아직 줄 선 사람이 없어요.")
    : item.status === "done" ? (state.me && item.buyer_id === state.me.id ? "내가 사기로 한 물건이에요. 톡방에서 수령을 정해 주세요."
        : item.buyer_id ? `${nickOf(item.buyer_id)} 님에게 팔렸어요.` : "거래가 끝난 물건이에요.")
    : pos >= 0 ? `줄 ${q.length}명 가운데 내 순서는 ${pos + 1}번이에요.`
    : q.length ? `지금 ${q.length}명이 줄 서 있어요.` : "첫 번째로 줄 설 수 있어요.";
  dlg.innerHTML = `
    <div class="sheet dg-sheet">
      <button type="button" class="close" id="it-close">닫기</button>
      <img class="proof" src="${esc(item.photo_url)}" alt="${esc(item.title)} 사진">
      <p class="it-tags"><span class="tagc">${esc(item.category)}</span><span class="tagc st-${item.status}">${ITEM_STATUS[item.status]}</span></p>
      <h2>${esc(item.title)}</h2>
      <p class="it-price">${won(item.price)}</p>
      ${item.description ? `<p class="it-desc">${esc(item.description)}</p>` : ""}
      <dl class="it-info"><dt>수령처</dt><dd>${esc(item.pickup)}</dd><dt>올린 사람</dt><dd>${esc(nickOf(item.player_id))}</dd></dl>
      <h3>줄 서기</h3>
      ${laneHtml(item, q, picked)}
      <p class="note">${esc(line)}</p>
      ${!mine && item.status !== "done" ? `
        <label class="field">${pos >= 0 ? "내 말풍선 가격" : "말풍선에 적을 가격"}<span class="price-in"><input id="q-offer" inputmode="numeric" maxlength="11" autocomplete="off" placeholder="안 적어도 돼요" value="${pos >= 0 && q[pos].offer != null ? q[pos].offer.toLocaleString("ko-KR") : ""}"><span>원</span></span></label>
        <button type="button" class="btn" id="q-join2">${pos >= 0 ? "가격 바꾸기" : "줄 서기"}</button>` : ""}
      ${pos >= 0 && item.status !== "done" ? `<button type="button" class="btn ghost" id="q-leave">줄에서 나오기</button>` : ""}
      ${mine && item.status !== "done" && q.length ? `<button type="button" class="btn" id="it-sell"${picked ? "" : " disabled"}>${picked ? `${esc(nickOf(picked))} 님에게 판매 완료` : "팔 사람을 골라 주세요"}</button>` : ""}
      ${mine ? `<div class="seg" role="group" aria-label="거래 상태">${Object.keys(ITEM_STATUS).map(s => `<button type="button" data-st="${s}" aria-pressed="${item.status === s}">${ITEM_STATUS[s]}</button>`).join("")}</div>` : ""}
      ${mine || state.adminToken ? `<button type="button" class="linkish" id="it-del">${mine ? "이 물건 지우기" : "운영진 권한으로 지우기"}</button>` : ""}
    </div>`;
  const again = async () => { await refresh(); if (location.hash.replace(/^#\/?/, "") === "dugeun") viewDugeun(); state.items.some(i => i.id === id) ? openItem(id) : dlg.close(); };
  $("#it-close").onclick = () => dlg.close();
  const offerIn = $("#q-offer", dlg);
  if (offerIn) offerIn.oninput = () => { const d = offerIn.value.replace(/\D/g, "").slice(0, 9); offerIn.value = d ? Number(d).toLocaleString("ko-KR") : ""; };
  const join = btn => {
    if (!state.me) { dlg.close(); return needLogin(); }
    const d = offerIn ? offerIn.value.replace(/\D/g, "") : "";
    busy(btn, async () => { await api.queueJoin(state.me, id, d ? Number(d) : null); await again(); toast(pos >= 0 ? "가격을 바꿨어요." : "줄을 섰어요."); });
  };
  ["#q-join", "#q-join2"].forEach(s => { const b = $(s, dlg); if (b) b.onclick = () => join(b); });
  const leave = $("#q-leave", dlg);
  if (leave) leave.onclick = () => busy(leave, async () => { await api.queueLeave(state.me, id); await again(); toast("줄에서 나왔어요."); });
  dlg.querySelectorAll("[data-st]").forEach(b => (b.onclick = () => busy(b, async () => { await api.itemStatus(state.me, id, b.dataset.st); await again(); })));
  dlg.querySelectorAll("[data-pick]").forEach(b => (b.onclick = () => openItem(id, picked === b.dataset.pick ? null : b.dataset.pick)));
  const sell = $("#it-sell", dlg);
  if (sell && picked) sell.onclick = () => busy(sell, async () => { await api.itemSell(state.me, id, picked); await again(); toast(`${nickOf(picked)} 님에게 판매 완료했어요.`); });
  const del = $("#it-del", dlg);
  if (del) del.onclick = () => {
    if (del.dataset.sure !== "1") { del.dataset.sure = "1"; del.textContent = "한 번 더 누르면 지워져요. 되돌릴 수 없어요."; return; }
    busy(del, async () => { await api.itemDelete(mine ? state.me.token : state.adminToken, id); await again(); toast("물건을 지웠어요."); });
  };
  if (!dlg.open) dlg.showModal();
}

function openItemForm() {
  const dlg = $("#dlg");
  dlg.innerHTML = `
    <form class="sheet dg-sheet" id="it-form" novalidate>
      <button type="button" class="close" id="it-close">닫기</button>
      <h2>물건 올리기</h2>
      <label class="pick"><input type="file" accept="image/*" id="it-file"><span>사진 고르기</span></label>
      <img class="proof" id="it-prev" alt="고른 사진 미리보기" hidden>
      <label class="field">물건 이름<input name="title" maxlength="40" placeholder="예: 트레일화 270mm" autocomplete="off"></label>
      <label class="field">카테고리<select name="category"><option value="">골라 주세요</option>${CATS.map(c => `<option>${esc(c)}</option>`).join("")}</select></label>
      <label class="field">가격<span class="price-in"><input name="price" inputmode="numeric" maxlength="11" placeholder="0" autocomplete="off"><span>원</span></span></label>
      <label class="check"><input type="checkbox" name="free"> 나눔으로 올리기</label>
      <label class="field">수령처<input name="pickup" maxlength="60" placeholder="예: 토요일 모닝벙, 월드컵경기장 트랙" autocomplete="off"></label>
      <label class="field">설명<textarea name="description" maxlength="500" rows="4" placeholder="상태, 사이즈, 산 시기 같은 걸 적어 주세요"></textarea></label>
      <button class="btn" id="it-go">올리기</button>
    </form>`;
  const f = $("#it-form"), file = $("#it-file"), prev = $("#it-prev");
  let blob = null;
  $("#it-close").onclick = () => dlg.close();
  file.onchange = async () => {
    if (!file.files[0]) return;
    try { blob = await shrink(file.files[0]); } catch (e) { return toast(e.message, true); }
    prev.src = URL.createObjectURL(blob); prev.hidden = false; file.nextElementSibling.textContent = "다른 사진 고르기";
  };
  f.price.oninput = () => { const d = f.price.value.replace(/\D/g, "").slice(0, 9); f.price.value = d ? Number(d).toLocaleString("ko-KR") : ""; };
  f.free.onchange = () => { f.price.disabled = f.free.checked; if (f.free.checked) f.price.value = ""; };
  f.onsubmit = e => {
    e.preventDefault();
    const title = f.title.value.trim(), category = f.category.value, pickup = f.pickup.value.trim();
    const digits = f.price.value.replace(/\D/g, "");
    if (!blob) return toast("물건 사진을 골라 주세요.", true);
    if (!title) return toast("물건 이름을 적어 주세요.", true);
    if (!category) return toast("카테고리를 골라 주세요.", true);
    if (!f.free.checked && !digits) return toast("가격을 적거나 나눔을 골라 주세요.", true);
    if (!pickup) return toast("수령처를 적어 주세요.", true);
    busy($("#it-go"), async () => {
      await api.itemPost(state.me, { title, category, pickup, price: f.free.checked ? 0 : Number(digits), description: f.description.value.trim() }, blob);
      await refresh(); dlg.close(); state.cat = ""; viewDugeun(); toast("물건을 올렸어요.");
    });
  };
  dlg.showModal();
}

/* ---------- 라우터 ---------- */
function route() {
  renderNav();
  const h = location.hash.replace(/^#\/?/, "");
  document.body.classList.toggle("demo", !LIVE);
  if (h === "all") viewAll();
  else if (h === "dugeun") viewDugeun();
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
    ctx.fillStyle = "#fff3dc";
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

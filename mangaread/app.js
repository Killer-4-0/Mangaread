/* ================= MangaOffline ================= */
"use strict";

const MANGA = [
  {
    id: "ronin", title: "Неоновый ронин", author: "К. Хасимото",
    genres: ["Боевик", "Киберпанк", "Сэйнэн"], year: 2024, rating: 8.7,
    desc: "Охотник за головами в неоновом Токио 2099 года раскрывает заговор корпораций.",
    palette: ["#7c3aed", "#0ea5e9", "#0e0e12"],
    chapters: [
      { n: 1, name: "Город неона", pages: 8 },
      { n: 2, name: "Клинок из прошлого", pages: 8 },
      { n: 3, name: "Первый контракт", pages: 8 },
    ]
  },
  {
    id: "ghosts", title: "Лето и призраки", author: "А. Мидзуно",
    genres: ["Повседневность", "Мистика", "Драма"], year: 2023, rating: 8.2,
    desc: "Девочка, способная видеть духов, проводит лето в деревне бабушки.",
    palette: ["#f59e0b", "#10b981", "#12322b"],
    chapters: [
      { n: 1, name: "Станция в полях", pages: 7 },
      { n: 2, name: "Дух реки", pages: 7 },
    ]
  },
  {
    id: "witch", title: "Кибер-ведьма", author: "Р. Огава",
    genres: ["Фэнтези", "Приключения", "Действие"], year: 2025, rating: 9.1,
    desc: "Ведьма-хакерша защищает цифровой мир от демонов из устаревшего кода.",
    palette: ["#ec4899", "#8b5cf6", "#1c1030"],
    chapters: [
      { n: 1, name: "Заклинание в коде", pages: 8 },
      { n: 2, name: "Проклятый сервер", pages: 8 },
    ]
  },
  {
    id: "chef", title: "Последний ресторан на Земле", author: "Т. Фудзимори",
    genres: ["Комедия", "Кулинария", "Постапокалипсис"], year: 2022, rating: 7.9,
    desc: "Шеф-повар кормит странных клиентов в мире после «конца света».",
    palette: ["#ef4444", "#fbbf24", "#241212"],
    chapters: [
      { n: 1, name: "Суп из консервов", pages: 6 },
      { n: 2, name: "Гость из орбиты", pages: 6 },
    ]
  }
];

const PHRASES = [
  "Я давно ждал этого момента...", "Что ты такое?!", "Это ещё не конец!",
  "Быстрее! Нам некогда!", "Ты не понимаешь, что натворил.", "Я всё объясню позже.",
  "Невозможно...", "Держись за меня!", "Так вот оно что...", "Прости. Это был приказ.",
  "Мы встретимся снова.", "Запомни это место.", "Хах... неплохой ход.",
  "Не смей туда ходить!", "Утро. Всё только начинается."
];
const SFX = ["ДЗЗЗНЬ!", "БА-БАХ!!", "Ш-ш-ш...", "ВЖУХ!", "КРАК!", "ту-ту-ту...", "БДЫЩЬ!", "грохот!"];

/* ---------- deterministic RNG ---------- */
function rng(seed){ let s = seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

/* ---------- cover generator ---------- */
const coverCache = {};
function getCover(m){
  if (coverCache[m.id]) return coverCache[m.id];
  const c = document.createElement("canvas"); c.width=300; c.height=420;
  const x = c.getContext("2d"), R = rng(m.id.length*7919 + 13);
  const g = x.createLinearGradient(0,0,300,420);
  g.addColorStop(0,m.palette[0]); g.addColorStop(.6,m.palette[2]); g.addColorStop(1,"#000");
  x.fillStyle=g; x.fillRect(0,0,300,420);
  for(let i=0;i<26;i++){ x.fillStyle=`rgba(255,255,255,${R()*.14})`;
    x.beginPath(); x.arc(R()*300,R()*420,R()*46,0,7); x.fill(); }
  // big kanji-ish glyph
  x.save(); x.translate(150,190); x.rotate((R()-.5)*.2);
  x.font="900 150px serif"; x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle="rgba(255,255,255,.92)"; x.shadowColor="#000a"; x.shadowBlur=18;
  x.fillText(["漫","魂","魔","食","影","空"][Math.floor(R()*6)],0,0); x.restore();
  // speed lines
  x.strokeStyle="rgba(255,255,255,.25)"; x.lineWidth=2;
  for(let i=0;i<18;i++){ const a=R()*7; x.beginPath(); x.moveTo(150+Math.cos(a)*60,200+Math.sin(a)*60);
    x.lineTo(150+Math.cos(a)*260,200+Math.sin(a)*260); x.stroke(); }
  // title strip
  x.fillStyle="rgba(0,0,0,.55)"; x.fillRect(0,330,300,90);
  x.fillStyle="#fff"; x.font="700 26px sans-serif"; x.textAlign="left";
  wrapText(x, m.title, 18, 368, 266, 28);
  x.fillStyle="#ffffff88"; x.font="12px sans-serif"; x.fillText(m.author, 18, 404);
  return coverCache[m.id] = c.toDataURL("image/jpeg", .82);
}
function wrapText(x,text,px,py,mw,lh){
  const words=text.split(" "); let line="",yy=py;
  for(const w of words){ const t=line?line+" "+w:w;
    if(x.measureText(t).width>mw && line){ x.fillText(line,px,yy); line=w; yy+=lh; } else line=t; }
  x.fillText(line,px,yy);
}

/* ---------- manga page generator ---------- */
function getPage(m, ch, p, total){
  const key = m.id+":"+ch.n+":"+p;
  const c = document.createElement("canvas"); c.width=690; c.height=980;
  const x = c.getContext("2d"), R = rng(hash(key));
  x.fillStyle="#fff"; x.fillRect(0,0,690,980);
  // page frame
  x.strokeStyle="#000"; x.lineWidth=3; x.strokeRect(12,12,666,956);
  // panels layout: random rows of columns
  let y = 24; const bottom = 940;
  const rows = [];
  while (y < bottom - 130){
    const h = 150 + R()*230;
    const cols = R() < .35 ? 1 : (R() < .6 ? 2 : 3);
    rows.push({y, h, cols}); y += h + 14;
  }
  for(const r of rows){
    const w = (662 - 14*(r.cols-1)) / r.cols;
    for(let i=0;i<r.cols;i++){
      const px = 15 + i*(w+14);
      drawPanel(x, px, r.y, w, r.h, R, m, p, total);
    }
  }
  // page number
  x.fillStyle="#000"; x.font="16px sans-serif"; x.textAlign="right";
  x.fillText(String(p+1), 662, 968); x.textAlign="left";
  return c.toDataURL("image/jpeg", .8);
}
function hash(s){ let h=2166136261; for(const ch of s){ h^=ch.codePointAt(0); h=Math.imul(h,16777619);} return h>>>0; }

function drawPanel(x, px, py, w, h, R, m, p, total){
  x.save(); x.beginPath(); x.rect(px,py,w,h); x.clip();
  // tone: grayscale gradient wash
  const tone = R();
  const g = x.createLinearGradient(px,py,px,py+h);
  g.addColorStop(0, tone>.7?"#3a3a3a":"#c9c9c9");
  g.addColorStop(1, tone>.7?"#0c0c0c":"#efefef");
  x.fillStyle=g; x.fillRect(px,py,w,h);
  // screen tone dots
  if(R()<.5){ x.fillStyle="rgba(0,0,0,.18)";
    for(let i=px;i<px+w;i+=7) for(let j=py;j<py+h;j+=7){ if((i+j)%14<7) x.fillRect(i,j,1.6,1.6);} }
  // speed lines
  if(R()<.55){ const cx=px+R()*w, cy=py+R()*h;
    x.strokeStyle="rgba(0,0,0,.35)"; x.lineWidth=1.6;
    for(let i=0;i<22;i++){ const a=R()*7; x.beginPath(); x.moveTo(cx,cy);
      x.lineTo(cx+Math.cos(a)*w, cy+Math.sin(a)*h); x.stroke(); } }
  // character silhouette
  if(R()<.75){
    const cx=px+w*(0.25+R()*.5), cy=py+h*.62, s=Math.min(w,h)*(0.42+R()*.22);
    x.fillStyle= tone>.7 ? "rgba(255,255,255,.85)" : "rgba(20,20,20,.85)";
    x.beginPath(); x.arc(cx,cy-s*.7,s*.42,0,7); x.fill();                 // head
    x.beginPath(); x.moveTo(cx-s*.6,cy+s); x.quadraticCurveTo(cx,cy-s*.2,cx+s*.6,cy+s);
    x.closePath(); x.fill();                                            // body
    if(R()<.5){ // eyes slash
      x.strokeStyle= tone>.7?"#111":"#fff"; x.lineWidth=3;
      x.beginPath(); x.moveTo(cx-s*.25,cy-s*.75); x.lineTo(cx-s*.05,cy-s*.62);
      x.moveTo(cx+s*.25,cy-s*.75); x.lineTo(cx+s*.05,cy-s*.62); x.stroke();
    }
  }
  // object: moon / building / bowl
  if(R()<.4){ x.fillStyle= tone>.7?"rgba(255,255,255,.7)":"rgba(0,0,0,.55)";
    if(R()<.5){ x.beginPath(); x.arc(px+w*.8,py+h*.25,w*.14,0,7); x.fill(); }
    else { for(let i=0;i<4;i++){ const bw=w*.1, bx=px+w*.15+i*bw*1.4, bh=h*(.3+R()*.4);
      x.fillRect(bx,py+h-bh,bw,bh);} } }
  // speech bubble
  if(R()<.65){
    const bw=Math.min(w*.62,230), bh=54, bx=px+w*.12, by=py+10;
    x.fillStyle="#fff"; x.strokeStyle="#000"; x.lineWidth=2.4;
    roundRect(x,bx,by,bw,bh,14); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(bx+bw*.25,by+bh); x.lineTo(bx+bw*.3,by+bh+16); x.lineTo(bx+bw*.38,by+bh); x.closePath();
    x.fillStyle="#fff"; x.fill(); x.stroke();
    x.fillStyle="#000"; x.font="12.5px sans-serif";
    wrapText(x, PHRASES[Math.floor(R()*PHRASES.length)], bx+10, by+22, bw-20, 15);
  }
  // SFX
  if(R()<.4){
    x.save(); x.translate(px+w*(.2+R()*.6), py+h*(.25+R()*.5)); x.rotate((R()-.5)*.5);
    x.font="900 italic 30px sans-serif"; x.lineWidth=5; x.strokeStyle="#000";
    x.strokeText(SFX[Math.floor(R()*SFX.length)],0,0);
    x.fillStyle="#fff"; x.fillText(SFX[Math.floor(R()*SFX.length)],0,0); x.restore();
  }
  // gutter border
  x.restore();
  x.strokeStyle="#000"; x.lineWidth=3.4; x.strokeRect(px,py,w,h);
}
function roundRect(x,a,b,w,h,r){ x.beginPath(); x.moveTo(a+r,b);
  x.arcTo(a+w,b,a+w,b+h,r); x.arcTo(a+w,b+h,a,b+h,r); x.arcTo(a,b+h,a,b,r);
  x.arcTo(a,b,a+w,b,r); x.closePath(); }

/* ---------- IndexedDB ---------- */
const DB = {
  db:null,
  open(){ return new Promise((res,rej)=>{
    const q = indexedDB.open("manga-offline",1);
    q.onupgradeneeded = e => e.target.result.createObjectStore("chapters",{keyPath:"key"});
    q.onsuccess = e => { DB.db=e.target.result; res(); };
    q.onerror = rej;
  });},
  put(rec){ return new Promise((res,rej)=>{ const t=DB.db.transaction("chapters","readwrite");
    t.objectStore("chapters").put(rec); t.oncomplete=res; t.onerror=rej; });},
  all(){ return new Promise((res,rej)=>{ const t=DB.db.transaction("chapters","readonly");
    const q=t.objectStore("chapters").getAll(); q.onsuccess=()=>res(q.result||[]); q.onerror=rej; });},
  get(key){ return new Promise((res,rej)=>{ const t=DB.db.transaction("chapters","readonly");
    const q=t.objectStore("chapters").get(key); q.onsuccess=()=>res(q.result); q.onerror=rej; });},
  del(key){ return new Promise((res,rej)=>{ const t=DB.db.transaction("chapters","readwrite");
    t.objectStore("chapters").delete(key); t.oncomplete=res; t.onerror=rej; });}
};

/* ---------- app state ---------- */
let downloaded = {};   // key "mangaId:chN" -> {pages:[], ts}
let currentTab = "catalog";
let currentManga = null;
let deferredInstall = null;

const $ = s => document.querySelector(s);
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove("show"),2400); }
function key(m,ch){ return m.id+":"+ch.n; }

/* ---------- views ---------- */
function showTab(tab){
  currentTab = tab;
  document.querySelectorAll("nav.bottom button").forEach(b=>
    b.classList.toggle("active", b.dataset.tab===tab));
  $("#view-catalog").style.display = tab==="catalog"?"":"none";
  $("#view-downloads").style.display = tab==="downloads"?"":"none";
  $("#view-detail").style.display = "none";
  if(tab==="catalog") renderCatalog();
  if(tab==="downloads") renderDownloads();
}

function renderCatalog(){
  const v = $("#view-catalog");
  const q = (v._q||"").toLowerCase();
  let html = `<input class="search" placeholder="🔍 Поиск манги..." value="${v._q||""}">`;
  const list = MANGA.filter(m => !q || (m.title+m.author+m.genres.join(" ")).toLowerCase().includes(q));
  if(!list.length) html += `<div class="empty"><div class="big">🤷</div>Ничего не найдено</div>`;
  for(const m of list){
    const dlCount = m.chapters.filter(ch=>downloaded[key(m,ch)]).length;
    html += `<div class="manga-card" data-id="${m.id}">
      <img class="cover" src="${getCover(m)}" alt="">
      <div class="mcard-body">
        <div class="mcard-title">${m.title}</div>
        <div class="mcard-meta">⭐ ${m.rating} · ${m.year} · ${m.author}<br>${m.chapters.length} глав · ${m.desc.slice(0,60)}…</div>
        <div class="mcard-tags">
          ${m.genres.map(g=>`<span class="tag">${g}</span>`).join("")}
          ${dlCount?`<span class="tag dl">⬇ ${dlCount} офлайн</span>`:""}
        </div>
      </div></div>`;
  }
  v.innerHTML = html;
  v.querySelector(".search").addEventListener("input", e=>{ v._q=e.target.value; renderCatalog();
    v.querySelector(".search").focus(); const s=v.querySelector(".search"); s.setSelectionRange(s.value.length,s.value.length);});
  v.querySelectorAll(".manga-card").forEach(el=> el.onclick = ()=> openDetail(el.dataset.id));
}

function openDetail(id){
  const m = MANGA.find(x=>x.id===id); currentManga = m;
  const v = $("#view-detail"); $("#view-catalog").style.display="none"; $("#view-downloads").style.display="none";
  v.style.display="";
  let html = `<button class="backbtn" id="backBtn">← Назад</button>
    <div class="detail-hero"><img src="${getCover(m)}" alt="">
      <div>
        <div style="font-size:20px;font-weight:800;margin-bottom:4px">${m.title}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6">${m.author} · ${m.year} · ⭐ ${m.rating}<br>
        ${m.genres.map(g=>`<span class="tag">${g}</span>`).join(" ")}</div>
        <p style="font-size:13px;color:#cfc9e0;margin-top:10px;line-height:1.55">${m.desc}</p>
      </div></div>`;
  for(const ch of m.chapters){
    const k = key(m,ch), done = !!downloaded[k];
    html += `<div class="chapter-row" data-ch="${ch.n}">
      <div class="ch-info"><div class="ch-name">Глава ${ch.n} — «${ch.name}»</div>
      <div class="ch-sub">${ch.pages} страниц ${done?`· ✅ скачано офлайн (${(downloaded[k].size/1024).toFixed(0)} КБ)`:""}</div></div>
      <button class="btn btn-dl ${done?"done":""}" data-act="dl">${done?"✓ Скачано":"⬇ Скачать"}</button>
      <button class="btn btn-read" data-act="read">Читать</button></div>`;
  }
  v.innerHTML = html;
  v.querySelector("#backBtn").onclick = ()=> showTab("catalog");
  v.querySelectorAll(".chapter-row").forEach(row=>{
    const ch = m.chapters.find(c=>c.n == row.dataset.ch);
    row.querySelector('[data-act="dl"]').onclick = e => downloadChapter(m,ch,e.target);
    row.querySelector('[data-act="read"]').onclick = ()=> openReader(m,ch);
  });
}

async function downloadChapter(m,ch,btn){
  const k = key(m,ch);
  if(downloaded[k]) return;
  btn.disabled = true; btn.textContent = "⏳ Генерация...";
  try{
    const pages = [];
    for(let p=0;p<ch.pages;p++){
      pages.push(getPage(m,ch,p,ch.pages));
      if(p%2===0){ btn.textContent = `⏳ ${Math.round(p/ch.pages*100)}%`;
        await new Promise(r=>setTimeout(r,30)); }
    }
    const rec = { key:k, mangaId:m.id, chN:ch.n, chName:ch.name, title:m.title,
      pages, size:pages.reduce((s,pg)=>s+pg.length,0), ts:Date.now() };
    await DB.put(rec);
    downloaded[k] = rec;
    toast(`✅ «${m.title}» глава ${ch.n} — в офлайне!`);
    openDetail(m.id);
  }catch(e){ btn.disabled=false; btn.textContent="⬇ Скачать"; toast("⚠️ Ошибка: нет места в памяти?"); }
}

async function renderDownloads(){
  const v = $("#view-downloads");
  const items = await DB.all();
  items.sort((a,b)=>b.ts-a.ts);
  if(!items.length){ v.innerHTML = `<div class="empty"><div class="big">📭</div>
    Пока пусто.<br>Откройте каталог, нажмите «⬇ Скачать» у главы —<br>и она будет доступна без интернета.</div>`; return; }
  const totalKB = (items.reduce((s,i)=>s+i.size,0)/1024/1024).toFixed(1);
  let html = `<div style="font-size:12px;color:var(--muted);margin-bottom:12px">
    ${items.length} глав скачано · ${totalKB} МБ · доступно офлайн ✈️</div>`;
  for(const it of items){
    const m = MANGA.find(x=>x.id===it.mangaId);
    html += `<div class="dl-item" data-key="${it.key}">
      <img src="${getCover(m)}" alt="">
      <div class="inf"><div class="nm">${it.title}</div>
      <div class="sb">Глава ${it.chN} — «${it.chName}» · ${(it.size/1024).toFixed(0)} КБ</div></div>
      <button class="btn btn-read" data-act="read">Читать</button>
      <button class="btn btn-del" data-act="del">🗑</button></div>`;
  }
  v.innerHTML = html;
  v.querySelectorAll(".dl-item").forEach(el=>{
    const it = items.find(i=>i.key===el.dataset.key);
    el.querySelector('[data-act="read"]').onclick = ()=>{
      const m = MANGA.find(x=>x.id===it.mangaId);
      openReader(m, {n:it.chN, name:it.chName, pages:it.pages.length});
    };
    el.querySelector('[data-act="del"]').onclick = async ()=>{
      await DB.del(it.key); delete downloaded[it.key];
      toast("🗑 Удалено"); renderDownloads();
    };
  });
}

/* ---------- reader ---------- */
let readerState = null;
function openReader(m,ch){
  const k = key(m,ch);
  const rec = downloaded[k];
  const pages = rec ? rec.pages
    : Array.from({length:ch.pages},(_,p)=>getPage(m,ch,p,ch.pages));
  readerState = { m, ch, pages, page:0 };
  $("#rTitle").textContent = `${m.title} · гл. ${ch.n}`;
  const pagesEl = $("#pages");
  pagesEl.innerHTML = pages.map((src,i)=>`<img src="${src}" data-i="${i}" alt="стр. ${i+1}">`).join("");
  pagesEl.scrollTop = 0;
  $("#reader").classList.add("open");
  document.body.style.overflow="hidden";
  updatePageInfo();
  pagesEl.onscroll = ()=>{
    const imgs = pagesEl.querySelectorAll("img");
    const mid = pagesEl.scrollTop + pagesEl.clientHeight/2;
    for(const im of imgs){
      if(im.offsetTop <= mid && im.offsetTop + im.offsetHeight > mid){
        readerState.page = +im.dataset.i; updatePageInfo(); break; }
    }
    const max = pagesEl.scrollHeight - pagesEl.clientHeight;
    $("#progress i").style.width = (max>0 ? pagesEl.scrollTop/max*100 : 0) + "%";
  };
}
function updatePageInfo(){ if(readerState) $("#pageinfo").textContent = `${readerState.page+1}/${readerState.pages.length}`; }
function readerGo(dir){
  if(!readerState) return;
  const imgs = $("#pages").querySelectorAll("img");
  const next = Math.min(Math.max(readerState.page+dir,0), imgs.length-1);
  imgs[next].scrollIntoView({behavior:"smooth"});
}
function closeReader(){
  $("#reader").classList.remove("open");
  document.body.style.overflow="";
  readerState = null;
  if(currentManga) openDetail(currentManga.id); else showTab(currentTab);
}
$("#rClose").onclick = closeReader;
$("#rPrev").onclick = ()=>readerGo(-1);
$("#rNext").onclick = ()=>readerGo(1);
// swipe / tap zones
$("#pages").addEventListener("click", e=>{
  const x = e.clientX / innerWidth;
  if(x < .3) readerGo(-1); else if (x > .7) readerGo(1);
});

/* ---------- nav / network / install ---------- */
document.querySelectorAll("nav.bottom button").forEach(b=> b.onclick=()=>showTab(b.dataset.tab));

function updateNet(){
  const on = navigator.onLine;
  const b = $("#netbadge");
  b.className = "netbadge " + (on?"on":"off");
  b.textContent = on ? "● онлайн" : "○ офлайн — читаем скачанное";
}
addEventListener("online", updateNet);
addEventListener("offline", ()=>{ updateNet(); toast("📡 Интернет пропал — доступны скачанные главы"); });

addEventListener("beforeinstallprompt", e=>{
  e.preventDefault(); deferredInstall = e; $("#installHint").style.display="block";
});
$("#installBtn").onclick = async ()=>{
  if(deferredInstall){ deferredInstall.prompt(); deferredInstall=null; $("#installHint").style.display="none"; }
};

/* ---------- boot ---------- */
(async function init(){
  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("sw.js"); }catch(e){}
  }
  if(matchMedia("(display-mode: standalone)").matches || navigator.standalone)
    $("#installHint").style.display="none";
  await DB.open();
  for(const rec of await DB.all()) downloaded[rec.key]=rec;
  updateNet();
  showTab("catalog");
})();

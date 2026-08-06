const STORAGE = {
  users: "lisanV4Users",
  session: "lisanV4Session",
  customWords: "lisanV4CustomWords",
  favorites: "lisanV4Favorites"
};

let baseWords = [];
let customWords = JSON.parse(localStorage.getItem(STORAGE.customWords) || "[]");
let favorites = JSON.parse(localStorage.getItem(STORAGE.favorites) || "[]");
let dictionary = [];

const lessons = [
  ["Arap Alfabesi","A1","28 harf ve temel sesler"],
  ["Selamlaşma","A1","Tanışma ve günlük ifadeler"],
  ["Sayılar ve Saat","A1","Sayılar, tarih ve saat"],
  ["Seyahat Arapçası","A2","Havaalanı, otel ve ulaşım"]
];

const conversations = [
  ["Merhaba","مرحباً","Marhaban"],
  ["Nasılsın?","كيف حالك؟","Kayfa hâluk?"],
  ["Teşekkür ederim","شكراً لك","Shukran lak"],
  ["Anlamadım","لم أفهم","Lam afham"],
  ["Yavaş konuşur musunuz?","هل يمكنك التحدث ببطء؟","Hal yumkinuka at-tahadduth bibut'?"]
];

function users(){ return JSON.parse(localStorage.getItem(STORAGE.users) || "{}"); }
function saveUsers(data){ localStorage.setItem(STORAGE.users, JSON.stringify(data)); }
function normalize(v){ return String(v||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim(); }
function escapeHtml(v){ return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s])); }
function notify(msg){ toast.textContent=msg;toast.style.display="block";clearTimeout(window._t);window._t=setTimeout(()=>toast.style.display="none",2200); }

function showAuth(mode){
  loginForm.classList.toggle("hidden",mode!=="login");
  registerForm.classList.toggle("hidden",mode!=="register");
  loginTab.classList.toggle("active",mode==="login");
  registerTab.classList.toggle("active",mode==="register");
}

loginTab.onclick=()=>showAuth("login");
registerTab.onclick=()=>showAuth("register");

registerForm.addEventListener("submit", e=>{
  e.preventDefault();
  const all=users(), username=regUser.value.trim();
  if(all[username]) return notify("Bu kullanıcı adı kullanılıyor.");
  all[username]={name:regName.value.trim(),password:regPass.value};
  saveUsers(all);
  loginUser.value=username;
  showAuth("login");
  notify("Hesabın oluşturuldu.");
});

loginForm.addEventListener("submit", e=>{
  e.preventDefault();
  const all=users(), username=loginUser.value.trim();
  if(!all[username] || all[username].password!==loginPass.value) return notify("Kullanıcı adı veya şifre yanlış.");
  localStorage.setItem(STORAGE.session, username);
  openApp(username, all[username].name);
});

logoutBtn.onclick=()=>{ localStorage.removeItem(STORAGE.session); location.reload(); };

function openApp(username,name){
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  welcomeText.textContent=`Hoş geldin, ${name}`;
  profileName.textContent=name;
  renderAll();
}

function goPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".bottom-nav button").forEach(btn=>btn.onclick=()=>goPage(btn.dataset.page));
document.querySelectorAll("[data-go]").forEach(btn=>btn.onclick=()=>goPage(btn.dataset.go));

async function loadBaseWords(){
  try{
    const r=await fetch("data/dictionary_001.json",{cache:"no-store"});
    baseWords=await r.json();
  }catch{ baseWords=[]; }
  mergeDictionary();
}

function mergeDictionary(){
  const seen=new Set();
  dictionary=[...baseWords,...customWords].filter(item=>{
    const key=`${normalize(item.arabic)}|${normalize(item.turkish)}|${normalize(item.dialect)}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  renderAll();
}

function renderAll(){
  wordCount.textContent=dictionary.length;
  profileWords.textContent=dictionary.length;
  favoriteCount.textContent=favorites.length;
  profileFavorites.textContent=favorites.length;
  renderDictionary(dictionary.slice(0,100));
  renderLessons();
  renderConversations();
  renderFavorites();
}

function renderDictionary(rows){
  resultCount.textContent=rows.length;
  dictionaryList.innerHTML=rows.length?rows.map(item=>`
    <article class="word-card">
      <div class="word-top">
        <div>
          <div class="arabic">${escapeHtml(item.arabic)}</div>
          <div class="latin">${escapeHtml(item.latin||"")}</div>
          <strong>${escapeHtml(item.turkish)}</strong>
        </div>
        <button class="secondary" onclick="speakArabic('${String(item.arabic).replace(/'/g,"\\'")}')">🔊</button>
      </div>
      <div class="badges">
        <span class="badge">${escapeHtml(item.type||"belirsiz")}</span>
        <span class="badge">${escapeHtml(item.category||"genel")}</span>
        <span class="badge">${escapeHtml(item.dialect||"msa")}</span>
      </div>
      <button class="secondary full" onclick='addFavorite(${JSON.stringify(item)})'>Favoriye Ekle</button>
    </article>`).join(""):'<div class="word-card">Sonuç bulunamadı.</div>';
}

function runSearch(){
  const q=normalize(searchInput.value);
  const rows=!q?dictionary.slice(0,100):dictionary.filter(item =>
    normalize(item.arabic).includes(q) ||
    normalize(item.turkish).includes(q) ||
    normalize(item.latin).includes(q) ||
    normalize(item.category).includes(q)
  );
  renderDictionary(rows);
}
searchBtn.onclick=runSearch;
searchInput.addEventListener("input",runSearch);

function addFavorite(item){
  if(favorites.some(x=>x.arabic===item.arabic && x.turkish===item.turkish)) return notify("Zaten favorilerde.");
  favorites.push(item);
  localStorage.setItem(STORAGE.favorites,JSON.stringify(favorites));
  renderAll();
}

function removeFavorite(i){
  favorites.splice(i,1);
  localStorage.setItem(STORAGE.favorites,JSON.stringify(favorites));
  renderAll();
}

function renderFavorites(){
  favoriteList.innerHTML=favorites.length?favorites.map((item,i)=>`
    <div class="word-card">
      <div class="arabic">${escapeHtml(item.arabic)}</div>
      <strong>${escapeHtml(item.turkish)}</strong>
      <button class="danger full" onclick="removeFavorite(${i})">Sil</button>
    </div>`).join(""):'<div class="word-card">Henüz favori yok.</div>';
}

function renderLessons(){
  lessonList.innerHTML=lessons.map(x=>`<div class="lesson-card"><span class="badge">${x[1]}</span><h3>${x[0]}</h3><p class="muted">${x[2]}</p></div>`).join("");
}

function renderConversations(){
  conversationList.innerHTML=conversations.map(x=>`
    <div class="phrase-card">
      <strong>${x[0]}</strong>
      <div class="arabic">${x[1]}</div>
      <div class="latin">${x[2]}</div>
      <button class="secondary full" onclick="speakArabic('${x[1]}')">Dinle</button>
    </div>`).join("");
}

function speakArabic(text){
  if(!("speechSynthesis" in window)) return notify("Sesli okuma desteklenmiyor.");
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="ar-SA";u.rate=.8;speechSynthesis.speak(u);
}

importBtn.onclick=async()=>{
  const files=[...dataFileInput.files];
  if(!files.length) return notify("Önce JSON dosyası seç.");
  let imported=0,invalid=0,duplicates=0;
  const existing=new Set(dictionary.map(x=>`${normalize(x.arabic)}|${normalize(x.turkish)}|${normalize(x.dialect)}`));
  for(const file of files){
    try{
      const rows=JSON.parse(await file.text());
      if(!Array.isArray(rows)){invalid++;continue;}
      for(const item of rows){
        if(!item || !String(item.arabic||"").trim() || !String(item.turkish||"").trim()){invalid++;continue;}
        const clean={
          id:item.id||`word_${Date.now()}_${imported}`,
          arabic:String(item.arabic).trim(),
          turkish:String(item.turkish).trim(),
          latin:String(item.latin||"").trim(),
          type:String(item.type||"belirsiz").trim(),
          category:String(item.category||"genel").trim(),
          dialect:String(item.dialect||"msa").trim(),
          example_ar:String(item.example_ar||"").trim(),
          example_tr:String(item.example_tr||"").trim()
        };
        const key=`${normalize(clean.arabic)}|${normalize(clean.turkish)}|${normalize(clean.dialect)}`;
        if(existing.has(key)){duplicates++;continue;}
        existing.add(key);customWords.push(clean);imported++;
      }
    }catch{invalid++;}
  }
  localStorage.setItem(STORAGE.customWords,JSON.stringify(customWords));
  importedCount.textContent=imported;
  invalidCount.textContent=invalid;
  duplicateCount.textContent=duplicates;
  mergeDictionary();
  notify("Sözlük verileri eklendi.");
};

exportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(dictionary,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="lisan_ai_dictionary.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};

clearDataBtn.onclick=()=>{
  if(!confirm("Sonradan eklenen sözlük verileri silinsin mi?")) return;
  customWords=[];
  localStorage.removeItem(STORAGE.customWords);
  importedCount.textContent=invalidCount.textContent=duplicateCount.textContent="0";
  mergeDictionary();
};

document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});

loadBaseWords();
const session=localStorage.getItem(STORAGE.session),all=users();
if(session && all[session]) openApp(session,all[session].name);

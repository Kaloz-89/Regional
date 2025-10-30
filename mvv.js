(function () {
  try { history.replaceState({ noForward: true }, "", location.href); } catch {}
  window.addEventListener("popstate", function (e) {
    try {
      if (e.state && e.state.noForward) {
        history.pushState({ noForward: true }, "", location.href);
      }
    } catch {}
  });
})();
(function () {
  const STORAGE_KEY = "mvv_paneles_v1";
  const grid = document.getElementById("cardsGrid");
  const msg  = document.getElementById("estadoMsg");
  const plantilla = () => ([
    { title:"", body:"" }, // Misión
    { title:"", body:"" }, // Visión
    { title:"", body:"" }, // Valores
  ]);
  function leer(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return Array.isArray(data) && data.length===3 ? data : plantilla();
    }catch{ return plantilla(); }
  }
  function escribir(data){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      feedback("✔ Guardado");
    } catch(e){
      feedback("No se pudo guardar (storage lleno o bloqueado)");
      console.warn(e);
    }
  }
  function feedback(t){
    if(!msg) return;
    msg.textContent=t;
    clearTimeout(feedback._t);
    feedback._t=setTimeout(()=>msg.textContent="",1200);
  }
  function aplicar(data){
    const cards = grid.querySelectorAll(".info-card");
    cards.forEach((card,i)=>{
      card.querySelector(".editable-title").textContent = data[i]?.title ?? "";
      card.querySelector(".editable-body").textContent  = data[i]?.body ?? "";
    });
  }
  function leerDesdeDOM(){
    return [...grid.querySelectorAll(".info-card")].map(card=>({
      title:(card.querySelector(".editable-title")?.textContent||"").trim(),
      body :(card.querySelector(".editable-body") ?.textContent||"").trim(),
    }));
  }
  grid.addEventListener("input", e=>{
    if(!e.target.closest(".editable")) return;
    escribir(leerDesdeDOM());
  });
  grid.addEventListener("keydown", e=>{
    if(e.target.matches(".editable-title") && e.key==="Enter"){
      e.preventDefault(); e.target.blur();
    }
  });
  window.addEventListener("storage", e=>{ if(e.key===STORAGE_KEY) aplicar(leer()); });
  aplicar(leer());
})();
(function(){
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.nav-dropdown > .has-caret');
    const dd  = e.target.closest('.nav-dropdown');
    document.querySelectorAll('.nav-dropdown.abierto').forEach(el=>{
      if (!el.contains(e.target)) el.classList.remove('abierto');
    });
    if (btn && dd) { e.preventDefault(); dd.classList.toggle('abierto'); }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-dropdown.abierto').forEach(el=> el.classList.remove('abierto'));
    }
  });
})();
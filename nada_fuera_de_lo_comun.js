
// nada que ver aquí, solo utilidades muy normales
(function () {
  const IR_A = "nada_importante.html";
  const IR_B = "otra_cosa_poco_importante.html";  
  const MARGEN = 8;
  const RETRY_MAX = 12; // reintentos para no solapar

  function r(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

  function ubicar(el){
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const vw = Math.max(document.documentElement.clientWidth,  window.innerWidth  || 0);

    const header = document.querySelector("header");
    const headerBottom = header ? (header.getBoundingClientRect().bottom | 0) : 0;

    const pxW = el.offsetWidth  || 6;
    const pxH = el.offsetHeight || 6;

    const minX = MARGEN;
    const maxX = Math.max(minX, vw - pxW - MARGEN);
    const minY = Math.min(vh - pxH - MARGEN, Math.max(headerBottom + MARGEN, MARGEN));
    const maxY = Math.max(minY, vh - pxH - MARGEN);

    el.style.left = r(minX, maxX) + "px";
    el.style.top  = r(minY, maxY) + "px";
  }

  function rect(el){
    const b = el.getBoundingClientRect();
    return {x:b.left, y:b.top, w:b.width||6, h:b.height||6};
  }
  function intersect(a,b){
    return !(a.x+a.w < b.x || b.x+b.w < a.x || a.y+a.h < b.y || b.y+b.h < a.y);
  }

  function crearPixel(destino){
    const p = document.createElement("div");
    p.className = "nada-fuera-de-lo-comun"; // usa tu mismo CSS (pixel blanco)
    p.title = "";
    p.setAttribute("role","button");
    p.setAttribute("aria-label","");
    p.addEventListener("click", () => { window.location.href = destino; });
    document.body.appendChild(p);
    return p;
  }
  function init(){
    // crea 2 pixels
    const p1 = crearPixel(IR_A);
    const p2 = crearPixel(IR_B);
    // posición inicial
    requestAnimationFrame(() => {
      ubicar(p1);
      ubicar(p2);
      // evitar que se monten uno encima del otro
      let tries = 0;
      while (intersect(rect(p1), rect(p2)) && tries++ < RETRY_MAX){
        ubicar(p2);
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
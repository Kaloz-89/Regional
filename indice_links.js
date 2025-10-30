(function () {
  const MODE = (document.body && document.body.dataset && document.body.dataset.mode) || "public";
  const rutasPublico = [
    "unidad_publico.html?u=1",
    "unidad_publico.html?u=2",
    "unidad_publico.html?u=3",
    "unidad_publico.html?u=4",
    "unidad_publico.html?u=5",
    "unidad_publico.html?u=6",
    "unidad_publico.html?u=7",
    "unidad_publico.html?u=8",
    "unidad_publico.html?u=9",
    "unidad_publico.html?u=10",
    "unidad_publico.html?u=11",
    "unidad_publico.html?u=12",
    "unidad_publico.html?u=13",
    "unidad_publico.html?u=14",
    "unidad_publico.html?u=15",
    "unidad_publico.html?u=16",
    "unidad_publico.html?u=17",
    "unidad_publico.html?u=18",
    "unidad_publico.html?u=19",
    "unidad_publico.html?u=20",
    "unidad_publico.html?u=21",
  ];
  const rutasAdmin = [
    "unidad_admin.html?u=1",
    "unidad_admin.html?u=2",
    "unidad_admin.html?u=3",
    "unidad_admin.html?u=4",
    "unidad_admin.html?u=5",
    "unidad_admin.html?u=6",
    "unidad_admin.html?u=7",
    "unidad_admin.html?u=8",
    "unidad_admin.html?u=9",
    "unidad_admin.html?u=10",
    "unidad_admin.html?u=11",
    "unidad_admin.html?u=12",
    "unidad_admin.html?u=13",
    "unidad_admin.html?u=14",
    "unidad_admin.html?u=15",
    "unidad_admin.html?u=16",
    "unidad_admin.html?u=17",
    "unidad_admin.html?u=18",
    "unidad_admin.html?u=19",
    "unidad_admin.html?u=20",
    "unidad_admin.html?u=21",
  ];
  const setIfEmpty = (el, href) => {
    if (!el) return;
    const current = (el.getAttribute("href") || "").trim();
    // Respeta enlaces ya definidos (no toques si NO es vacío ni "#")
    if (current && current !== "#") return;
    el.setAttribute("href", href);
  };
  document.addEventListener("DOMContentLoaded", () => {
    const rutas = MODE === "admin" ? rutasAdmin : rutasPublico;
    for (let i = 1; i <= 21; i++) {
      const el = document.getElementById(`n${i}`);
      setIfEmpty(el, rutas[i - 1]);
    }
  });
})();
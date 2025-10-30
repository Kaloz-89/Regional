PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_JOVENES_Y_ADULTOS" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_JOVENES_Y_ADULTOS",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
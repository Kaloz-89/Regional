PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "COPIA1" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CAPACITACION_DESARROLLO",
      isAdmin: false,
      afterSelector: "main .card h2"
    });
  }
});
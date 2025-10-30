PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "COPIA1" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CAPACITACION_DESARROLLO",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
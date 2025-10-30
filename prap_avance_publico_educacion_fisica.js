PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_FISICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_FISICA",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
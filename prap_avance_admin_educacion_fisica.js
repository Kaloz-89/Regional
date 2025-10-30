PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_FISICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_FISICA",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
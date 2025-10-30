PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ETIR_DOCENCIA_BASICA_II" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_DOCENCIA_BASICA_II",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ETIR_DOCENCIA_BASICA_I" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_DOCENCIA_BASICA_I",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
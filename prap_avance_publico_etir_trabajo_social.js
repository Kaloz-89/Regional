PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ETIR_TRABAJO_SOCIAL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_TRABAJO_SOCIAL",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
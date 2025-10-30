PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ETIR_PSICOLOGIA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_PSICOLOGIA",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
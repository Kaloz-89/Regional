PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ETIR_PSICOLOGIA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_PSICOLOGIA",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
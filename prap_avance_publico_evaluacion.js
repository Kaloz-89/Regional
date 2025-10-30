PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EVALUACION" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EVALUACION",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EVALUACION" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EVALUACION",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
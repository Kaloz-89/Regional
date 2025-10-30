PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ORIENTACION" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ORIENTACION",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
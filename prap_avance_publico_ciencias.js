PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "CIENCIAS" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CIENCIAS",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "MATEMATICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "MATEMATICAS",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
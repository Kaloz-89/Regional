PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "MATEMATICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "MATEMATICAS",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "INGLES" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "INGLES",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
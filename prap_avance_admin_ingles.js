PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "INGLES" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "INGLES",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
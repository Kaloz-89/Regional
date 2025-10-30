PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "GUANACASTEQUIDAD" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "GUANACASTEQUIDAD",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
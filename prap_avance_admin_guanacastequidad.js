PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "GUANACASTEQUIDAD" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "GUANACASTEQUIDAD",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ESTUDIOS_SOCIALES" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ESTUDIOS_SOCIALES",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
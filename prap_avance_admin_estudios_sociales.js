PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ESTUDIOS_SOCIALES" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ESTUDIOS_SOCIALES",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
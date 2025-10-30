PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ESPANOL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ESPANOL",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
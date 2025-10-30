PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ESPANOL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ESPANOL",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
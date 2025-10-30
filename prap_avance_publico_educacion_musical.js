PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_MUSICAL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_MUSICAL",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
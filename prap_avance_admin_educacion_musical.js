PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_MUSICAL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_MUSICAL",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
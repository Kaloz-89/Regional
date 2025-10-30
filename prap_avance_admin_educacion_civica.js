PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_CIVICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_CIVICA",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
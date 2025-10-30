PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_ESPECIAL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_ESPECIAL",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
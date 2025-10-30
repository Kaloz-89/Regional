PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_ESPECIAL" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_ESPECIAL",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
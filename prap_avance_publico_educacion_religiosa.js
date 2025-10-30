PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_RELIGIOSA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_RELIGIOSA",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
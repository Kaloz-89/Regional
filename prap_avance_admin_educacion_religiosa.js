PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_RELIGIOSA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_RELIGIOSA",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
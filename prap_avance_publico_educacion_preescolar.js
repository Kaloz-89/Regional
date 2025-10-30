PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_PREESCOLAR" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_PREESCOLAR",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
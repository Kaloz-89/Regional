PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "EDUCACION_PREESCOLAR" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_PREESCOLAR",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
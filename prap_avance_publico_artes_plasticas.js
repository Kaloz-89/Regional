PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ARTES_PLASTICAS" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ARTES_PLASTICAS",
      isAdmin: false,
      afterSelector: "main .card h2"
    });
  }
});
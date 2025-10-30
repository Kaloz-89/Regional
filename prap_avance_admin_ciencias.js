PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "CIENCIAS" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CIENCIAS",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: "" 
    });
  }
});
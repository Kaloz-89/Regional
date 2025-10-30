(function () {
  var KEY = 'theme_v1';
  var html = document.documentElement;
  try {
    var saved = localStorage.getItem(KEY);
    var sysLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = saved || (sysLight ? 'light' : 'dark');
    html.setAttribute('data-theme', theme);
  } catch (e) {
    html.setAttribute('data-theme', 'dark');
  }
})();
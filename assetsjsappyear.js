export const AppYear = (() => {
  const KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  const getYear = () => {
    const y = parseInt(localStorage.getItem(KEY) || "", 10);
    return Number.isFinite(y) ? y : NOW;
  };
  const setYear = (y) => {
    const yy = parseInt(y,10);
    const min = NOW - 5, max = NOW + 2;
    const safe = Math.max(min, Math.min(max, Number.isFinite(yy) ? yy : NOW));
    localStorage.setItem(KEY, String(safe));
    // Notifica a toda la app
    window.dispatchEvent(new CustomEvent("yearchange", { detail:{ year: safe } }));
    return safe;
  };
  const ykey = (k) => `${getYear()}_${k}`;
  const yGetItem  = (k)      => localStorage.getItem(ykey(k));
  const ySetItem  = (k, v)   => localStorage.setItem(ykey(k), v);
  const yReadArr  = (k, fb=[]) => {
    try { const r = yGetItem(k); const a = r ? JSON.parse(r) : null; return Array.isArray(a) ? a : fb; }
    catch { return fb; }
  };
  const yWriteArr = (k, a=[]) => ySetItem(k, JSON.stringify(a ?? []));
  const yListKeys = (prefixes=[]) => {
    const yy = `${getYear()}_`;
    const out=[];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (!k || !k.startsWith(yy)) continue;
      const tail = k.slice(yy.length);
      if (!prefixes.length || prefixes.some(p => tail.startsWith(p))) out.push(k);
    }
    return out;
  };
  return { getYear, setYear, ykey, yGetItem, ySetItem, yReadArr, yWriteArr, yListKeys };
})();
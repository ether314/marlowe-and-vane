// Runs before first paint: skip the opening animation on return visits, other pages, and reduced motion.
(function () {
  try {
    var seen = sessionStorage.getItem('mv.intro');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce || location.pathname !== '/') document.documentElement.classList.add('no-intro');
  } catch (e) {
    document.documentElement.classList.add('no-intro');
  }
})();

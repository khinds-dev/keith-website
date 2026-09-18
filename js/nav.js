/* nav.js — hamburger menu toggle, shared across all pages */
(function () {
  var btn  = document.getElementById('menuBtn');
  var menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    }
  });
})();

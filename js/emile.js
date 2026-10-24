(function () {
  "use strict";
  var toggle = document.getElementById("emMenuToggle");
  var nav = document.getElementById("emNav");

  function closeMenu(returnFocus) {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { closeMenu(false); });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".em-header") && nav.classList.contains("is-open")) closeMenu(false);
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", function (event) {
    if (event.matches) closeMenu(false);
  });
})();

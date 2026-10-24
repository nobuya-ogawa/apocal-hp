(function () {
  "use strict";
  var section = document.getElementById("use-case");
  if (!section) return;
  var tabs = Array.from(section.querySelectorAll('[role="tab"]'));
  var panels = Array.from(section.querySelectorAll('[role="tabpanel"]'));
  var steps = Array.from(section.querySelectorAll(".use-case-step"));
  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
      if (!selected) panels[i].querySelector("video").pause();
    });
    var stage = tabs[index].dataset.useCaseStage;
    steps.forEach(function (step) {
      var active = step.dataset.useCaseStage === stage;
      step.classList.toggle("is-active", active);
      step.setAttribute("aria-pressed", String(active));
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { select(index, false); });
    tab.addEventListener("keydown", function (event) {
      var next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
    });
  });
  steps.forEach(function (step) {
    step.addEventListener("click", function () {
      var index = tabs.findIndex(function (tab) { return tab.dataset.useCaseStage === step.dataset.useCaseStage; });
      if (index !== -1) select(index, false);
    });
  });
})();

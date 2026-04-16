(() => {
  const target = document.getElementById("missing-path");
  if (!target) {
    return;
  }

  target.textContent = window.location.pathname || "/";
})();

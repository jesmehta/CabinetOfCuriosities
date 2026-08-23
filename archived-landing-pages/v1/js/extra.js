// Add a custom body class based on URL path
document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;
  if (path.includes("/dotMandalaTool/")) {
    document.body.classList.add("page-dot-mandala");
  }
});

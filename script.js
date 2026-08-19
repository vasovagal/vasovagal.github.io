(() => {
  "use strict";

  // Preserve links from the original one-page launch after splitting the site
  // into focused routes.
  const legacyRoutes = {
    "#vagus": "/vagus/",
    "#corti": "/corti/",
    "#smart": "/smart/",
    "#rag": "/rag/",
    "#benchmark": "/rag/#benchmark",
    "#skills": "/rag/#skills",
    "#install": "/install/",
  };
  if ((location.pathname === "/" || location.pathname === "/index.html") && legacyRoutes[location.hash]) {
    location.replace(legacyRoutes[location.hash]);
    return;
  }

  const reveal = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -7%", threshold: 0.08 },
    );
    reveal.forEach((node) => observer.observe(node));
  } else {
    reveal.forEach((node) => node.classList.add("is-visible"));
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const original = button.textContent;
      try {
        await copyText(button.dataset.copy || "");
        button.textContent = "copied ✓";
      } catch {
        button.textContent = "copy failed";
      }
      window.setTimeout(() => {
        button.textContent = original;
      }, 1600);
    });
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

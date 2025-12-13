export function initNavMenu() {
  const toggle = document.querySelector(".c-nav__toggle");
  const menu = document.querySelector(".c-nav__menu");

  if (!toggle || !menu) return;

  function isDesktop() {
    return window.innerWidth >= 900;
  }

  function setOpen(isOpen) {
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    // Keep this if you still use it anywhere (harmless)
    menu.classList.toggle("is-open", isOpen);

    // Only lock scroll on mobile overlay
    document.body.classList.toggle("is-nav-open", !isDesktop() && isOpen);

    // Desktop slide-in uses .c-nav.is-open
    const nav = toggle.closest(".c-nav");
    if (nav) nav.classList.toggle("is-open", isDesktop() && isOpen);
  }

  function closeMenu() {
    setOpen(false);
  }

  setOpen(isDesktop());

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  document.addEventListener("click", () => closeMenu());
  menu.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    // On breakpoint change, always close to avoid mixed states
    closeMenu();
  });
}

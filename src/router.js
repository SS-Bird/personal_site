// ---------------------------------------------------------------------------
// router.js: a tiny client-side router.
//
// Instead of letting the browser load a new HTML file, we intercept clicks on
// <a data-link> links, change the URL with history.pushState (no reload),
// and tell the app to show the new page. The back/forward buttons fire a
// "popstate" event, which we handle the same way.
// ---------------------------------------------------------------------------

export function createRouter(onNavigate) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;
    // Let cmd/ctrl-click etc. open a new tab as usual.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    const path = new URL(link.href).pathname;
    if (path === window.location.pathname) return;
    history.pushState({}, '', path);
    onNavigate(path);
  });

  window.addEventListener('popstate', () => onNavigate(window.location.pathname));

  // Show whatever page the URL points at on first load.
  onNavigate(window.location.pathname);
}

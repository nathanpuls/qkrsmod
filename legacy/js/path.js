export function getPath() {
  let path = location.pathname.slice(1).replace(/\.html$/, '').replace(/[.#$[\]]/g, '');
  return path || "home";
}

export function isXPath() {
  const fullURL = window.location.href.toLowerCase();
  const p = getPath().toLowerCase();
  return fullURL.includes("/x/") || p === "x";
}

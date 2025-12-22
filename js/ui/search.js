// search.js
export function setupSearch({ searchBtn, topSearchContainer, topSearchInput, clearSearchBtn }) {

  // -------------------------
  // Internal functions
  // -------------------------
  function openSearch() {
    topSearchContainer.style.display = "flex";
    topSearchInput.focus();
    toggleClearButton();
  }

  function closeSearch() {
    topSearchContainer.style.display = "none";
    topSearchInput.value = "";
    clearSearchBtn.style.display = "none";
  }

  function toggleClearButton() {
    clearSearchBtn.style.display = topSearchInput.value.length > 0 ? "flex" : "none";
  }

  // -------------------------
  // Event listeners
  // -------------------------
  searchBtn.addEventListener("click", e => { e.stopPropagation(); openSearch(); });

  [topSearchContainer, topSearchInput, clearSearchBtn].forEach(el =>
    el.addEventListener("click", e => e.stopPropagation())
  );

  topSearchInput.addEventListener("input", toggleClearButton);

  topSearchInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && topSearchInput.value.trim()) {
      e.preventDefault();
      const v = topSearchInput.value.trim();
      // If user entered an absolute path, use it as-is
      if (v.startsWith('/')) {
        window.location.href = v;
      } else {
        // Normalize page name (lowercase, spaces -> hyphens)
        const normalized = v.toLowerCase().replace(/\s+/g, '-');
        window.location.href = window.location.origin + '/' + normalized;
      }
      closeSearch();
    }
    if (e.key === "Escape") closeSearch();
  });

  clearSearchBtn.addEventListener("mousedown", e => e.preventDefault());
  clearSearchBtn.addEventListener("click", () => {
    topSearchInput.value = "";
    topSearchInput.focus();
    toggleClearButton();
  });

  document.addEventListener("pointerdown", e => {
    if (topSearchContainer.style.display === "flex" &&
      !topSearchContainer.contains(e.target) &&
      e.target !== searchBtn) closeSearch();
  });

  // -------------------------
  // Return functions so they can be used elsewhere
  // -------------------------
  return { openSearch, closeSearch, toggleClearButton };
}

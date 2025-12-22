// copy.js

// Copy content from editor or static viewer
export function copyContent(editor, staticViewer, copyBtn) {
  const content = editor && editor.value !== undefined
    ? editor.value
    : staticViewer?.innerText || "";

  navigator.clipboard.writeText(content).then(() => {
    if (!copyBtn) return;
    copyBtn.innerHTML = '<i class="ph-bold ph-check"></i>';
    setTimeout(() => copyBtn.innerHTML = '<i class="ph-bold ph-copy-simple"></i>', 900);
  });
}

// Copy current page URL
export function copyLink(copyLinkBtn) {
  if (!copyLinkBtn) return;
  navigator.clipboard.writeText(window.location.href).then(() => {
    copyLinkBtn.innerHTML = '<i class="ph-bold ph-check"></i>';
    setTimeout(() => copyLinkBtn.innerHTML = '<i class="ph-bold ph-link-simple-horizontal"></i>', 900);
  });
}

// Setup event listeners on buttons
export function setupCopy({ copyBtn, copyLinkBtn, editor, staticViewer }) {
  if (copyBtn) {
    copyBtn.addEventListener("click", () => copyContent(editor, staticViewer, copyBtn));
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => copyLink(copyLinkBtn));
  }
}

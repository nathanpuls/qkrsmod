
export const qrCanvas = document.getElementById("qrCanvas");
export const qrToggleBtn = document.getElementById("qrToggleBtn");
export const qrModal = document.getElementById("qrModal");
export const qrModalClose = document.getElementById("qrModalClose");

export function drawQR(text, size = 300) {
  if (!qrCanvas) return;
  const ctx = qrCanvas.getContext && qrCanvas.getContext("2d");
  if (!ctx) return;
  qrCanvas.width = size;
  qrCanvas.height = size;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&data=" + encodeURIComponent(text);
  img.onload = () => {
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.drawImage(img, 0, 0, size, size);
  };
  img.onerror = () => {
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.fillStyle = "#333";
    ctx.fillText("QR load error", 10, 20);
  };
}

function openModal() {
  if (!qrModal) return;
  qrModal.style.display = "flex";
  drawQR(window.location.href, 300);
}

function closeModal() {
  if (!qrModal) return;
  qrModal.style.display = "none";
}

export function toggleQR() {
  if (!qrModal) return;
  if (qrModal.style.display === "flex") closeModal();
  else openModal();
}

if (qrToggleBtn) {
  qrToggleBtn.addEventListener("click", () => {
    toggleQR();
  });
}

if (qrModalClose) {
  qrModalClose.addEventListener("click", closeModal);
}

if (qrModal) {
  qrModal.addEventListener("click", e => {
    if (e.target === qrModal) closeModal();
  });
}

// download button removed — QR can be copied from canvas if needed

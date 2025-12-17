export function showTooltip(button, text = "Copied!") {
  let tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerText = text;
  document.body.appendChild(tooltip);

  const rect = button.getBoundingClientRect();
  tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
  tooltip.style.top = rect.top - tooltip.offsetHeight - 6 + "px";

  requestAnimationFrame(() => tooltip.classList.add("show"));

  setTimeout(() => {
    tooltip.classList.remove("show");
    setTimeout(() => document.body.removeChild(tooltip), 200);
  }, 1000);
}

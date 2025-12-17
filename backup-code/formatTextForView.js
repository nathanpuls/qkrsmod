// -------------------------
// Format Text for View
// -------------------------
export function formatTextForView(text) {
  if (!text) return "";

  // Escape HTML except & in URLs
  let escaped = text
    .replace(/&/g, "&amp;")   // escape all & first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  // Match URLs (with optional protocol) and allow query parameters
  const urlRegex = /\b((https?:\/\/|www\.)[^\s<]+)/gi;
  escaped = escaped.replace(urlRegex, match => {
    let url = match;
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    return `<a href="${url}" target="_blank" style="color:inherit;text-decoration:underline;">${match}</a>`;
  });

  // Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  escaped = escaped.replace(emailRegex, '<a href="mailto:$1" style="color:inherit;text-decoration:underline;">$1</a>');

  // Phone numbers (basic)
  const phoneRegex = /(\+?\d[\d\s\-\(\)]{7,}\d)/g;
  escaped = escaped.replace(phoneRegex, '<a href="tel:$1" style="color:inherit;text-decoration:underline;">$1</a>');

  return escaped;
}
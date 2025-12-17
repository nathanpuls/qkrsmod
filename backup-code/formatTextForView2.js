export function formatTextForView(text) {
  if (!text) return "";

  // Escape HTML first
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Line breaks
  escaped = escaped.replace(/\n/g, "<br>");

  // Emails
  escaped = escaped.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" style="color:inherit;text-decoration:underline;">$1</a>'
  );

  // URLs with protocol or www
  escaped = escaped.replace(
    /\b((https?:\/\/|www\.)[^\s<]+)/gi,
    match => {
      let url = match;
      if (!/^https?:\/\//i.test(url)) url = "http://" + url;
      return `<a href="${url}" target="_blank" style="color:inherit;text-decoration:underline;">${match}</a>`;
    }
  );

  // Plain domains without protocol (skip emails)
  escaped = escaped.replace(
    /\b((?!mailto:)([a-z0-9-]+\.)+[a-z]{2,}([\/\w\?\&\#.-]*)?)(?=\s|<br>|$)/gi,
    match => {
      if (/@/.test(match)) return match; // skip emails
      return `<a href="http://${match}" target="_blank" style="color:inherit;text-decoration:underline;">${match}</a>`;
    }
  );

  // Phone numbers (basic)
  escaped = escaped.replace(
    /(\+?\d[\d\s\-\(\)]{7,}\d)/g,
    '<a href="tel:$1" style="color:inherit;text-decoration:underline;">$1</a>'
  );

  return escaped;
}
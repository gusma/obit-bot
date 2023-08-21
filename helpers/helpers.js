function escapeXML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeForURL(input) {
  const withoutDiacritics = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return withoutDiacritics.replace(/[ .-]+/g, "").toLowerCase();
}

module.exports = { escapeXML, sanitizeForURL };

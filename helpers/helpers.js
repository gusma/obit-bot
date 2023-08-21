function escapeXML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeForURL(input) {
  return input.replace(/[ .-]+/g, "").toLowerCase();
}

module.exports = { escapeXML, sanitizeForURL };

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const baseUrl =
  "https://servicios.lanacion.com.ar/edicion-impresa/avisos-funebres/resultado/categorias=1041,1037,1036,1039,1035,1042,1040,7992-fecha=";
// Format date to match url format eg. (YYYYMMDD)
const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, "");

async function scrapePage(pageNumber) {
  const results = [];
  try {
    const url = `${baseUrl}${currentDate}-pagina=${pageNumber}-palabra=`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Browse page content subsection
    $("#contenido .funebres").each((i, element) => {
      const itemText = $(element).text().trim();
      let name, description;

      const [tempName, ...descriptionParts] = itemText.split(" - ");
      name = tempName;
      description = descriptionParts.join(" - ");

      // If there's an ul.acumulados, then append its text to description.
      const acumuladoUl = $(element).find("ul.acumulados");
      if (acumuladoUl.length > 0) {
        description += " " + acumuladoUl.text().trim();
      }

      // Remove unnecessary wishing messages eg QEPD, RIP, etc.
      const polishedName = name
        .replace(/,\s?q\.e\.p\.d\.|,\s?Z\.L\.|,\s?QEPD|,\s?RIP/gi, "")
        .trim();

      function formatDateToISO(yymmdd) {
        return `${yymmdd.substring(0, 4)}-${yymmdd.substring(
          4,
          6
        )}-${yymmdd.substring(6, 8)}`;
      }

      const date = formatDateToISO(currentDate);

      results.push({
        name: polishedName,
        description: description.trim(),
        date: date,
      });
    });

    if ($(`a[href$="-pagina=${pageNumber + 1}-palabra="]`).length > 0) {
      results.push(...(await scrapePage(pageNumber + 1)));
    }

    return results;
  } catch (error) {
    console.error("Error while scraping:", error);
  }
  return results;
}

// Generate RSS feed. No links included since funerary pages has no further deeplinking.
async function generateRSS() {
  const items = await scrapePage(1);
  let rssItems = "";
  items.forEach((item) => {
    rssItems += `
        <item>
          <title>${item.name}</title>
          <description>${item.description}</description>
          <pubDate>${new Date(item.date).toUTCString()}</pubDate>
        </item>`;
  });

  // Properly format file
  const rssFeed = `
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Funebres from La Nación</title>
        <atom10:link
          xmlns:atom10="http://www.w3.org/2005/Atom"
          rel="self"
          type="application/rss+xml"
          href="https://gusma.github.io/obit-bot/rss.xml"
       />
        <link>https://servicios.lanacion.com.ar/edicion-impresa/avisos-funebres/</link>
        <description>Funebres scraped from La Nación</description>
        ${rssItems}
      </channel>
    </rss>`;

  fs.writeFileSync("docs/rss.xml", rssFeed); // Write to rss.xml file
}

generateRSS();

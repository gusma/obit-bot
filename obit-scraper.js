const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const baseUrl = "https://servicios.lanacion.com.ar/edicion-impresa/avisos-funebres/resultado/categorias=1041,1037,1036,1039,1035,1042,1040,7992-fecha=";

function formatDateToISO(yymmdd) {
  return `${yymmdd.substring(0, 4)}-${yymmdd.substring(4, 6)}-${yymmdd.substring(6, 8)}`;
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, "")

async function scrapePage(pageNumber, dateToScrape) {
  const results = [];
  try {
    const url = `${baseUrl}${dateToScrape}-pagina=${pageNumber}-palabra=`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $("#contenido .funebres").each((i, element) => {
      const itemText = $(element).text().trim();
      let name, description;

      const [tempName, ...descriptionParts] = itemText.split(" - ");
      name = tempName;
      description = descriptionParts.join(" - ");

      const acumuladoUl = $(element).find("ul.acumulados");
      if (acumuladoUl.length > 0) {
        description += " " + acumuladoUl.text().trim();
      }

      const polishedName = name.replace(/,\s?q\.e\.p\.d\.|,\s?Z\.L\.|,\s?QEPD|,\s?RIP/gi, "").trim();

      const date = formatDateToISO(dateToScrape);

      results.push({
        name: polishedName,
        description: description.trim(),
        date: date,
      });
    });

    if ($(`a[href$="-pagina=${pageNumber + 1}-palabra="]`).length > 0) {
      results.push(...(await scrapePage(pageNumber + 1, dateToScrape)));
    }

    return results;
  } catch (error) {
    console.error("Error while scraping:", error);
  }
  return results;
}

async function generateRSS(date) {
  const items = await scrapePage(1, date);
  let rssItems = "";
  items.forEach((item) => {
    rssItems += `
      <item>
        <title>${item.name}</title>
        <description>${item.description}</description>
        <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      </item>`;
  });

  return rssItems;
}

(async function() {
  const todayItems = await generateRSS(currentDate);
  const yesterdayItems = await generateRSS(getYesterday());

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
        ${todayItems}
        ${yesterdayItems}
      </channel>
    </rss>`;

  fs.writeFileSync("docs/rss.xml", rssFeed); 
})();


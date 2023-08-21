const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const helperFunctions = require("./helpers/helpers");

const baseURL = process.env.BASE_URL || "https://gusma.github.io/obit-bot/";

const baseUrl =
  "https://servicios.lanacion.com.ar/edicion-impresa/avisos-funebres/resultado/categorias=1041,1037,1036,1039,1035,1042,1040,7992-fecha=";

function formatDateToISO(yymmdd) {
  return `${yymmdd.substring(0, 4)}-${yymmdd.substring(
    4,
    6
  )}-${yymmdd.substring(6, 8)}`;
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, "");

async function scrapePage(pageNumber, dateToScrape) {
  const results = [];
  try {
    const url = `${baseUrl}${dateToScrape}-pagina=${pageNumber}-palabra=`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $("#contenido .funebres").each((i, element) => {
      const textContent = $(element).text().trim();

      if (textContent.startsWith("Fallecidos de la semana")) {
        // Extract the list of deceased names as the description
        const description = textContent
          .replace("Fallecidos de la semana en los Cem. comunitarios", "")
          .trim();

        results.push({
          name: "Fallecidos de la semana en los Cem. comunitarios",
          description: description,
          date: formatDateToISO(dateToScrape),
        });
      } else {
        // This is for the "regular" entries which have descriptions
        const [tempName, ...descriptionParts] = textContent.split(". - ");
        if (descriptionParts.length === 0) return;

        results.push({
          name: tempName
            .replace(/,\s?q\.e\.p\.d\.|,\s?Z\.L\.|,\s?QEPD|,\s?RIP/gi, "")
            .trim(),
          description: descriptionParts.join(". - ").trim(),
          date: formatDateToISO(dateToScrape),
        });
      }
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
  let items = await scrapePage(1, date);

  // Handle duplicate names
  const nameCounts = new Map();
  const nameIndices = new Map();

  items.forEach((item) => {
    nameCounts.set(item.name, (nameCounts.get(item.name) || 0) + 1);
  });

  items = items.map((item) => {
    const count = nameCounts.get(item.name);
    if (count > 1) {
      const index = (nameIndices.get(item.name) || 0) + 1;
      nameIndices.set(item.name, index);
      return {
        ...item,
        name: `${item.name} (${index})`,
      };
    }
    return item;
  });

  // Generate RSS items
  let rssItems = "";
  items.forEach((item) => {
    console.log("item name", item.name);
    console.log("item description", item.description);
    const sanitizedTitle = helperFunctions.sanitizeForURL(
      helperFunctions.escapeXML(item.name)
    );
    const itemGuidAndLinkSegment = `${sanitizedTitle}_${item.date}`;
    const itemGuidAndLink = `${baseURL}/obit-bot/${itemGuidAndLinkSegment}`;
    rssItems += `
      <item>
        <title>${helperFunctions.escapeXML(item.name)}</title>
        <description>${helperFunctions.escapeXML(
          item.description
        )}</description>
        <pubDate>${new Date(item.date).toUTCString()}</pubDate>
        <guid>${baseURL}${itemGuidAndLink}</guid>
        <link>${baseURL}${itemGuidAndLink}</link>
      </item>`;
  });

  return rssItems;
}

(async function () {
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

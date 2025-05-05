const cheerio = require("cheerio");
const axios = require("axios");
const router = require("express").Router();
// Fix to match your utils.js file structure
const { generateFilename, saveProductJson, generateTitle } = require("./utils");
const fs = require("fs");

const baseUrl = "https://www.amazon.com";
const cnaBaseUrl = "https://www.channelnewsasia.com";
const bbcBaseUrl = "https://www.bbc.com/news";
const quotesToScrapeUrl = "https://quotes.toscrape.com/page/2/";
router.get("/", (req, res) => {
  res.send("Scraper API is up!");
});

router.post("/scrapeCNA", async (req, res) => {
  const { url } = req.body || cnaBaseUrl;
  if (!url) return;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const headlines = [];

    //headline (feature card)
    $(".feature-card__content").each((_i, element) => {
      const headlineElement = $(element).find("a.feature-card__heading-link");
      const categoryElement = $(element).find("p.feature-card__category a");

      const text = headlineElement.text().trim();
      const category = categoryElement.text().trim();
      const link = headlineElement.attr("href");

      if (text && link) {
        headlines.push({
          text,
          link: link.startsWith("http")
            ? link
            : `https://www.channelnewsasia.com${link}`,
          category,
        });
      }
    });

    //sub-headlines
    $(".list-object").each((_index, element) => {
      const headlineElement = $(element).find(
        "a.h6__link.list-object__heading-link"
      );
      const categoryElement = $(element).find("p.list-object__category a");

      const text = headlineElement.text().trim();
      const link = headlineElement.attr("href");
      const category = categoryElement.text().trim();

      if (text && link) {
        headlines.push({
          text,
          link: link.startsWith("http")
            ? link
            : `https://www.channelnewsasia.com${link}`,
          category,
        });
      }
    });

    res.json({
      length: headlines.length,
      message: "Headlines scraped",
      data: headlines,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error scraping CNA headlines",
      error: e.message,
    });
  }
});

router.post("/scrapeExample1", async (req, res) => {
  const { url } = req.body || quotesToScrapeUrl;
  if (!url) return;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const quotes = [];

    $(".quote").each((index, element) => {
      const text = $(element).find(".text").text();
      quotes.push(text);
    });

    //scraping tags
    $(".tag").each((_index, element) => {
      const text = $(element).text();
      const link = $(element).attr("href");
      quotes.push({ text: text, link: link });
    });

    fs.writeFile("data/quotesData.json", JSON.stringify(quotes), (err) => {
      if (err) throw err;
      console.log("file successfully saved");
    });

    res.json({
      length: quotes.length,
      message: "Quotes scraped",
      data: quotes,
    });
  } catch (e) {
    res.status(500).json({
      message: "Error scraping CNA headlines",
      error: e.message,
    });
  }
});

router.post("/scrapeBBC", async (req, res) => {
  try {
    // Add user-agent to bypass some restrictions
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
    };

    // Use the BBC News homepage URL
    console.log("Fetching BBC News homepage...");
    const response = await axios.get(bbcBaseUrl, { headers });
    console.log("Response received, status:", response.status);

    const $ = cheerio.load(response.data);
    const headlines = [];

    console.log("Parsing BBC content...");

    // More generic approach for BBC articles - look for all article elements
    $("article").each((i, el) => {
      const article = $(el);

      // Try multiple selectors for headlines
      const headingElement = article.find("h3, h2, h1").first();
      const title = headingElement.text().trim();

      // Try to find link - could be on the heading or parent element
      let link =
        headingElement.find("a").attr("href") ||
        headingElement.closest("a").attr("href") ||
        article.find("a").first().attr("href");

      // Make relative URLs absolute
      if (link && !link.startsWith("http")) {
        link = "https://www.bbc.com" + link;
      }

      // Try to find category/section from URL or data attributes
      let category = article.attr("data-section") || "News";
      if (link && !category) {
        const urlParts = link.split("/");
        if (urlParts.length > 4) {
          category = urlParts[4].charAt(0).toUpperCase() + urlParts[4].slice(1);
        }
      }

      // Find image URL if available (trying multiple approaches)
      let imageUrl = "";
      const imageElement = article.find("img").first();
      if (imageElement.length) {
        imageUrl =
          imageElement.attr("src") ||
          imageElement.attr("data-src") ||
          imageElement.attr("srcset")?.split(" ")[0];
      }

      // Only add if we have at least a title and link
      if (title && link && !headlines.some((h) => h.title === title)) {
        headlines.push({
          title,
          link,
          category: category || "Uncategorized",
          imageUrl: imageUrl || "",
        });
      }
    });

    // Try a more generic approach if we didn't find anything
    if (headlines.length === 0) {
      console.log(
        "No articles found with article tag, trying alternative selectors..."
      );

      // Look for all links that might be headlines
      $("a").each((i, el) => {
        const link = $(el);
        const href = link.attr("href");

        // Only process links that look like news articles
        if (href && (href.includes("/news/") || href.startsWith("/news/"))) {
          const title = link.text().trim();

          // Skip navigation, footer, and other common non-headline elements
          if (
            title &&
            title.length > 10 &&
            !link.closest("nav, footer, header").length &&
            !headlines.some((h) => h.title === title)
          ) {
            // Make relative URLs absolute
            let fullLink = href;
            if (!href.startsWith("http")) {
              fullLink = "https://www.bbc.com" + href;
            }

            // Extract category from URL
            let category = "News";
            const urlParts = fullLink.split("/");
            if (urlParts.length > 4) {
              category =
                urlParts[4].charAt(0).toUpperCase() + urlParts[4].slice(1);
            }

            headlines.push({
              title,
              link: fullLink,
              category,
              imageUrl: "",
            });
          }
        }
      });
    }

    // Save the headlines to a file
    console.log(`Found ${headlines.length} BBC headlines`);

    // Update saveProductJson call to pass filename correctly
    const dateStr = Date.now();
    const filename = `bbc_headlines_${dateStr}.json`;

    try {
      saveProductJson(headlines, filename);
      console.log(`Headlines saved to ${filename}`);
    } catch (err) {
      console.error("Error saving headlines:", err);
    }

    res.json({
      headlines_saved: headlines.length,
      message:
        headlines.length > 0
          ? "BBC headlines scraped successfully"
          : "No BBC headlines found",
      filename,
      data: headlines, // Return the data in the response too
    });
  } catch (error) {
    console.error("Error scraping BBC headlines:", error);
    res.status(500).json({
      message: "Error scraping BBC headlines",
      error: error.message,
    });
  }
});

router.post("/scrapeAmazon", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes(baseUrl)) {
    return res.status(400).json({ message: "Invalid URL" });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const products = [];

    $(".s-result-item").each((i, el) => {
      const product = $(el);
      const priceWhole = product.find(".a-price-whole").text();
      const priceFraction = product.find(".a-price-fraction").text();
      const price = priceWhole + priceFraction;
      const link = product.find(".a-link-normal.a-text-normal").attr("href");
      const title = generateTitle(product, link);

      if (title && price && link) {
        products.push({ title, price, link });
      }
    });

    saveProductJson(products); // Save to file

    res.json({
      products_saved: products.length,
      message: "Products scraped successfully",
      filename: generateFilename(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error scraping products",
      error: error.message,
    });
  }
});

// Export the router so it can be used in the server.js file
module.exports = router;

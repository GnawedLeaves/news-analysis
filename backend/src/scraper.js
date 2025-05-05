const cheerio = require("cheerio");
const axios = require("axios");
const router = require("express").Router();
const { generateFilename, saveProductJson, generateTitle } = require("./utils");

const baseUrl = "https://www.amazon.com";
const cnaBaseUrl = "https://www.channelnewsasia.com";

router.get("/", (req, res) => {
  res.send("Scraper API is up!");
});

router.post("/scrapeCNA", async (req, res) => {
  try {
    // Use the CNA homepage URL directly
    const response = await axios.get(cnaBaseUrl);
    const $ = cheerio.load(response.data);
    const headlines = [];

    // This selector might need adjustment based on CNA's actual HTML structure
    // Looking for main headline articles on the landing page
    $("article.feature-card, article.list-object").each((i, el) => {
      const article = $(el);
      const titleElement = article.find(
        "h3, h2, .feature-card__title, .list-object__heading, .h6"
      );
      const title = titleElement.text().trim();

      // Find the link - CNA typically has anchor tags wrapping headlines
      let link = article.find("a").attr("href");

      // Some links might be relative, so we need to make them absolute
      if (link && !link.startsWith("http")) {
        link = cnaBaseUrl + link;
      }

      // Find the category/section if available
      const category = article
        .find(".category-label, .list-object__category")
        .text()
        .trim();

      // Find image URL if available
      let imageUrl =
        article.find("img").attr("src") || article.find("img").attr("data-src");

      // Only add if we have at least a title and link
      if (title && link) {
        headlines.push({
          title,
          link,
          category: category || "Uncategorized",
          imageUrl,
        });
      }
    });

    // Save the headlines to a file
    const filename = `cna_headlines_${Date.now()}.json`;
    saveProductJson(headlines, filename);

    res.json({
      headlines_saved: headlines.length,
      message: "Headlines scraped successfully",
      filename,
      data: headlines, // Return the data in the response too
    });
  } catch (error) {
    res.status(500).json({
      message: "Error scraping CNA headlines",
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

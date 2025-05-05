// src/scraper.js
const cheerio = require("cheerio");
const axios = require("axios");
const router = require("express").Router();
const { generateFilename, saveProductJson, generateTitle } = require("./utils");

const baseUrl = "https://www.amazon.com";

router.get("/", (req, res) => {
  res.send("Scraper API is up!");
});

router.post("/scrapeCNA", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes(baseUrl)) {
    return res.status(400).json({ message: "Invalid URL" });
  }

  try {
  } catch (e) {}
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

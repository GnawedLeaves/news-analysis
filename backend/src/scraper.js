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

    //scrape with media

    //headline (feature card)
    $(".feature-card__content").each((_i, element) => {
      const headlineElement = $(element).find("a.feature-card__heading-link");
      const categoryElement = $(element).find("p.feature-card__category a");

      const text = headlineElement.text().trim();
      const category = categoryElement.text().trim();
      const link = headlineElement.attr("href");

      const imageElement = $(element)
        .closest(".feature-card")
        .find(".feature-card__figure img");

      const imageUrl = imageElement.attr("src");

      if (text && link) {
        headlines.push({
          text,
          link: link.startsWith("http")
            ? link
            : `https://www.channelnewsasia.com${link}`,
          category,
          image: imageUrl || null,
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

      const imageElement = $(element)
        .closest(".media-object")
        .find(".media-object__figure img");
      // OR .find("img.image");

      const imageUrl = imageElement.attr("src");

      const timeElement = $(element).find(".list-object__timestamp");
      const unixTime = timeElement.attr("data-lastupdated");
      const publishedAt = unixTime
        ? new Date(parseInt(unixTime, 10) * 1000).toISOString()
        : null;

      if (text && link) {
        headlines.push({
          text,
          link: link.startsWith("http")
            ? link
            : `https://www.channelnewsasia.com${link}`,
          category,
          image: imageUrl || null,
          publishedAt,
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
  const { url } = req.body || bbcBaseUrl;
  if (!url) return;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const headlines = [];
    $("[data-testid='manchester-card']").each((_index, element) => {
      const wrapper = $(element);

      const headline = wrapper
        .find("[data-testid='card-headline']")
        .text()
        .trim();
      const description = wrapper
        .find("[data-testid='card-description']")
        .text()
        .trim();
      const link = wrapper
        .find("[data-testid='external-anchor'], [data-testid='internal-link']")
        .attr("href");

      // You can add more selectors if you want to extract date/time or other details

      if (headline) {
        headlines.push({
          headline,
          description,
          link: link.startsWith("http") ? link : `https://www.bbc.com${link}`,
        });
      }
    });

    res.json({
      length: headlines.length,
      message:
        headlines.length > 0
          ? "BBC headlines scraped successfully"
          : "No BBC headlines found",
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

const cheerio = require("cheerio");
const axios = require("axios");
const router = require("express").Router();
// Fix to match your utils.js file structure
const { generateFilename, saveProductJson, generateTitle } = require("./utils");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

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

      const timeElement = $(element).find("span.feature-card__timestamp");
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

async function scrapeSteamReviews(appId, numReviews = 10) {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=${numReviews}&language=english`;

  try {
    const response = await axios.get(url);
    const reviews = response.data.reviews;

    const parsed = reviews.map((r) => ({
      reviewText: r.review,
      recommended: r.voted_up,
      hoursPlayed: r.author.playtime_forever / 60,
      postedAt: new Date(r.timestamp_created * 1000).toISOString(),
    }));

    console.log(parsed);
    return parsed;
  } catch (err) {
    console.error("Error fetching reviews:", err.message);
    return [];
  }
}

router.post("/scrapeSteamReviews", async (req, res) => {
  const { appId, count } = req.body;

  if (!appId) {
    return res.status(400).json({ message: "appId is required" });
  }

  try {
    const reviews = await scrapeSteamReviews(appId, count || 10);

    res.json({ length: reviews.length, reviews });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Error scraping reviews", error: e.message });
  }
});

router.post("/scrapeSteamReviewsFilterAndDuplicatesCSV", async (req, res) => {
  const { games, count, filterThreshold } = req.body;

  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ message: "Valid games array is required" });
  }

  // Default threshold - if more than 50% non-alphanumeric characters, skip the review
  const nonAlphaThreshold =
    filterThreshold !== undefined ? filterThreshold : 0.5;

  try {
    // Create a directory for downloads if it doesn't exist
    const downloadDir = path.join(__dirname, "..", "data", "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Track progress for frontend updates
    let processedGames = 0;
    const totalGames = games.length;

    // Array to store all reviews
    const allReviews = [];
    const skippedReviews = {
      total: 0,
      byGame: {},
      duplicates: 0,
      nonAlphaNumeric: 0,
    };

    // Function to check if a review contains too many non-alphanumeric characters
    const hasTooManyNonAlphaNumeric = (text) => {
      if (!text) return true; // Skip empty reviews

      // Count alphanumeric characters
      const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
      const totalLength = text.length;

      // Calculate ratio of non-alphanumeric characters
      if (totalLength === 0) return true;
      const nonAlphaNumericRatio = 1 - alphaNumericCount / totalLength;

      return nonAlphaNumericRatio > nonAlphaThreshold;
    };

    // Set to track unique review content to prevent duplicates
    const uniqueReviewTexts = new Set();

    // Function to check if a review is a duplicate
    const isDuplicate = (text) => {
      if (!text) return true;

      // Normalize text for comparison (lowercase, remove extra spaces)
      const normalizedText = text.toLowerCase().trim().replace(/\s+/g, " ");

      // Check for short reviews (likely not meaningful)
      if (normalizedText.length < 20) return true;

      if (uniqueReviewTexts.has(normalizedText)) {
        return true;
      }

      uniqueReviewTexts.add(normalizedText);
      return false;
    };

    // Process each game sequentially
    for (const game of games) {
      // Send progress update via SSE or WebSocket if implemented
      processedGames++;
      console.log(
        `Scraping game ${processedGames}/${totalGames}: ${game.name}`
      );

      // Initialize skip count for this game
      skippedReviews.byGame[game.name] = {
        total: 0,
        duplicates: 0,
        nonAlphaNumeric: 0,
      };

      // We'll need to potentially scrape more than the requested count
      // to account for skipped reviews
      let validReviewsCount = 0;
      let totalScraped = 0;
      let validReviews = [];

      // Continue scraping until we reach the requested count
      // or until we've scraped a reasonable amount beyond the requested count
      // to avoid potential infinite loops
      const maxAttempts = (count || 10) * 5; // Max 5x the requested count as a safety limit

      while (validReviewsCount < (count || 10) && totalScraped < maxAttempts) {
        // Scrape a batch of reviews (adjust batch size as needed)
        const batchSize = Math.min(50, (count || 10) - validReviewsCount + 20);
        const reviewBatch = await scrapeSteamReviews(
          game.appId,
          batchSize,
          totalScraped
        );

        if (reviewBatch.length === 0) {
          // No more reviews available
          break;
        }

        totalScraped += reviewBatch.length;

        // Filter the batch and add valid reviews
        for (const review of reviewBatch) {
          // Check for non-alphanumeric first
          if (hasTooManyNonAlphaNumeric(review.reviewText)) {
            skippedReviews.total++;
            skippedReviews.byGame[game.name].total++;
            skippedReviews.byGame[game.name].nonAlphaNumeric++;
            skippedReviews.nonAlphaNumeric++;
            continue;
          }

          // Then check for duplicates
          if (isDuplicate(review.reviewText)) {
            skippedReviews.total++;
            skippedReviews.byGame[game.name].total++;
            skippedReviews.byGame[game.name].duplicates++;
            skippedReviews.duplicates++;
            continue;
          }

          // If we passed both checks, add to valid reviews
          validReviews.push(review);
          validReviewsCount++;

          // Break if we've reached our target
          if (validReviewsCount >= (count || 10)) {
            break;
          }
        }
      }

      console.log(
        `Game ${game.name}: collected ${validReviewsCount} valid reviews, ` +
          `skipped ${skippedReviews.byGame[game.name].total} total ` +
          `(${
            skippedReviews.byGame[game.name].nonAlphaNumeric
          } non-alphanumeric, ` +
          `${skippedReviews.byGame[game.name].duplicates} duplicates)`
      );

      // Add game info to each valid review
      const reviewsWithGameInfo = validReviews.map((review) => ({
        gameName: game.name,
        appId: game.appId,
        ...review,
      }));

      // Add to the collection
      allReviews.push(...reviewsWithGameInfo);
    }

    // Generate CSV from all reviews
    const fields = [
      { label: "Game Title", value: "gameName" },
      { label: "Steam App ID", value: "appId" },
      { label: "Review Content", value: "reviewText" },
      { label: "Is Recommended", value: "recommended" },
      { label: "Hours Played", value: "hoursPlayed" },
      { label: "Review Date", value: "postedAt" },
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(allReviews);

    // Save CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `steam_reviews_${timestamp}.csv`;
    const filePath = path.join(downloadDir, filename);

    fs.writeFileSync(filePath, csv);

    // Return download URL and processed data
    const downloadUrl = `/downloads/${filename}`;
    const successMessage = `Successfully scraped ${totalGames} games and generated CSV!!!! with ${allReviews.length} unique reviews`;
    console.log(successMessage);

    res.json({
      message: successMessage,
      gamesProcessed: totalGames,
      totalReviews: allReviews.length,
      filterStats: {
        skippedReviewsTotal: skippedReviews.total,
        skippedDuplicates: skippedReviews.duplicates,
        skippedNonAlphaNumeric: skippedReviews.nonAlphaNumeric,
        skippedByGame: skippedReviews.byGame,
        filterThreshold: nonAlphaThreshold,
      },
      downloadUrl,
      previewData: allReviews.slice(0, 5),
    });
  } catch (e) {
    console.error("Error scraping reviews for CSV:", e);
    res.status(500).json({
      message: "Error scraping reviews for CSV",
      error: e.message,
    });
  }
});

router.post("/scrapeSteamReviewsFilterCSV", async (req, res) => {
  const { games, count, filterThreshold } = req.body;

  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ message: "Valid games array is required" });
  }

  // Default threshold - if more than 50% non-alphanumeric characters, skip the review
  const nonAlphaThreshold =
    filterThreshold !== undefined ? filterThreshold : 0.5;

  try {
    // Create a directory for downloads if it doesn't exist
    const downloadDir = path.join(__dirname, "..", "data", "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Track progress for frontend updates
    let processedGames = 0;
    const totalGames = games.length;

    // Array to store all reviews
    const allReviews = [];
    const skippedReviews = { total: 0, byGame: {} };

    // Function to check if a review contains too many non-alphanumeric characters
    const hasTooManyNonAlphaNumeric = (text) => {
      if (!text) return true; // Skip empty reviews

      // Count alphanumeric characters
      const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
      const totalLength = text.length;

      // Calculate ratio of non-alphanumeric characters
      if (totalLength === 0) return true;
      const nonAlphaNumericRatio = 1 - alphaNumericCount / totalLength;

      return nonAlphaNumericRatio > nonAlphaThreshold;
    };

    // Process each game sequentially
    for (const game of games) {
      // Send progress update via SSE or WebSocket if implemented
      processedGames++;
      console.log(
        `Scraping game ${processedGames}/${totalGames}: ${game.name}`
      );

      // Initialize skip count for this game
      skippedReviews.byGame[game.name] = 0;

      // We'll need to potentially scrape more than the requested count
      // to account for skipped reviews
      let validReviewsCount = 0;
      let totalScraped = 0;
      let validReviews = [];

      // Continue scraping until we reach the requested count
      // or until we've scraped a reasonable amount beyond the requested count
      // to avoid potential infinite loops
      const maxAttempts = (count || 10) * 3; // Max 3x the requested count as a safety limit

      while (validReviewsCount < (count || 10) && totalScraped < maxAttempts) {
        // Scrape a batch of reviews (adjust batch size as needed)
        const batchSize = Math.min(20, (count || 10) - validReviewsCount + 5);
        const reviewBatch = await scrapeSteamReviews(
          game.appId,
          batchSize,
          totalScraped
        );

        if (reviewBatch.length === 0) {
          // No more reviews available
          break;
        }

        totalScraped += reviewBatch.length;

        // Filter the batch and add valid reviews
        for (const review of reviewBatch) {
          if (!hasTooManyNonAlphaNumeric(review.reviewText)) {
            validReviews.push(review);
            validReviewsCount++;

            // Break if we've reached our target
            if (validReviewsCount >= (count || 10)) {
              break;
            }
          } else {
            skippedReviews.total++;
            skippedReviews.byGame[game.name]++;
          }
        }
      }

      console.log(
        `Game ${
          game.name
        }: collected ${validReviewsCount} valid reviews, skipped ${
          skippedReviews.byGame[game.name]
        }`
      );

      // Add game info to each valid review
      const reviewsWithGameInfo = validReviews.map((review) => ({
        gameName: game.name,
        appId: game.appId,
        ...review,
      }));

      // Add to the collection
      allReviews.push(...reviewsWithGameInfo);
    }

    // Generate CSV from all reviews
    const fields = [
      { label: "Game Title", value: "gameName" },
      { label: "Steam App ID", value: "appId" },
      { label: "Review Content", value: "reviewText" },
      { label: "Is Recommended", value: "recommended" },
      { label: "Hours Played", value: "hoursPlayed" },
      { label: "Review Date", value: "postedAt" },
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(allReviews);

    // Save CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `steam_reviews_${timestamp}.csv`;
    const filePath = path.join(downloadDir, filename);

    fs.writeFileSync(filePath, csv);

    // Return download URL and processed data
    const downloadUrl = `/downloads/${filename}`;

    res.json({
      message: `Successfully scraped ${totalGames} games with ${allReviews.length} reviews, skipped ${skippedReviews.total} and generated CSV  `,
      gamesProcessed: totalGames,
      totalReviews: allReviews.length,
      filterStats: {
        skippedReviewsTotal: skippedReviews.total,
        skippedReviewsByGame: skippedReviews.byGame,
        filterThreshold: nonAlphaThreshold,
      },
      downloadUrl,
      previewData: allReviews.slice(0, 5),
    });

    console.log("scrapping complete");
  } catch (e) {
    console.error("Error scraping reviews for CSV:", e);
    res.status(500).json({
      message: "Error scraping reviews for CSV",
      error: e.message,
    });
  }
});

router.post("/scrapeSteamReviewsCSV", async (req, res) => {
  const { games, count } = req.body;

  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ message: "Valid games array is required" });
  }

  try {
    // Create a directory for downloads if it doesn't exist
    const downloadDir = path.join(__dirname, "..", "data", "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Track progress for frontend updates
    let processedGames = 0;
    const totalGames = games.length;

    // Array to store all reviews
    const allReviews = [];

    // Process each game sequentially
    for (const game of games) {
      // Send progress update via SSE or WebSocket if implemented
      processedGames++;
      console.log(
        `Scraping game ${processedGames}/${totalGames}: ${game.name}`
      );

      // Scrape reviews for the current game
      const reviews = await scrapeSteamReviews(game.appId, count || 10);

      // Add game info to each review
      const reviewsWithGameInfo = reviews.map((review) => ({
        gameName: game.name,
        appId: game.appId,
        ...review,
      }));

      // Add to the collection
      allReviews.push(...reviewsWithGameInfo);
    }

    // Generate CSV from all reviews
    const fields = [
      { label: "Game Title", value: "gameName" },
      { label: "Steam App ID", value: "appId" },
      { label: "Review Content", value: "reviewText" },
      { label: "Is Recommended", value: "recommended" },
      { label: "Hours Played", value: "hoursPlayed" },
      { label: "Review Date", value: "postedAt" },
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(allReviews);

    // Save CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `steam_reviews_${timestamp}.csv`;
    const filePath = path.join(downloadDir, filename);

    fs.writeFileSync(filePath, csv);

    // Return download URL and processed data
    const downloadUrl = `/downloads/${filename}`;

    res.json({
      message: `Successfully scraped ${totalGames} games and generated CSV`,
      gamesProcessed: totalGames,
      totalReviews: allReviews.length,
      downloadUrl,
      previewData: allReviews.slice(0, 5), // Send first 5 reviews as preview
    });
    console.log("Scrapping complete");
  } catch (e) {
    console.error("Error scraping reviews for CSV:", e);
    res.status(500).json({
      message: "Error scraping reviews for CSV",
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

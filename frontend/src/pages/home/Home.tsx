import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../routes";
import { useEffect, useState } from "react";
import axios from "axios";
import { timeAgo } from "../../globalUtils";
import { steamApps } from "../../assets/steamIds/steamApps";

interface HeadlinesData {
  text: string;
  link: string;
  category: string;
  publishedAt: string;
  image?: string;
}

interface SteamReviewsResponse {
  length: number;
  reviews: SteamReviewItem[];
}

interface SteamReviewItem {
  hoursPlayed: number;
  postedAt: string;
  recommended: boolean;
  reviewText: string;
}

interface ScrapingStatus {
  isLoading: boolean;
  progress: number;
  message: string;
  totalTime: number;
}

const Home = () => {
  const [headlinesData, setHeadlinesData] = useState<HeadlinesData[]>([]);
  const [steamReviewsData, setSteamReviewsData] = useState<
    SteamReviewsResponse | {}
  >({});
  const [numberOfGames, setNumberOfGames] = useState<number>(1);
  const [numberOfReivewsPerGame, setNumberOfReivewsPerGame] =
    useState<number>(1);
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus>({
    isLoading: false,
    progress: 0,
    message: "",
    totalTime: 0,
  });

  const MAX_REVIEWS_PER_GAME = 100;

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002/";

  const getHeadlines = async () => {
    try {
      const url = "https://www.channelnewsasia.com/";
      const response = await axios.post(`${API_URL}scrapeCNA`, {
        url,
      });
      if (response) {
        setHeadlinesData(response.data.data);
      }
    } catch (e) {
      console.log("error getting headlines", e);
    }
  };

  const getSteamReviews = async () => {
    const customAppId = 1687950;

    try {
      const response = await axios.post(`${API_URL}scrapeSteamReviews`, {
        appId: customAppId,
        count: 100,
      });
      if (response) {
        setSteamReviewsData(response.data);
      }
    } catch (e) {
      console.log("error getting headlines", e);
    }
  };

  const handleScrapeMultipleGames = async () => {
    if (numberOfGames < 1 || numberOfReivewsPerGame < 1) return;
    // Reset status and set loading to true
    setScrapingStatus({
      isLoading: true,
      progress: 0,
      message: "Starting scraping process...",
      totalTime: 0,
    });

    const startTime = Date.now();

    try {
      // Limit the number of games to the available games in the array
      const gamesToScrape = Math.min(numberOfGames, steamApps.length);

      // Call the backend endpoint to scrape multiple games
      const response = await axios.post(`${API_URL}scrapeSteamReviewsCSV`, {
        games: steamApps.slice(0, gamesToScrape),
        count: numberOfReivewsPerGame,
      });

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // in seconds

      setScrapingStatus({
        isLoading: false,
        progress: 100,
        message: `Successfully scraped ${gamesToScrape} games and generated CSV!`,
        totalTime,
      });

      // If the backend returns a download URL, trigger the download
      if (response.data.downloadUrl) {
        window.location.href = response.data.downloadUrl;
      }
    } catch (error) {
      console.error("Error scraping games:", error);
      setScrapingStatus({
        isLoading: false,
        progress: 0,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        totalTime: (Date.now() - startTime) / 1000,
      });
    }
  };

  useEffect(() => {
    getHeadlines();
    getSteamReviews();
  }, []);

  return (
    <>
      <h1>THE REAL BBC</h1>
      Home
      <button
        onClick={() => {
          navigate(APP_ROUTES.chartExamples);
        }}
      >
        Go to charts
      </button>
      <button
        onClick={() => {
          getHeadlines();
        }}
      >
        UPDATE MY BIG NEWS
      </button>
      {/* Steam Games Scraper Section */}
      <div
        style={{
          margin: "2rem 0",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h2>Steam Games Review Scraper</h2>
        <p>
          Enter how many games you want to scrape (max {steamApps.length}{" "}
          games):
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          Number of games
          <input
            placeholder="Number of games"
            type="number"
            max={steamApps.length}
            value={numberOfGames}
            onChange={(e) => setNumberOfGames(parseInt(e.target.value))}
            style={{ padding: "0.5rem", width: "100px" }}
          />
          Number of reviews per game (max 100)
          <input
            placeholder="Number of reviews per game"
            type="number"
            max={MAX_REVIEWS_PER_GAME}
            value={numberOfReivewsPerGame}
            onChange={(e) =>
              setNumberOfReivewsPerGame(Math.max(1, parseInt(e.target.value)))
            }
            style={{ padding: "0.5rem", width: "100px" }}
          />
          <button
            onClick={handleScrapeMultipleGames}
            disabled={scrapingStatus.isLoading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: scrapingStatus.isLoading ? "#cccccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: scrapingStatus.isLoading ? "not-allowed" : "pointer",
            }}
          >
            {scrapingStatus.isLoading ? "Scraping..." : "Generate CSV"}
          </button>
        </div>

        {scrapingStatus.isLoading && (
          <div style={{ marginTop: "1rem" }}>
            <div
              style={{
                height: "20px",
                backgroundColor: "#e0e0e0",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${scrapingStatus.progress}%`,
                  backgroundColor: "#4CAF50",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
            <p>{scrapingStatus.message}</p>
            <p>Time elapsed: {scrapingStatus.totalTime.toFixed(1)} seconds</p>
          </div>
        )}

        {!scrapingStatus.isLoading && scrapingStatus.message && (
          <div style={{ marginTop: "1rem" }}>
            <p>{scrapingStatus.message}</p>
            {scrapingStatus.totalTime > 0 && (
              <p>Total time: {scrapingStatus.totalTime.toFixed(1)} seconds</p>
            )}
          </div>
        )}
      </div>
      <div>
        <h2>Steam Reviews</h2>
        <div
          style={{
            height: "50vh",
            overflowY: "auto",
            background: "#333333",
            color: "#ebebeb",
            padding: "5rem",
          }}
        >
          {(steamReviewsData as SteamReviewsResponse).reviews?.map(
            (review, index) => (
              <div
                key={index}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "1rem 0",
                }}
              >
                {index + 1}
                <p>
                  <strong>
                    {review.recommended
                      ? "👍 Recommended"
                      : "👎 Not Recommended"}
                  </strong>
                </p>
                <p>{review.reviewText}</p>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  Played for {review.hoursPlayed.toFixed(1)} hrs —{" "}
                  {timeAgo(review.postedAt)}
                </p>
              </div>
            )
          )}
        </div>
      </div>
      <div>
        {headlinesData.map((item, index) => (
          <div
            key={index}
            style={{ borderBottom: "1px solid #ccc", margin: "1rem 0" }}
          >
            <h3>{item.text}</h3>
            <p>
              {item.category} — {timeAgo(item.publishedAt)}
            </p>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              Read more
            </a>
            {item.image && (
              <img
                src={item.image}
                alt={item.text}
                style={{ width: "100px" }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;

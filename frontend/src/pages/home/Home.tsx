import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../routes";
import { useEffect, useState } from "react";
import axios from "axios";
import { timeAgo } from "../../globalUtils";

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
const Home = () => {
  const [headlinesData, setHeadlinesData] = useState<HeadlinesData[]>([]);
  const [steamReviewsData, setSteamReviewsData] = useState<
    SteamReviewsResponse | {}
  >({});

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

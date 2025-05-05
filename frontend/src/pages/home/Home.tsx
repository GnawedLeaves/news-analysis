import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../routes";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  convertISOtoDDMMYYYY,
  formatDateWithTime,
  timeAgo,
} from "../../globalUtils";

interface HeadlinesData {
  text: string;
  link: string;
  category: string;
  publishedAt: string;
  image?: string;
}
const Home = () => {
  const [headlinesData, setHeadlinesData] = useState<HeadlinesData[]>([]);
  const navigate = useNavigate();
  const getHeadlines = async () => {
    try {
      const url = "https://www.channelnewsasia.com/";
      const response = await axios.post("http://localhost:3002/scrapeCNA", {
        url,
      });
      console.log({ response });
      if (response) {
        setHeadlinesData(response.data.data);
      }
    } catch (e) {
      console.log("error getting headlines", e);
    }
  };

  useEffect(() => {
    getHeadlines();
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

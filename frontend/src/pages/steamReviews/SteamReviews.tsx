import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Input,
  Typography,
  Progress,
  Space,
  Tag,
  Avatar,
  List,
  Divider,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlayCircleOutlined,
  LikeOutlined,
  DislikeOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Title: AntTitle, Text } = Typography;

interface SteamReviewItem {
  hoursPlayed: number;
  postedAt: string;
  recommended: boolean;
  reviewText: string;
}

interface SteamReviewsResponse {
  length: number;
  reviews: SteamReviewItem[];
}

interface ScrapingStatus {
  isLoading: boolean;
  progress: number;
  message: string;
  totalTime: number;
}

interface SteamScrapingResponse {
  message: string;
  gamesProcessed: number;
  totalReviews: number;
  filterStats: {
    skippedReviewsTotal: number;
    skippedReviewsByGame: any;
    filterThreshold: number;
  };
  downloadUrl: string;
  previewData: SteamReviewItem[];
}

// Mock steam apps data
const steamApps = [
  { appId: 1687950, name: "Game 1" },
  { appId: 1234567, name: "Game 2" },
  { appId: 2345678, name: "Game 3" },
  // Add more games as needed
];

const SteamReviewsPage = () => {
  const [steamReviewsData, setSteamReviewsData] =
    useState<SteamReviewsResponse>({ length: 0, reviews: [] });
  const [numberOfGames, setNumberOfGames] = useState<number>(1);
  const [numberOfReviewsPerGame, setNumberOfReviewsPerGame] =
    useState<number>(1);
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus>({
    isLoading: false,
    progress: 0,
    message: "",
    totalTime: 0,
  });
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [responseMessage, setResponseMessage] =
    useState<SteamScrapingResponse>();
  const timerIntervalRef = useRef<number | null>(null);

  const MAX_REVIEWS_PER_GAME = 100;
  const API_URL = "http://localhost:3002/";

  // Mock timeAgo function
  const timeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(0)} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")} hours`;
    }
  };

  const startTimer = () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
    }
    setElapsedTime(0);
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
      console.log("error getting steam reviews", e);
    }
  };

  const handleScrapeMultipleGames = async () => {
    if (numberOfGames < 1 || numberOfReviewsPerGame < 1) return;

    setScrapingStatus({
      isLoading: true,
      progress: 0,
      message: "Starting scraping process...",
      totalTime: 0,
    });

    startTimer();

    try {
      // Mock API call - replace with actual axios call
      setTimeout(() => {
        stopTimer();
        const mockResponse: SteamScrapingResponse = {
          message: `Successfully scraped ${numberOfGames} games with ${numberOfReviewsPerGame} reviews each!`,
          gamesProcessed: numberOfGames,
          totalReviews: numberOfGames * numberOfReviewsPerGame,
          filterStats: {
            skippedReviewsTotal: 5,
            skippedReviewsByGame: {},
            filterThreshold: 10,
          },
          downloadUrl: "mock-download-url",
          previewData: [],
        };

        setScrapingStatus((prev) => ({
          ...prev,
          isLoading: false,
          progress: 100,
          message: mockResponse.message,
          totalTime: elapsedTime,
        }));

        setResponseMessage(mockResponse);
      }, 3000);
    } catch (error) {
      stopTimer();
      console.error("Error scraping games:", error);
      setScrapingStatus((prev) => ({
        ...prev,
        isLoading: false,
        progress: 0,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        totalTime: elapsedTime,
      }));
    }
  };

  useEffect(() => {
    getSteamReviews();
  }, []);

  // Chart data for reviews analysis
  const reviewsChartData = {
    labels: ["Positive Reviews", "Negative Reviews"],
    datasets: [
      {
        data: [
          steamReviewsData.reviews?.filter((r) => r.recommended).length || 0,
          steamReviewsData.reviews?.filter((r) => !r.recommended).length || 0,
        ],
        backgroundColor: ["#52c41a", "#ff4d4f"],
        borderWidth: 0,
      },
    ],
  };

  const hoursPlayedData = {
    labels:
      steamReviewsData.reviews?.map((_, index) => `Review ${index + 1}`) || [],
    datasets: [
      {
        label: "Hours Played",
        data: steamReviewsData.reviews?.map((r) => r.hoursPlayed) || [],
        backgroundColor: "#1890ff",
        borderColor: "#1890ff",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <AntTitle level={1}>Steam Reviews Scraper</AntTitle>

      {/* Scraper Controls */}
      <Card title="Scrape Steam Reviews" style={{ marginBottom: "24px" }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Number of games (max {steamApps.length}):</Text>
            <Input
              type="number"
              value={numberOfGames}
              onChange={(e: any) =>
                setNumberOfGames(parseInt(e.target.value) || 1)
              }
              max={steamApps.length}
              min={1}
              style={{ width: "120px", margin: "0 8px" }}
            />
          </Col>
          <Col>
            <Text strong>Reviews per game (max {MAX_REVIEWS_PER_GAME}):</Text>
            <Input
              type="number"
              value={numberOfReviewsPerGame}
              onChange={(e: any) =>
                setNumberOfReviewsPerGame(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              max={MAX_REVIEWS_PER_GAME}
              min={1}
              style={{ width: "120px", margin: "0 8px" }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleScrapeMultipleGames}
              loading={scrapingStatus.isLoading}
              disabled={scrapingStatus.isLoading}
            >
              {scrapingStatus.isLoading ? "Scraping..." : "Generate CSV"}
            </Button>
          </Col>
        </Row>

        {scrapingStatus.isLoading && (
          <div style={{ marginTop: "16px" }}>
            <Progress percent={Math.floor((elapsedTime / 30) * 100)} />
            <Text>{scrapingStatus.message}</Text>
            <br />
            <Text>Time elapsed: {formatElapsedTime(elapsedTime)}</Text>
          </div>
        )}

        {!scrapingStatus.isLoading && scrapingStatus.message && (
          <div style={{ marginTop: "16px" }}>
            <Text type="success" strong style={{ fontSize: "16px" }}>
              {scrapingStatus.message}
            </Text>
            {scrapingStatus.totalTime > 0 && (
              <div>
                <Text>
                  Total time: {formatElapsedTime(scrapingStatus.totalTime)}
                </Text>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Statistics */}
      {steamReviewsData.reviews?.length > 0 && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Reviews"
                value={steamReviewsData.length}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Positive Reviews"
                value={
                  steamReviewsData.reviews?.filter((r) => r.recommended).length
                }
                prefix={<LikeOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Negative Reviews"
                value={
                  steamReviewsData.reviews?.filter((r) => !r.recommended).length
                }
                prefix={<DislikeOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg Hours Played"
                value={
                  steamReviewsData.reviews?.length > 0
                    ? (
                        steamReviewsData.reviews.reduce(
                          (acc, r) => acc + r.hoursPlayed,
                          0
                        ) / steamReviewsData.reviews.length
                      ).toFixed(1)
                    : 0
                }
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      {steamReviewsData.reviews?.length > 0 && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={12}>
            <Card title="Review Sentiment Distribution">
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Doughnut
                  data={reviewsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Hours Played by Review">
              <div style={{ height: "300px" }}>
                <Bar
                  data={hoursPlayedData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Hours Played",
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Reviews List */}
      <Card title="Steam Reviews">
        <List
          dataSource={steamReviewsData.reviews || []}
          renderItem={(review: any, index: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      review.recommended ? (
                        <LikeOutlined />
                      ) : (
                        <DislikeOutlined />
                      )
                    }
                    style={{
                      backgroundColor: review.recommended
                        ? "#52c41a"
                        : "#ff4d4f",
                    }}
                  />
                }
                title={
                  <Space>
                    <Tag color={review.recommended ? "green" : "red"}>
                      {review.recommended
                        ? "👍 Recommended"
                        : "👎 Not Recommended"}
                    </Tag>
                    <Text type="secondary">
                      {review.hoursPlayed.toFixed(1)} hrs played
                    </Text>
                    <Text type="secondary">{timeAgo(review.postedAt)}</Text>
                  </Space>
                }
                description={review.reviewText}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default SteamReviewsPage;

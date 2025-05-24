import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Image,
  List,
  Row,
  Col,
  Statistic,
  Progress,
} from "antd";
import {
  ReloadOutlined,
  GlobalOutlined,
  CalendarOutlined,
  LinkOutlined,
  PieChartOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
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
import { analyzeSentiment, SentimentResult } from "../utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Title: AntTitle, Text, Paragraph } = Typography;

interface HeadlinesData {
  text: string;
  link: string;
  category: string;
  publishedAt: string;
  image?: string;
}

interface ArticleData {
  articleImg: string;
  articleText: string;
  articleCatagory: string;
}

interface FullArticleData {
  text: string;
  link: string;
  category: string;
  publishedAt: string;
  image?: string;
  headline: string;
  sentiment: SentimentResult;
}

const NewsScraperPage = () => {
  const [headlinesData, setHeadlinesData] = useState<HeadlinesData[]>([]);
  const [fullArticlesData, setFullArticlesData] = useState<FullArticleData[]>(
    []
  );

  const [loading, setLoading] = useState(false);

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

  const getHeadlines = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const getArticleDetails = async (url: string): Promise<ArticleData> => {
    try {
      const response = await axios.post(`${API_URL}scrapeCnaArticle`, {
        url,
      });

      return response.data.data;
    } catch (e) {
      console.error("error getting headlines", e);
      throw e;
    }
  };

  const generateArticleObject = async () => {
    const articleArray: FullArticleData[] = [];

    setLoading(true);
    for (const headline of headlinesData) {
      if (headline.link) {
        const articleData = await getArticleDetails(headline.link);
        const fullArticleData: FullArticleData = {
          headline: headline.text,
          category: headline.category || articleData.articleCatagory,
          publishedAt: headline.publishedAt,
          link: headline.link,
          text: articleData.articleText,
          image: articleData.articleImg,
          sentiment: analyzeSentiment(articleData.articleText),
        };
        articleArray.push(fullArticleData);
      }
    }

    setLoading(false);
    setFullArticlesData(articleArray);
  };

  useEffect(() => {
    getHeadlines();
  }, []);

  useEffect(() => {
    if (headlinesData.length > 0) {
      generateArticleObject();
    }
  }, [headlinesData]);

  const generateBackgroundColors = (count: number): string[] => {
    const colors: string[] = [];

    while (colors.length < count) {
      const color = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`;

      if (!isTooLight(color)) {
        colors.push(color);
      }
    }

    return colors;
  };

  const isTooLight = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.9;
  };

  const getCategoryData = () => {
    const categoryCount: { [key: string]: number } = {};
    fullArticlesData.forEach((headline) => {
      categoryCount[headline.category] =
        (categoryCount[headline.category] || 0) + 1;
    });

    return {
      labels: Object.keys(categoryCount),
      datasets: [
        {
          data: Object.values(categoryCount),
          backgroundColor: generateBackgroundColors(
            Object.keys(categoryCount).length
          ),
          borderWidth: 0,
        },
      ],
    };
  };

  const getSentimentData = () => {
    const sentimentCount = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    fullArticlesData.forEach((article) => {
      sentimentCount[article.sentiment.label]++;
    });

    return {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          data: [
            sentimentCount.positive,
            sentimentCount.negative,
            sentimentCount.neutral,
          ],
          backgroundColor: ["#52c41a", "#ff4d4f", "#faad14"],
          borderWidth: 0,
        },
      ],
    };
  };

  const getTimeDistributionData = () => {
    const timeRanges = {
      "Last Hour": 0,
      "1-6 Hours": 0,
      "6-24 Hours": 0,
      Older: 0,
    };

    const now = Date.now();
    fullArticlesData.forEach((headline) => {
      const publishedTime = new Date(headline.publishedAt).getTime();
      const diffHours = (now - publishedTime) / (1000 * 60 * 60);

      if (diffHours <= 1) timeRanges["Last Hour"]++;
      else if (diffHours <= 6) timeRanges["1-6 Hours"]++;
      else if (diffHours <= 24) timeRanges["6-24 Hours"]++;
      else timeRanges["Older"]++;
    });

    return {
      labels: Object.keys(timeRanges),
      datasets: [
        {
          label: "Number of Articles",
          data: Object.values(timeRanges),
          backgroundColor: "#1890ff",
          borderColor: "#1890ff",
          borderWidth: 1,
        },
      ],
    };
  };

  const getCategoryColors = (category: string) => {
    const colors: { [key: string]: string } = {
      Technology: "blue",
      Business: "",
      Environment: "lime",
      Sports: "orange",
      Health: "red",
      Politics: "purple",
      Science: "cyan",
      Entertainment: "magenta",
    };
    return colors[category] || "default";
  };

  const getSentimentIcon = (sentiment: SentimentResult) => {
    switch (sentiment.label) {
      case "positive":
        return <SmileOutlined style={{ color: "#52c41a" }} />;
      case "negative":
        return <FrownOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <MehOutlined style={{ color: "#faad14" }} />;
    }
  };

  const getSentimentColor = (sentiment: SentimentResult) => {
    switch (sentiment.label) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      default:
        return "warning";
    }
  };

  const averageSentiment =
    fullArticlesData.length > 0
      ? fullArticlesData.reduce(
          (sum, article) => sum + article.sentiment.score,
          0
        ) / fullArticlesData.length
      : 0;

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <AntTitle level={1}>
          News Headlines Scraper with Sentiment Analysis
        </AntTitle>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={getHeadlines}
          loading={loading}
          size="large"
        >
          Update News
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Articles"
              value={fullArticlesData.length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Categories"
              value={new Set(fullArticlesData.map((h) => h.category)).size}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Positive News"
              value={
                fullArticlesData.filter((a) => a.sentiment.label === "positive")
                  .length
              }
              prefix={<SmileOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Negative News"
              value={
                fullArticlesData.filter((a) => a.sentiment.label === "negative")
                  .length
              }
              prefix={<FrownOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Neutral News"
              value={
                fullArticlesData.filter((a) => a.sentiment.label === "neutral")
                  .length
              }
              prefix={<MehOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg Sentiment"
              value={averageSentiment.toFixed(2)}
              prefix={
                averageSentiment > 0.1 ? (
                  <SmileOutlined style={{ color: "#52c41a" }} />
                ) : averageSentiment < -0.1 ? (
                  <FrownOutlined style={{ color: "#ff4d4f" }} />
                ) : (
                  <MehOutlined style={{ color: "#faad14" }} />
                )
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      {fullArticlesData.length > 0 && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={8}>
            <Card title="News Categories Distribution">
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Doughnut
                  data={getCategoryData()}
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
          <Col span={8}>
            <Card title="Sentiment Analysis Distribution">
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Doughnut
                  data={getSentimentData()}
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
          <Col span={8}>
            <Card title="Articles by Time Published">
              <div style={{ height: "300px" }}>
                <Bar
                  data={getTimeDistributionData()}
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
                          text: "Number of Articles",
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

      {/* News Headlines List */}
      <Card title="Latest Headlines with Sentiment Analysis">
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={fullArticlesData}
          renderItem={(headline) => (
            <List.Item>
              <Card
                hoverable
                cover={
                  headline.image && (
                    <Image
                      alt={headline.text}
                      src={headline.image}
                      height={200}
                      style={{ objectFit: "cover" }}
                      preview={false}
                    />
                  )
                }
                actions={[
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    onClick={() => window.open(headline.link, "_blank")}
                  >
                    Read More
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Tag color={getCategoryColors(headline.category)}>
                          {headline.category}
                        </Tag>
                        <Tag
                          color={getSentimentColor(headline.sentiment)}
                          icon={getSentimentIcon(headline.sentiment)}
                        >
                          {headline.sentiment.label.toUpperCase()} (
                          {headline.sentiment.confidence}%)
                        </Tag>
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.4",
                          textWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        {headline.headline}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: "1.4",
                          textWrap: "wrap",
                          color: "#666",
                        }}
                      >
                        {headline.text.length > 150
                          ? headline.text.slice(0, 150) + "..."
                          : headline.text}
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <Text strong style={{ fontSize: "11px" }}>
                          Sentiment Score:{" "}
                        </Text>
                        <Progress
                          percent={Math.abs(headline.sentiment.score) * 100}
                          size="small"
                          status={
                            headline.sentiment.label === "positive"
                              ? "success"
                              : headline.sentiment.label === "negative"
                              ? "exception"
                              : "active"
                          }
                          format={() => `${headline.sentiment.score}`}
                          style={{ marginTop: "4px" }}
                        />
                      </div>
                    </div>
                  }
                  description={
                    <Space>
                      <CalendarOutlined />
                      <Text type="secondary">
                        {timeAgo(headline.publishedAt)}
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default NewsScraperPage;

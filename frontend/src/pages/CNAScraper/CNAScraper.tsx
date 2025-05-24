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
} from "antd";
import {
  ReloadOutlined,
  GlobalOutlined,
  CalendarOutlined,
  LinkOutlined,
  PieChartOutlined,
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

  const backgroundColor = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#dda0dd",
    "#98d8c8",
    "#6c5ce7",
  ];

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
      Business: "green",
      Environment: "lime",
      Sports: "orange",
      Health: "red",
      Politics: "purple",
      Science: "cyan",
      Entertainment: "magenta",
    };
    return colors[category] || "default";
  };

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
        <AntTitle level={1}>News Headlines Scraper</AntTitle>
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
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Articles"
              value={fullArticlesData.length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Categories"
              value={new Set(fullArticlesData.map((h) => h.category)).size}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Images"
              value={fullArticlesData.filter((h) => h.image).length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Recent (< 6hrs)"
              value={
                fullArticlesData.filter((h) => {
                  const diffHours =
                    (Date.now() - new Date(h.publishedAt).getTime()) /
                    (1000 * 60 * 60);
                  return diffHours <= 6;
                }).length
              }
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      {fullArticlesData.length > 0 && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={12}>
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
          <Col span={12}>
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
      <Card title="Latest Headlines">
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={fullArticlesData}
          renderItem={(headline) => (
            <List.Item>
              <Card
                hoverable
                cover={
                  headline.image && (
                    <>
                      <Image
                        alt={headline.text}
                        src={headline.image}
                        height={200}
                        style={{ objectFit: "cover" }}
                        preview={false}
                      />
                    </>
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
                      <Tag
                        color={getCategoryColors(headline.category)}
                        style={{ marginBottom: "8px" }}
                      >
                        {headline.category}
                      </Tag>
                      <div
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.4",
                          textWrap: "wrap",
                        }}
                      >
                        {headline.headline}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: "1.4",
                          textWrap: "wrap",
                        }}
                      >
                        {headline.text.length > 100
                          ? headline.text.slice(0, 100) + "..."
                          : headline.text}
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

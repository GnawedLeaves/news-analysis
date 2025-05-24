import React, { useState, useEffect } from "react";
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

const NewsScraperPage = () => {
  const [headlinesData, setHeadlinesData] = useState<HeadlinesData[]>([]);
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

  useEffect(() => {
    getHeadlines();
  }, []);

  // Chart data for news categories
  const getCategoryData = () => {
    const categoryCount: { [key: string]: number } = {};
    headlinesData.forEach((headline) => {
      categoryCount[headline.category] =
        (categoryCount[headline.category] || 0) + 1;
    });

    return {
      labels: Object.keys(categoryCount),
      datasets: [
        {
          data: Object.values(categoryCount),
          backgroundColor: [
            "#ff6b6b",
            "#4ecdc4",
            "#45b7d1",
            "#96ceb4",
            "#ffeaa7",
            "#dda0dd",
            "#98d8c8",
            "#6c5ce7",
          ],
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
    headlinesData.forEach((headline) => {
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
              value={headlinesData.length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Categories"
              value={new Set(headlinesData.map((h) => h.category)).size}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="With Images"
              value={headlinesData.filter((h) => h.image).length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Recent (< 6hrs)"
              value={
                headlinesData.filter((h) => {
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
      {headlinesData.length > 0 && (
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
          dataSource={headlinesData}
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
                      <div style={{ fontSize: "16px", lineHeight: "1.4" }}>
                        {headline.text}
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

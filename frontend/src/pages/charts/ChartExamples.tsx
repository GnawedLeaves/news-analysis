import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import {
  Bar,
  Bubble,
  Doughnut,
  Pie,
  PolarArea,
  Radar,
  Scatter,
} from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale
);

const ChartExamples = () => {
  const data = {
    labels: ["Apples,", "Bananas", "Pears", "Cookies"],
    datasets: [
      {
        label: "my dataset",
        data: [24, 53, 110, 82],
        backgroundColor: ["#f87171", "#facc15", "#34d399", "aquamarine"],
      },
    ],
  };

  const options = {
    responsive: true,
    // maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Graph" },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const scatterData = {
    datasets: [
      {
        label: "Scatter Dataset",
        data: [
          {
            x: -10,
            y: 0,
          },
          {
            x: 0,
            y: 10,
          },
          {
            x: 10,
            y: 5,
          },
          {
            x: 0.5,
            y: 5.5,
          },
        ],
        backgroundColor: ["#f87171", "#facc15", "#34d399", "aquamarine"],
      },
    ],
  };

  const scatterConfig = {
    type: "scatter",
    data: data,
    options: {
      scales: {
        x: {
          type: "linear",
          position: "bottom",
        },
      },
    },
  };

  const bubbleData = {
    datasets: [
      {
        label: "First Dataset",
        data: [
          {
            x: 20,
            y: 30,
            r: 15,
          },
          {
            x: 0,
            y: 300,
            r: 30,
          },
          {
            x: 40,
            y: 10,
            r: 10,
          },
        ],
        backgroundColor: ["#f87171", "#facc15", "#34d399", "aquamarine"],
      },
    ],
  };

  return (
    <div style={{ display: "flex", gap: "32px", flexDirection: "column" }}>
      Chart main
      <div style={{ width: "1000px", height: "500px" }}>
        Pie Chart
        <Pie data={data} options={options} />
      </div>
      <div style={{ width: "1000px", height: "500px" }}>
        Bar Chart
        <Bar data={data} options={options} />
      </div>
      <div style={{ width: "1000px", height: "500px" }}>
        Vertical bar Chart
        <Bar
          data={data}
          options={{
            ...options,
            indexAxis: "y",
          }}
        />
      </div>
      <div style={{ width: "1000px", height: "500px" }}>
        Doughnut Chart
        <Doughnut data={data} options={options} />
      </div>{" "}
      <div style={{ width: "1000px", height: "500px" }}>
        Radar Chart
        <Radar data={data} options={options} />
      </div>{" "}
      <div style={{ width: "1000px", height: "500px" }}>
        PolarArea Chart
        <PolarArea data={data} options={options} />
      </div>
      <div style={{ width: "1000px", height: "500px" }}>
        Bubble Chart
        <Bubble data={bubbleData} options={options} />
      </div>{" "}
      <div style={{ width: "1000px", height: "500px" }}>
        Scatter Chart
        <Scatter data={scatterData} options={options} />
      </div>
    </div>
  );
};

export default ChartExamples;

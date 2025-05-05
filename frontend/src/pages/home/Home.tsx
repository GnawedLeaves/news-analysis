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
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  BarElement
);

const Home = () => {
  const navigate = useNavigate();
  const data = {
    labels: ["Apples", "Bananas", "Cherries"],
    datasets: [
      {
        label: "Inventory",
        data: [12, 19, 7],
        backgroundColor: ["#f87171", "#facc15", "#34d399"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Fruit Inventory",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      Home
      <button
        onClick={() => {
          navigate("/charts");
        }}
      >
        Go to charts
      </button>
      <Bar data={data} options={options} />
    </>
  );
};

export default Home;

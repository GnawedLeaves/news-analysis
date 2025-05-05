import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../routes";
const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      Home
      <button
        onClick={() => {
          navigate(APP_ROUTES.chartExamples);
        }}
      >
        Go to charts
      </button>
    </>
  );
};

export default Home;

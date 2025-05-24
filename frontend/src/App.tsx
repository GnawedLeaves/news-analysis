import { Suspense } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import ChartExamples from "./pages/charts/ChartExamples";
import { APP_ROUTES } from "./routes";
import NewsScraperPage from "./pages/CNAScraper/CNAScraper";
import SteamReviewsPage from "./pages/steamReviews/SteamReviews";

function App() {
  return (
    <BrowserRouter>
      <Suspense>
        <Routes>
          <Route path="/*" element={<NewsScraperPage />} />
          <Route path={APP_ROUTES.home} element={<Home />} />
          <Route path={APP_ROUTES.chartExamples} element={<ChartExamples />} />
          <Route path={APP_ROUTES.steamReview} element={<SteamReviewsPage />} />
          <Route path={APP_ROUTES.cna} element={<NewsScraperPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

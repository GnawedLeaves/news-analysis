import { Suspense } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import ChartMain from "./pages/charts/ChartMain";

function App() {
  return (
    <BrowserRouter>
      <Suspense>
        <Routes>
          <Route path="/*" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/charts" element={<ChartMain />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

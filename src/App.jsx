import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import MainBody from "./MainBody";

import Privacy from "../pages/Privacy.jsx";
import Terms from "../pages/Terms.jsx";
import Disclaimer from "../pages/Disclaimer.jsx";

export default function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<MainBody />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
      </Routes>

      <Footer />
    </Router>
  );
}

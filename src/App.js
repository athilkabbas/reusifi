import logo from "./logo.svg";
import "./App.css";
import AddDress from "./pages/AddDress";
import Layout from "./pages/Layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* <Route path="blogs" element={<Blogs />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

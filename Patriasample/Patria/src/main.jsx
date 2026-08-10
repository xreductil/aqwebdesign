import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../css/bootstrap.min.css";
import "../css/all.min.css";
import "../css/style.css";
import "./styles/style.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

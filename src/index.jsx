import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gta-vi-theme.css";
import "./App.css"; // App-specific styles, load after the theme
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);

/** Entry point: loads the styles and mounts the app into #root of index.html. */

import { createRoot } from "react-dom/client";
// Order matters: each stylesheet overrides the ones before it
import "bootstrap/dist/css/bootstrap.min.css";
import "./gta-vi-theme.css";
import "./App.css";
import App from "./App";

// "!" is safe: index.html always contains #root
createRoot(document.getElementById("root")!).render(<App />);

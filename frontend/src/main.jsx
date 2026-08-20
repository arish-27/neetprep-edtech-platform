import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GlobalBackground } from "@/components/motion/GlobalBackground";
import "./styles/index.css";

const base = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/+$/, "") : "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={base || undefined} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GlobalBackground />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

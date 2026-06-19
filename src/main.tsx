import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/newsreader/latin-400.css";
import "@fontsource/newsreader/latin-500.css";
import "@fontsource/newsreader/latin-600.css";
import "@fontsource/newsreader/latin-700.css";
import App from "./App";
import "./styles.css";

const isVNextRoute = window.location.pathname.replace(/\/$/, "").endsWith("/vnext");
const VNextApp = React.lazy(() => import("./vnext/VNextApp"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isVNextRoute ? (
      <React.Suspense fallback={null}>
        <VNextApp />
      </React.Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

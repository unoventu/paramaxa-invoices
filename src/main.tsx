import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/global.css";

// Surface any uncaught error (incl. Android WebView crashes) as visible text
// instead of a white screen. Reachable from anywhere via ?debug=1.
if (location.search.includes("debug=1")) {
  import("eruda").then((m) => m.default.init());
}

window.addEventListener("error", (e) => {
  console.error("[window.error]", e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

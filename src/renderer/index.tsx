import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Layout from "./layout";

let vscode = acquireVsCodeApi();

const App = () => {
  const [debug, setDebug] = React.useState(false);

  if (!vscode) {
    try {
      vscode = acquireVsCodeApi();
    } catch (error) {
      vscode = (window as any).acquireVsCodeApi();
    }
  }

  return (
    <React.StrictMode>
      <Router basename="/index.html">
        <Layout vscode={vscode} debug={debug} setDebug={setDebug} />
      </Router>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <App />
);

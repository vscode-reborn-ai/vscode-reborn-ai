import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Layout from "./layout";
import { store } from "./store";

let vscode = acquireVsCodeApi();

const App = () => {
  if (!vscode) {
    try {
      vscode = acquireVsCodeApi();
    } catch (error) {
      vscode = (window as any).acquireVsCodeApi();
    } finally {
      if (!(window as any).vscode) {
        (window as any).vscode = vscode;
      }
    }
  }

  return (
    <React.StrictMode>
      <Provider store={store}>
        <Router basename="/index.html">
          <Layout vscode={vscode} />
        </Router>
      </Provider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <App />
);

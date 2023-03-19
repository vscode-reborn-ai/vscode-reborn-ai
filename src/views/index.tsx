import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "../../styles/main.css";
import Tabs from "../components/Tabs";
import Chats from "./chats";
import Prompts from "./prompts";

const App = () => {
  let vscode;
  try {
    // Try to acquire VS Code API for the first time
    vscode = acquireVsCodeApi();
  } catch (error) {
    // If an instance of the VS Code API has already been acquired,
    // use the existing VS Code API
    vscode = (window as any)?.vscode;
  }

  return (
    <React.StrictMode>
      <Router basename="/index.html">
        <Tabs />
        <Routes>
          <Route path="/prompts" element={<Prompts vscode={vscode} />} />
          <Route path="/" element={<Chats vscode={vscode} />} />
          {/* <Route path="/options" element={<Options vscode={vscode} />} /> */}
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <App />
);

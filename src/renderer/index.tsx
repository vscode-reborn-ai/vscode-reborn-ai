import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "../../styles/main.css";
import Tabs from "./components/Tabs";
import Actions from "./views/actions";
import Chat from "./views/chat";
import Prompts from "./views/prompts";

const App = () => {
  const vscode = acquireVsCodeApi();

  const postMessage = (type: string, value?: any, language?: string) => {
    vscode.postMessage({
      type,
      value,
      language,
    });
  };

  return (
    <React.StrictMode>
      <Router basename="/index.html">
        <Tabs />
        <Routes>
          <Route
            path="/prompts"
            element={<Prompts postMessage={postMessage} />}
          />
          <Route
            path="/actions"
            element={<Actions postMessage={postMessage} />}
          />
          <Route path="/" element={<Chat postMessage={postMessage} />} />
          {/* <Route path="/options" element={<Options postMessage={postMessage} />} /> */}
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <App />
);

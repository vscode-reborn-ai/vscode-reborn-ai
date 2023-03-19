import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "../../styles/main.css";
import Tabs from "./components/Tabs";
import Chats from "./views/chats";
import Prompts from "./views/prompts";

const App = () => {
  return (
    <React.StrictMode>
      <Router basename="/index.html">
        <Tabs />
        <Routes>
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/" element={<Chats />} />
          {/* <Route path="/options" element={<Options />} /> */}
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <App />
);

import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { QuestTracker } from "../components/QuestTracker";
import PassiveTreeWindow from "../components/PassiveTreeWindow";
import "../components/QuestTracker.css";
import "../components/PassiveTreeWindow.css";

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
          <div className="app">
            <QuestTracker />
          </div>
        } />
        <Route path="/passive-tree" element={<PassiveTreeWindow />} />
      </Routes>
    </HashRouter>
  );
};

export default App;

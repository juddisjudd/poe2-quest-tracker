import React from "react";
import { QuestTracker } from "../components/QuestTracker";
import "../components/QuestTracker.css";

const App: React.FC = () => {
  return (
    <div className="app">
      <QuestTracker />
    </div>
  );
};

export default App;

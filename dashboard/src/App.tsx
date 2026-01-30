import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { ReportDetail } from "./components/ReportDetail";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report/:reportId" element={<ReportDetail />} />
      </Routes>
    </Router>
  );
};

export default App;

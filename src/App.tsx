import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScenarioSelect from "@/pages/ScenarioSelect";
import OnSiteJudgment from "@/pages/OnSiteJudgment";
import ResultReview from "@/pages/ResultReview";
import TraineeProfile from "@/pages/TraineeProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScenarioSelect />} />
        <Route path="/scenario/:scenarioId" element={<OnSiteJudgment />} />
        <Route path="/review/:id" element={<ResultReview />} />
        <Route path="/trainee/:traineeId" element={<TraineeProfile />} />
      </Routes>
    </Router>
  );
}

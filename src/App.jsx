import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Login from "./components/auth/login-form";
import Signup from "./components/auth/signup-form";
import Layout from "./components/layout";
import { ProtectedRoute, AdminRoute } from "./scripts/auth.jsx";
import FantasyTeamsList from "./components/fantasy-teams/fantasy-teams-list.jsx";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  Outlet,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Outlet />}>
          <Route index element={<h1>404: Page not found</h1>} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="*" element={<h1>404: Page not found</h1>} />
        </Route>

        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            {" "}
            {/*only logged in users*/}
            <Route path="/fantasyTeams" element={<Outlet />}>
              <Route index element={<FantasyTeamsList />} />
              <Route path="view/:teamId" element={<h1>Team View</h1>} />
              <Route path="edit/:teamId" element={<h1>team builder</h1>} />
              <Route path="new-team" element={<h1>team builder</h1>} />
            </Route>
            <Route path="/fantasyLeagues" element={<Outlet />}>
              <Route index element={<h1>Leagues List</h1>} />
              <Route path="view/:leagueId" element={<h1>League View</h1>} />
            </Route>
            <Route path="/help" element={<h1>FAQs, Points, etc.</h1>} />
            <Route path="*" element={<h1>404: Page not found</h1>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

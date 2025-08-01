import React, { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
const FantasyTeamsList = () => {
  const [apiError, setApiError] = useState("");
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const fetchFantasyTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/get-fantasy-teams",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      const data = await response.json();
      const fantasyTeams = data.teams;
      const message = data.message; //update error state to this
      setFantasyTeams(fantasyTeams);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };
  useEffect(() => {
    fetchFantasyTeams();
  }, []);

  return (
    <div>
      <h5>Teams Found: {`${fantasyTeams.length}/3`}</h5>
      <div>
        {" "}
        {/* teams div */}
        <ul>
          {fantasyTeams.map((team, index) => {
            const doublePointsDriver = team.f1Drivers.find(
              (driver) => driver.doublePoints
            );
            return (
              <li key={team._id || index}>
                <div>
                  {" "}
                  {/* team div */}
                  <h3>Team Number: {index + 1}</h3>
                  <span>Fantasy Team Name: {team.fantasyTeamName}</span>
                  <span>Budget Left: {team.remainingBudget}</span>
                  <div>
                    {" "}
                    {/* driver with double points div. need to populate in backend to show pictures and stuff */}
                    <h3>Double Points: {doublePointsDriver.driverSurname}</h3>
                  </div>
                  <Link to={`/fantasyTeams/view/${team._id}`}>View Team</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {apiError && <p className="mb-2 text-sm text-red-600">{apiError}</p>}
    </div>
  );
};

export default FantasyTeamsList;

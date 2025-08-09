import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
const fantasyTeamsBuilder = ({ initialFantasyTeam }) => {
  const [allDrivers, setAllDrivers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [includedDrivers, setIncludedDrivers] = useState(
    initialFantasyTeam.f1Drivers || []
  );
  const [doublePointsDriverId, setDoublePointsDriverId] = useState(
    initialFantasyTeam.f1Drivers.find(
      (driver) => driver.doublePoints === true
    ) || null
  );
  const [includedTeams, setIncludedTeams] = useState(
    initialFantasyTeam.f1Teams || []
  );
  const [fantasyTeamName, setFantasyTeamName] = useState(
    initialFantasyTeam.fantasyTeamName || ""
  );
  const [budgetLeft, setBudgetLeft] = useState(
    initialFantasyTeam.remainingBudget || 100
  );
  const [transfersLeft, setTransfersLeft] = useState(
    initialFantasyTeam.remainingTransfers || 3
  );
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);

  const { teamId } = useParams();

  const fetchF1Drivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/f1drivers", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const driverData = await response.json();
      setAllDrivers(driverData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };
  const fetchF1Teams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/f1teams", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const teamData = await response.json();
      setAllTeams(teamData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };

  const fetchFantasyTeam = async () => {
    if (!teamId || !initialFantasyTeam) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/get-fantasy-team/" + teamId,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const fantasyTeamData = await response.json();
      /*for (let driver in fantasyTeamData.f1Drivers) {
        addDriver(driver);
      }
      for (let team in fantasyTeamData.f1Teams) {
        addTeam(team);
      }*/ // cannot do this. this would deduct transfers from the transfers allowed falsely. Could add a flag to avoid but best practice is to just use the fetched fantasyteam
      //set budget, remaining transfers, team name and other states
      setAllTeams(teamData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };
  const isDriverIncluded = (driverId) =>
    includedDrivers.some((d) => d.driverId === driverId);
  const isTeamIncluded = (teamId) =>
    includedTeams.some((t) => t.teamId === teamId);

  const canAddDriver = (driver) => {
    if (isDriverIncluded(driver.driverId._id)) return false;
    if (transfersLeft <= 0) return false; //we need a way to improve UI. We need to show why a user can't add a driver, not just not render the button
    if (includedDrivers.length() >= 5) return false;
    return budgetLeft - driver.driverId.driverCost >= 0;
  };
  const canAddTeam = (team) => {
    if (isDriverIncluded(team.teamId._id)) return false;
    if (transfersLeft <= 0) return false;
    if (includedTeams.length() >= 5) return false;
    return budgetLeft - driver.teamId.teamCost >= 0;
  };

  const addDriver = (driver) => {
    if (!canAddDriver(driver)) return; //shouldn't really happen, we don't render the button if not
    setIncludedDrivers((prev) => [...prev, driver]);
    setBudgetLeft((prev) => prev - driver.driverId.driverCost);
    setTransfersLeft((prev) => prev - 1);
  };
  const addTeam = (team) => {
    if (!canAddTeam(team)) return; //shouldn't really happen, we don't render the button if not
    setIncludedTeams((prev) => [...prev, team]);
    setBudgetLeft((prev) => prev - team.teamId.teamCost);
    setTransfersLeft((prev) => prev - 1);
  };

  const removeDriver = (driver) => {
    setIncludedDrivers((prev) =>
      prev.filter((d) => d.driverId._id !== driver.driverId._id)
    );
    if (driver.driverId._id === doublePointsDriverId)
      setDoublePointsDriverId(null);
    setBudgetLeft((prev) => prev + driver.driverId.driverCost);
  };
  const removeTeam = (team) => {
    setIncludedTeams((prev) =>
      prev.filter((t) => t.teamId._id !== team.teamId._id)
    );
    setBudgetLeft((prev) => prev + team.teamId.teamCost);
  };

  //need saving payload mechanic

  return <div>fantasyTeamsBuilder</div>;
};

export default fantasyTeamsBuilder;

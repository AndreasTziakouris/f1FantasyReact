import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
const FantasyTeamsBuilder = ({ mode }) => {
  //console.log("mounted");
  const { teamId } = useParams();
  const { state } = useLocation();

  const initialFantasyTeam = state?.team;
  const [allDrivers, setAllDrivers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [includedDrivers, setIncludedDrivers] = useState(
    initialFantasyTeam?.f1Drivers?.map((driver) => driver.driverId._id) ?? []
  );
  const [doublePointsDriverId, setDoublePointsDriverId] = useState(
    initialFantasyTeam?.f1Drivers?.find(
      (driver) => driver.doublePoints === true
    )?.driverId._id ?? null
  );

  const [includedTeams, setIncludedTeams] = useState(
    initialFantasyTeam?.f1Teams?.map((team) => team.teamId._id) ?? []
  );
  const [fantasyTeamName, setFantasyTeamName] = useState(
    initialFantasyTeam?.fantasyTeamName ?? ""
  );
  const [budgetLeft, setBudgetLeft] = useState(
    initialFantasyTeam?.remainingBudget ?? 100
  );
  const [transfersLeft, setTransfersLeft] = useState(
    initialFantasyTeam?.remainingTransfers ?? 3
  );
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState([]);
  const [activeTab, setActiveTab] = useState("drivers"); // UI-only tab state
  //driverId and teamId to driverDocs and teamDocs hash maps
  const driverById = useMemo(
    () => Object.fromEntries(allDrivers.map((d) => [d._id, d])),
    [allDrivers]
  );
  const teamById = useMemo(
    () => Object.fromEntries(allTeams.map((t) => [t._id, t])),
    [allTeams]
  );
  const initialDriverIdSet = new Set( //for transfers left logic in save
    initialFantasyTeam?.f1Drivers?.map((d) => d.driverId._id) ?? []
  );
  const initialTeamIdSet = new Set(
    initialFantasyTeam?.f1Teams?.map((t) => t.teamId._id) ?? []
  );
  const countTransfers = (finalIds, initialSet) => {
    let c = 0;
    for (const id of finalIds) if (!initialSet.has(id)) c++;
    return c;
  };
  const fetchF1Drivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/f1drivers",
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
      const driverData = await response.json();
      setAllDrivers(driverData);
      //console.log(driverData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };
  const fetchF1Teams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/f1teams",
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
      const teamData = await response.json();
      setAllTeams(teamData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };

  const isDriverIncluded = (driverId) =>
    includedDrivers.some((xId) => xId === driverId);
  const isTeamIncluded = (teamId) =>
    includedTeams.some((xId) => xId === teamId);

  const canAddDriver = (driverId) => {
    const driverDoc = driverById[driverId];
    if (isDriverIncluded(driverId)) return false;
    if (transfersLeft <= 0) return false; //we need a way to improve UI. We need to show why a user can't add a driver, not just not render the button
    if (includedDrivers.length >= 5) return false;
    return budgetLeft - driverDoc.driverCost >= 0;
  };
  const canAddTeam = (teamId) => {
    const teamDoc = teamById[teamId];
    if (isTeamIncluded(teamId)) return false;
    if (transfersLeft <= 0) return false;
    if (includedTeams.length >= 2) return false;
    return budgetLeft - teamDoc.teamCost >= 0;
  };

  const addDriver = (driverId) => {
    if (!canAddDriver(driverId)) return; //shouldn't really happen, we don't render the button if not
    const driverDoc = driverById[driverId];
    setIncludedDrivers((prev) => [...prev, driverId]);
    setBudgetLeft((prev) => prev - driverDoc.driverCost);
    //setTransfersLeft((prev) => prev - 1);
  };
  const addTeam = (teamId) => {
    if (!canAddTeam(teamId)) return; //shouldn't really happen, we don't render the button if not
    const teamDoc = teamById[teamId];
    setIncludedTeams((prev) => [...prev, teamId]);
    setBudgetLeft((prev) => prev - teamDoc.teamCost);
    //setTransfersLeft((prev) => prev - 1);
  };

  const removeDriver = (driverId) => {
    const driverDoc = driverById[driverId];
    setIncludedDrivers((prev) => prev.filter((xId) => xId !== driverId));
    if (driverId === doublePointsDriverId) {
      setDoublePointsDriverId(null);
    }
    setBudgetLeft((prev) => prev + driverDoc.driverCost);
  };
  const removeTeam = (teamId) => {
    const teamDoc = teamById[teamId];
    setIncludedTeams((prev) => prev.filter((xId) => xId !== teamId));
    setBudgetLeft((prev) => prev + teamDoc.teamCost);
  };

  const toggleDoublePoints = (driverId) => {
    if (!isDriverIncluded(driverId)) return;
    setDoublePointsDriverId((prev) => (prev === driverId ? null : driverId));
  };

  const saveTeam = async () => {
    try {
      //validation here
      const token = localStorage.getItem("token");
      setSaving(true);
      if (mode === "edit") {
        const driverTransfers = countTransfers(
          includedDrivers,
          initialDriverIdSet
        );
        const teamTransfers = countTransfers(includedTeams, initialTeamIdSet);
        const transfersMade = driverTransfers + teamTransfers;
        if (transfersMade > transfersLeft) {
          setValidationError((prev) => [
            ...prev,
            `Too many transfers (used ${transfersMade}, allowed ${transfersLeft})`,
          ]);
          setSaving(false);
          return;
        }
        setTransfersLeft((prev) => prev - transfersMade);
      }

      const newFantasyTeam = {
        fantasyTeamId: initialFantasyTeam?._id,
        fantasyTeamName: fantasyTeamName,
        f1Drivers: includedDrivers.map((driverId) => {
          const driverDoc = driverById[driverId];
          return {
            driverId: driverDoc._id,
            driverSurname: driverDoc.surname,
            doublePoints: doublePointsDriverId === driverId,
          };
        }),
        f1Teams: includedTeams.map((teamId) => {
          const teamDoc = teamById[teamId];
          return {
            teamId: teamDoc._id,
            teamName: teamDoc.name,
          };
        }),
        remainingBudget: budgetLeft,
        remainingTransfers: transfersLeft,
      };
      const response = await fetch(
        "http://localhost:3000/fantasyTeam/update-fantasy-team",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(newFantasyTeam),
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const data = await response.json();
      window.location.href = `/fantasyTeams/${data._id}`;
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchF1Drivers(), fetchF1Teams()]);
      setLoading(false);
    };
    load();
  }, []);

  const includedDriverSlots = [
    ...(includedDrivers || []),
    ...Array(5).fill(null),
  ].slice(0, 5);

  const includedTeamSlots = [
    ...(includedTeams || []),
    ...Array(2).fill(null),
  ].slice(0, 2);
  const placeholder = "https://via.placeholder.com/160x160.png?text=%20";
  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Insert team name"
          value={fantasyTeamName}
          onChange={(e) => setFantasyTeamName(e.target.value)}
        />
        <div>
          <span>Budget Left: {budgetLeft}</span>
          <span>Transfers Left: {transfersLeft}</span>
          <button
            onClick={saveTeam}
            disabled={
              saving ||
              includedDrivers.length !== 5 ||
              includedTeams.length !== 2
            }
          >
            {" "}
            {saving ? "Saving Team" : <b>Save Team</b>}{" "}
          </button>
        </div>
      </div>
      {apiError && <p className="mb-4 text-sm text-red-600">{apiError}</p>}
      {validationError && (
        <div>
          <ul>
            {validationError.map((error) => {
              return (
                <li>
                  <span className="mb-4 text-sm text-red-600">{error}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <section>
        {" "}
        {/*selected drivers*/}
        <div>
          {includedDriverSlots.map((driverId, i) => {
            if (!driverId) {
              return (
                <div
                  key={`empty-driver-${i}`}
                  className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                >
                  <img
                    src={placeholder}
                    alt="Empty slot"
                    className="h-16 w-16 rounded-full object-cover opacity-40"
                  />
                  <p className="mt-2 text-xs font-medium">Empty Driver</p>
                </div>
              );
            }
            const driverDoc = driverById[driverId] || null;
            if (!driverDoc) {
              return <h3>loading...</h3>;
            }
            console.log(driverById);
            const initial = `${
              driverDoc.name?.charAt(0) || ""
            }. ${driverDoc.surname?.toUpperCase()}`;
            return (
              <div
                key={driverDoc._id}
                className="relative flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
              >
                {doublePointsDriverId === driverId && (
                  <span className="absolute left-1 top-1 z-10 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                    2×
                  </span>
                )}

                <img
                  src={driverDoc.imageUrl || placeholder}
                  alt={initial}
                  className="h-32 w-full object-cover"
                />

                <div className="flex-1 px-2 py-1 text-center">
                  <p className="truncate text-sm font-bold text-gray-800">
                    {initial}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    ${driverDoc.driverCost} M
                  </p>
                </div>
              </div>
            );
          })}
        </div>{" "}
        {/*selected teams*/}
        <div className="grid grid-cols-2 gap-6">
          {includedTeamSlots.map((teamId, i) => {
            if (!teamId) {
              return (
                <div
                  key={`empty-team-${i}`}
                  className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                >
                  <img
                    src={placeholder}
                    alt="Empty team"
                    className="h-20 w-32 object-cover opacity-40"
                  />
                  <p className="mt-2 text-xs font-medium">Empty Team</p>
                </div>
              );
            }

            const teamDoc = teamById[teamId] || null;
            if (!teamDoc) {
              return <h3>loading...</h3>;
            }
            return (
              <div
                key={teamId}
                className="flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
              >
                <img
                  src={teamDoc.imageUrl || placeholder}
                  alt={teamDoc.name}
                  className="h-32 w-full object-cover"
                />
                <div className="flex-1 px-3 py-1">
                  <p className="truncate text-sm font-bold text-gray-800">
                    {teamDoc.fullName}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    ${teamDoc.teamCost} M
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        {/* driver and team insert/remove section*/}
        <div>
          <div>
            <button>Drivers</button>
            <span>{includedDrivers.length}/5</span>
          </div>
          <div>
            <button>Constructors</button>
            <span>{includedTeams.length}/2</span>
          </div>
        </div>
        {/*drivers list*/}
        <div>
          <h3 className="mb-2 font-semibold">All Drivers</h3>
          <ul>
            {allDrivers.map((driver, i) => {
              const isSelected = isDriverIncluded(driver._id);
              return (
                <li>
                  <div>
                    <article
                      key={driver._id}
                      className="rounded-2xl border p-3"
                    >
                      {driver.imageUrl && (
                        <img
                          src={driver.imageUrl}
                          alt={driver.surname}
                          className="mb-2 h-24 w-full rounded-xl object-cover"
                        />
                      )}
                      <div className="text-sm">
                        <div className="font-medium">
                          {driver.name} {driver.surname}
                        </div>
                        <div className="text-gray-500">
                          Cost: {driver.driverCost}
                        </div>
                      </div>
                      <button
                        className={`mt-2 w-full rounded-lg px-3 py-2 text-sm ${
                          isSelected
                            ? "bg-gray-200 text-gray-700"
                            : canAddDriver(driver._id)
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                        onClick={() =>
                          isSelected
                            ? removeDriver(driver._id)
                            : addDriver(driver._id)
                        }
                        disabled={!isSelected && !canAddDriver(driver._id)}
                      >
                        {isSelected ? "Remove" : "Add"}
                      </button>
                    </article>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {/*teams list*/}
        <div>
          {allTeams.map((team, i) => {
            const isSelected = isTeamIncluded(team._id);
            return (
              <article key={team._id}>
                {team.imageUrl && <img src={team.imageUrl}></img>}
                <div>
                  <span>{team.fullName}</span>
                  <span>{team.teamCost} M</span>
                </div>
                <button
                  onClick={() =>
                    isSelected ? removeTeam(team._id) : addTeam(team._id)
                  }
                  disabled={!isSelected && !canAddTeam(team._id)}
                >
                  {isSelected ? "Remove" : "Add"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default FantasyTeamsBuilder;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
const FantasyTeamView = () => {
  const [apiError, setApiError] = useState("");
  const [fantasyTeam, setFantasyTeam] = useState({});
  const { teamId } = useParams();

  const fetchFantasyTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/fantasyTeams/get-fantasy-team/${teamId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fetching data failed");
      }
      const data = await response.json();
      setFantasyTeam(data.team[0]);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };

  useEffect(() => {
    fetchFantasyTeam();
  }, [teamId]);
  useEffect(() => {
    console.log("Updated fantasyTeam:", remainingM);
  }, [fantasyTeam]);
  // ----------  helpers & derived values  ----------
  const BUDGET_CAP = 100;
  const remainingM = fantasyTeam ? fantasyTeam.remainingBudget : 0;
  const usedM = 100 - remainingM;
  const usedPct = (usedM / BUDGET_CAP) * 100;

  // Ensure 5 driver slots + 2 team slots
  const driverSlots = [
    ...(fantasyTeam?.f1Drivers ?? []),
    ...Array(5).fill(null),
  ].slice(0, 5);

  const teamSlots = [
    ...(fantasyTeam?.f1Teams ?? []),
    ...Array(2).fill(null),
  ].slice(0, 2);

  const placeholder = "https://via.placeholder.com/160x160.png?text=%20";

  // ----------  UI  ----------
  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* cost-cap bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <span>Cost Cap:</span>
          <span>
            ${usedM} M / {BUDGET_CAP} M
          </span>
        </div>
        <div className="h-2 w-full rounded bg-gray-200">
          <div
            className="h-full rounded bg-green-500 transition-[width]"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* drivers grid */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        {driverSlots.map((slot, i) => {
          if (!slot) {
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

          const d = slot.driverId;
          const costM = d.driverCost;
          const initial = `${
            d.name?.charAt(0) || ""
          }. ${d.surname?.toUpperCase()}`;

          return (
            <div
              key={d._id}
              className="relative flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
            >
              {slot.doublePoints && (
                <span className="absolute left-1 top-1 z-10 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                  2×
                </span>
              )}

              <img
                src={d.imageUrl || placeholder}
                alt={initial}
                className="h-32 w-full object-cover"
              />

              <div className="flex-1 px-2 py-1 text-center">
                <p className="truncate text-sm font-bold text-gray-800">
                  {initial}
                </p>
                <p className="text-xs font-medium text-gray-600">${costM} M</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* teams grid */}
      <div className="grid grid-cols-2 gap-6">
        {teamSlots.map((slot, i) => {
          if (!slot) {
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

          const t = slot.teamId;
          const costM = t.teamCost;

          return (
            <div
              key={t._id}
              className="flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
            >
              <img
                src={t.imageUrl || placeholder}
                alt={t.name}
                className="h-32 w-full object-cover"
              />
              <div className="flex-1 px-3 py-1">
                <p className="truncate text-sm font-bold text-gray-800">
                  {t.name}
                </p>
                <p className="text-xs font-medium text-gray-600">${costM} M</p>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to={`/fantasyTeams/edit/${teamId}`}
        className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
      >
        Edit Team
      </Link>
      {apiError && <p className="mt-6 text-sm text-red-600">{apiError}</p>}
    </div>
  );
};

export default FantasyTeamView;

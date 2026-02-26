import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./core/api";
import type { TurbineDto } from "./generated-ts-client";

function App() {
  const [turbines, setTurbines] = useState<TurbineDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.turbines
        .getAll()
        .then(setTurbines)
        .catch((e) => setError(String(e)));
  }, []);

  return (
      <div style={{ padding: 16 }}>
        <h2>Turbines</h2>

        {error && <div style={{ marginTop: 12 }}>Error: {error}</div>}

        <ul style={{ marginTop: 12 }}>
          {turbines.map((t) => (
              <li key={t.turbineId}>
                {t.turbineId} — {t.name ?? "Unnamed"} ({t.location ?? "Unknown"})
              </li>
          ))}
        </ul>
      </div>
  );
}

export default App;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../core/api";
import type { TurbineDto } from "../generated-ts-client";

export default function TurbinesPage() {
    const [turbines, setTurbines] = useState<TurbineDto[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.turbines
            .getAll()
            .then(setTurbines)
            .catch((e) => setError(String(e)));
    }, []);

    return (
        <div>
            <h2>Farm Overview</h2>

            {error && <div style={{ marginTop: 12 }}>Error: {error}</div>}

            <ul style={{ marginTop: 12 }}>
                {turbines.map((t) => (
                    <li key={t.turbineId} style={{ marginBottom: 8 }}>
                        <strong>{t.name ?? t.turbineId}</strong> — {t.location ?? "Unknown"}{" "}
                        <Link to={`/turbines/${t.turbineId}`} style={{ marginLeft: 8 }}>
                            View details
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
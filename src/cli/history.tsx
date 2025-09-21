import { Text } from 'ink';
import { useEffect, useState } from 'react';
import db from '../lib/db';

type HistoryRow = { pickedAt: string; achievementApiName: string; displayName: string };

/**
 * Component for the `nesta history` command.
 * Shows the last 50 picks with timestamps and achievement names.
 */
export default function History() {
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const stmt = db.prepare(
      `SELECT ph.pickedAt as pickedAt, ph.achievementApiName as achievementApiName, a.displayName as displayName
       FROM pick_history ph
       LEFT JOIN achievements a ON a.apiName = ph.achievementApiName
       ORDER BY ph.pickedAt DESC
       LIMIT 50`,
    );
    const data = stmt.all() as HistoryRow[];
    setRows(data);
  }, []);

  if (rows.length === 0)
    return (
      <Text>No history yet. Tip: run &quot;nesta pick&quot; to choose an achievement, then it will appear here.</Text>
    );

  return (
    <>
      {rows.map((r, idx) => (
        <Text key={idx}>
          {new Date(r.pickedAt).toLocaleString()} - {r.displayName || r.achievementApiName}
        </Text>
      ))}
    </>
  );
}

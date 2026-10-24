import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const FDRListPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    apiClient.get('/fdr/').then(r => setRows(r.data.items || r.data || [])).catch(()=>{});
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My FDR Records</h1>
      <table className="w-full border">
        <thead><tr><th className="border p-2">App ID</th><th className="border p-2">FDR No</th><th className="border p-2">Status</th></tr></thead>
        <tbody>{rows.map((r:any)=><tr key={r.id}><td className="border p-2">{r.application_id}</td><td className="border p-2">{r.fdr_number}</td><td className="border p-2">{r.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
};
export default FDRListPage;

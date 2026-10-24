import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const FDRFormPage: React.FC = () => {
  const [form, setForm] = useState<any>({ fdr_number:'', bank_name:'', branch_name:'', amount:'', currency:'INR', issue_date:'', maturity_date:'', purpose:'', remarks:'' });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/fdr/', form);
      const id = res.data.id;
      if (files) {
        for (let i=0;i<files.length;i++) {
          const fd = new FormData();
          fd.append('file', files[i]);
          await apiClient.post(`/fdr/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      await apiClient.post(`/fdr/${id}/submit`);
      navigate('/dashboard');
    } finally { setLoading(false); }
  };

  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New FDR</h1>
      <form onSubmit={submit} className="space-y-3">
        {['fdr_number','bank_name','branch_name','amount','currency','issue_date','maturity_date','purpose','remarks'].map(k=>(
          <input key={k} className="w-full border rounded p-2" placeholder={k} value={form[k]} onChange={e=>set(k,e.target.value)} />
        ))}
        <input type="file" multiple accept="application/pdf" onChange={e=>setFiles(e.target.files)} />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading?'Saving...':'Submit'}</button>
      </form>
    </div>
  );
};
export default FDRFormPage;

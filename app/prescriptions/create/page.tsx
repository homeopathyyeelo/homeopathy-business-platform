'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Medicine {
  id: string;
  productId: string;
  productName: string;
  potency: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Template {
  id: string;
  name: string;
  diagnosis: string;
  medicines: Omit<Medicine, 'id'>[];
}

export default function PrescriptionCreatePage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    // Load templates
    fetch('/api/prescriptions/templates')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTemplates(data.data || []);
      })
      .catch(() => {});
  }, []);

  const addMedicine = () => {
    setMedicines([...medicines, {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      potency: '30C',
      dosage: '4 drops',
      frequency: 'TDS',
      duration: '7 days',
      instructions: 'Before meals'
    }]);
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const applyTemplate = (template: Template) => {
    setDiagnosis(template.diagnosis);
    setMedicines(template.medicines.map((m, i) => ({
      ...m,
      id: `${Date.now()}-${i}`,
      productId: '',
    })));
  };

  const getAiSuggestions = async () => {
    if (!symptoms) {
      alert('Please enter symptoms first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, diagnosis }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.suggestions || []);
        setShowAiPanel(true);
      }
    } catch (e: any) {
      alert('AI service unavailable: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    setMedicines([...medicines, {
      id: Date.now().toString(),
      productId: suggestion.productId || '',
      productName: suggestion.medicine,
      potency: suggestion.potency,
      dosage: suggestion.dosage,
      frequency: suggestion.frequency,
      duration: suggestion.duration || '7 days',
      instructions: suggestion.instructions || 'As directed'
    }]);
  };

  const handleSubmit = async () => {
    if (!patientId || medicines.length === 0) {
      alert('Please select patient and add at least one medicine');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          symptoms,
          diagnosis,
          medicines,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Prescription created: ' + data.id);
        router.push('/prescriptions');
      } else {
        alert('Error: ' + (data.error || 'Failed to create prescription'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Prescription Entry</h1>
          <p className="text-gray-600">Create new prescription with AI assistance</p>
        </div>
        <div className="space-x-2">
          <button onClick={getAiSuggestions} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded">
            🤖 AI Suggest
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            Save Prescription
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient Info */}
          <div className="bg-white rounded-md border p-4">
            <h3 className="font-semibold mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select value={patientId} onChange={e => {
                  setPatientId(e.target.value);
                  setPatientName(e.target.options[e.target.selectedIndex].text);
                }} className="w-full border rounded px-3 py-2">
                  <option value="">Select Patient</option>
                  <option value="p1">Anita Rao (34F)</option>
                  <option value="p2">Rahul Mehta (41M)</option>
                  <option value="p3">Priya Sharma (28F)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Clinical Info */}
          <div className="bg-white rounded-md border p-4">
            <h3 className="font-semibold mb-3">Clinical Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Symptoms / Chief Complaints</label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3} placeholder="e.g., Fever, headache, body ache since 2 days" className="w-full border rounded px-3 py-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g., Acute Fever, Viral Infection" className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="bg-white rounded-md border p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Medicines</h3>
              <button onClick={addMedicine} className="px-3 py-1 bg-green-600 text-white rounded text-sm">+ Add Medicine</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Medicine</th>
                    <th className="p-2 text-left">Potency</th>
                    <th className="p-2 text-left">Dosage</th>
                    <th className="p-2 text-left">Frequency</th>
                    <th className="p-2 text-left">Duration</th>
                    <th className="p-2 text-left">Instructions</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(m => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2"><input value={m.productName} onChange={e => updateMedicine(m.id, 'productName', e.target.value)} placeholder="Search medicine" className="w-full border rounded px-2 py-1" /></td>
                      <td className="p-2">
                        <select value={m.potency} onChange={e => updateMedicine(m.id, 'potency', e.target.value)} className="w-full border rounded px-2 py-1">
                          <option>30C</option>
                          <option>200C</option>
                          <option>1M</option>
                          <option>Q</option>
                          <option>6X</option>
                        </select>
                      </td>
                      <td className="p-2"><input value={m.dosage} onChange={e => updateMedicine(m.id, 'dosage', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                      <td className="p-2">
                        <select value={m.frequency} onChange={e => updateMedicine(m.id, 'frequency', e.target.value)} className="w-full border rounded px-2 py-1">
                          <option>OD</option>
                          <option>BD</option>
                          <option>TDS</option>
                          <option>QID</option>
                          <option>SOS</option>
                        </select>
                      </td>
                      <td className="p-2"><input value={m.duration} onChange={e => updateMedicine(m.id, 'duration', e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                      <td className="p-2"><input value={m.instructions} onChange={e => updateMedicine(m.id, 'instructions', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                      <td className="p-2"><button onClick={() => removeMedicine(m.id)} className="text-red-600 text-xs">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicines.length === 0 && <div className="text-center py-4 text-gray-500">No medicines added yet</div>}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-md border p-4">
            <label className="block text-sm font-medium mb-1">Additional Notes / Advice</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Diet, lifestyle advice, follow-up instructions" className="w-full border rounded px-3 py-2"></textarea>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Templates */}
          <div className="bg-white rounded-md border p-4">
            <h3 className="font-semibold mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {templates.length === 0 && <p className="text-sm text-gray-500">No templates available</p>}
              {templates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50 text-sm">
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          {showAiPanel && (
            <div className="bg-purple-50 rounded-md border border-purple-200 p-4">
              <h3 className="font-semibold mb-3 text-purple-900">🤖 AI Suggestions</h3>
              <div className="space-y-2">
                {aiSuggestions.length === 0 && <p className="text-sm text-gray-600">No suggestions available</p>}
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="bg-white p-2 rounded border text-sm">
                    <div className="font-medium">{s.medicine} {s.potency}</div>
                    <div className="text-xs text-gray-600">{s.dosage} - {s.frequency}</div>
                    <button onClick={() => applySuggestion(s)} className="mt-1 text-xs text-purple-600 hover:underline">+ Add to prescription</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Remedies */}
          <div className="bg-white rounded-md border p-4">
            <h3 className="font-semibold mb-3">Common Remedies</h3>
            <div className="space-y-1 text-sm">
              <div className="text-gray-700">• Arnica 30C - Trauma, bruises</div>
              <div className="text-gray-700">• Belladonna 30C - Fever, inflammation</div>
              <div className="text-gray-700">• Nux Vomica 30C - Digestive issues</div>
              <div className="text-gray-700">• Rhus Tox 30C - Joint pain</div>
              <div className="text-gray-700">• Pulsatilla 30C - Cold, cough</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

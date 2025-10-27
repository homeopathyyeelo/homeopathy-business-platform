'use client';

export default function MedicineMappingPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Medicine Mapping</h1>
        <p className="text-gray-600">Map diagnosis/symptoms to medicines, potencies, and dosage templates.</p>
      </div>
      <div className="rounded-md border bg-white p-4 text-sm text-gray-700">
        Mapping table placeholder. Connect to /api/prescriptions/templates and products search.
      </div>
    </div>
  );
}

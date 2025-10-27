'use client';

export default function PrescriptionTemplatesPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Prescription Templates</h1>
        <p className="text-gray-600">Manage reusable templates for common conditions.</p>
      </div>
      <div className="rounded-md border bg-white p-4 text-sm text-gray-700">
        Templates grid placeholder. Connect to /api/prescriptions/templates.
      </div>
    </div>
  );
}

'use client';

export default function PatientsListPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
        <p className="text-gray-600">Browse and manage patients.</p>
      </div>
      <div className="rounded-md border bg-white p-4 text-sm text-gray-700">
        Table placeholder: Name, Age, Phone, Visits, Last Visit, Actions.
      </div>
    </div>
  );
}

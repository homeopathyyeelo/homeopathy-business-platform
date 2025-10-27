'use client';

export default function AISuggestionsPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Suggestions</h1>
        <p className="text-gray-600">AI-powered remedy suggestions based on symptoms and history.</p>
      </div>
      <div className="rounded-md border bg-white p-4 text-sm text-gray-700">
        Suggestions list placeholder. Hook this to /api/prescriptions/suggestions.
      </div>
    </div>
  );
}

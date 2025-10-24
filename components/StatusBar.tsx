"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StatusBar() {
  const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
  const { data } = useSWR(`${API_URL}/api/erp/system/health`, fetcher, { refreshInterval: 60000 });

  if (!data) return <div className="fixed bottom-0 w-full bg-gray-100 p-2 text-sm text-gray-500">Checking health…</div>;

  return (
    <div className="fixed bottom-0 w-full bg-gray-900 text-white text-sm p-2 flex justify-center space-x-6">
      {data.services?.map((s:any) => (
        <span key={s.name} className={s.status === "healthy" ? "text-green-400" : "text-red-400"}>
          {s.name}: {s.status} ({s.latency}ms)
        </span>
      ))}
    </div>
  );
}

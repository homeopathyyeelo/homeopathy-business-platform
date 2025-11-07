"use client";
import React, { useState } from "react";
import { authFetch } from '@/lib/api/fetch-utils';

export default function ImportExportEnrich({ parsedInvoiceId, shopId }: { parsedInvoiceId: string; shopId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function runEnrich(forceAI = false) {
    setLoading(true);
    setMessage("Running enrichment...");
    try {
      const url = `http://localhost:3005/api/v1/enrich/invoice/${parsedInvoiceId}?shop_id=${encodeURIComponent(
        shopId
      )}&force_ai=${forceAI}`;
      const res = await authFetch(url, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setMessage(`Failed: ${json?.error || res.status}`);
      } else {
        setResults(json.results || []);
        setMessage("Enrichment complete.");
      }
    } catch (e: any) {
      setMessage(`Error: ${e?.message || "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enrich Parsed Invoice</h3>
        <div className="space-x-2">
          <button className="btn btn-primary" onClick={() => runEnrich(false)} disabled={loading}>
            {loading ? "Processing..." : "Enrich (Rules + AI)"}
          </button>
          <button className="btn" onClick={() => runEnrich(true)} disabled={loading}>
            Force AI
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600">{message}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Line ID</th>
              <th className="p-2">Product</th>
              <th className="p-2">Type</th>
              <th className="p-2">Confidence</th>
              <th className="p-2">HSN</th>
              <th className="p-2">GST%</th>
              <th className="p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No results yet.
                </td>
              </tr>
            ) : (
              results.map((r: any) => (
                <tr key={r.parsed_line_id} className="border-b">
                  <td className="p-2">{r.parsed_line_id}</td>
                  <td className="p-2">{r.matched_product_id || "-"}</td>
                  <td className="p-2">{r.match_type}</td>
                  <td className="p-2">
                    <span className={typeof r.match_confidence === "number" && r.match_confidence >= 0.8 ? "text-green-600" : "text-orange-600"}>
                      {typeof r.match_confidence === "number" ? r.match_confidence.toFixed(2) : "-"}
                    </span>
                  </td>
                  <td className="p-2">{r.hsn_code || r.hsn || "-"}</td>
                  <td className="p-2">{r.gst_rate ?? r.gst ?? "-"}</td>
                  <td className="p-2 text-gray-500">{r.reason || r.enrichment_payload?.reason || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

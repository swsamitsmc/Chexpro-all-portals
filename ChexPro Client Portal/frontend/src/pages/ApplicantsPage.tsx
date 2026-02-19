import { useQuery } from "@tanstack/react-query";
import { get } from "../lib/api";
import { formatDate, getStatusColor, formatStatus } from "../lib/utils";

export default function ApplicantsPage() {
  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants"],
    queryFn: () => get<any[]>("/applicants"),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Applicants</h1>
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applicants.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.firstName} {a.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{a.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
              {applicants.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No applicants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

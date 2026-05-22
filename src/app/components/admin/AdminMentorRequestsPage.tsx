import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { api, type AdminUser } from "../../lib/api";

export function AdminMentorRequestsPage() {
  const [pending, setPending] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getAdminUsers({ role: "mentor", mentor_status: "pending" })
      .then(setPending)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load requests."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: number) => {
    setActingId(id);
    try {
      await api.approveMentor(id);
      setPending((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: number) => {
    if (!window.confirm("Reject this mentor application?")) return;
    setActingId(id);
    try {
      await api.rejectMentor(id);
      setPending((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentor requests</h1>
      <p className="text-gray-600 mb-6">
        New mentor registrations stay pending until you approve them.
      </p>
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          No pending mentor applications.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{user.display_name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Registered {new Date(user.date_joined).toLocaleDateString()}
                  {user.is_email_verified ? " · Email verified" : " · Email not verified"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={actingId === user.id}
                  onClick={() => void approve(user.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  disabled={actingId === user.id}
                  onClick={() => void reject(user.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
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

  const verifyEmail = async (id: number) => {
    setActingId(id);
    try {
      const updated = await api.verifyUserEmail(id);
      setPending((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify email.");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: number) => {
    if (
      !window.confirm(
        "Reject this application? The account stays in the database (they cannot sign up again with the same email until you delete them under Mentors)."
      )
    ) {
      return;
    }
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

  const removeAccount = async (user: AdminUser) => {
    if (
      !window.confirm(
        `Permanently delete ${user.email}? They will be able to register again with this email.`
      )
    ) {
      return;
    }
    setActingId(user.id);
    try {
      await api.deleteAdminUser(user.id);
      setPending((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentor requests</h1>
      <p className="text-gray-600 mb-6">
        New mentor registrations stay pending until you approve them.{" "}
        <strong>Reject</strong> only marks them rejected (email still blocked). Use{" "}
        <strong>Remove account</strong> if they should be able to sign up again.
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
              <div className="flex flex-wrap gap-2">
                {!user.is_email_verified ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actingId === user.id}
                    onClick={() => void verifyEmail(user.id)}
                  >
                    Verify email
                  </Button>
                ) : null}
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
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-700 border-red-300"
                  disabled={actingId === user.id}
                  onClick={() => void removeAccount(user)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove account
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

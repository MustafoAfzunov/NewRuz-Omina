import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { api, type AdminUser } from "../../lib/api";

type AdminUsersTableProps = {
  role: "mentee" | "mentor";
  title: string;
  showMentorStatus?: boolean;
  mentorStatusFilter?: string;
};

export function AdminUsersTable({
  role,
  title,
  showMentorStatus,
  mentorStatusFilter,
}: AdminUsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getAdminUsers({
        role,
        ...(mentorStatusFilter ? { mentor_status: mentorStatusFilter } : {}),
      })
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => setLoading(false));
  }, [role, mentorStatusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.display_name} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setDeletingId(user.id);
    try {
      await api.deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                {showMentorStatus ? <th className="px-4 py-3">Status</th> : null}
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.display_name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  {showMentorStatus ? (
                    <td className="px-4 py-3 capitalize">{user.mentor_status || "—"}</td>
                  ) : null}
                  <td className="px-4 py-3">{user.is_email_verified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={deletingId === user.id}
                      onClick={() => void handleDelete(user)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

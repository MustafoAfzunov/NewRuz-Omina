import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api, type EventCategory, type EventItem } from "../../lib/api";

const categories: EventCategory[] = ["workshop", "seminar", "bootcamp", "networking"];

function defaultEnd(start: string): string {
  if (!start) return "";
  const d = new Date(start);
  d.setHours(d.getHours() + 2);
  return d.toISOString().slice(0, 16);
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "workshop" as EventCategory,
    image_url: "",
    location: "",
    starts_at: "",
    ends_at: "",
    application_deadline: "",
  });

  const load = () => {
    setLoading(true);
    api
      .getEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const starts = new Date(form.starts_at).toISOString();
      const ends = new Date(form.ends_at || defaultEnd(form.starts_at)).toISOString();
      await api.createEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        image_url: form.image_url,
        location: form.location,
        starts_at: starts,
        ends_at: ends,
        application_deadline: form.application_deadline || null,
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Button type="button" onClick={() => setShowForm(!showForm)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? "Cancel" : "Add event"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      {showForm ? (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="bg-white rounded-xl shadow-sm p-6 mb-6 grid gap-4 md:grid-cols-2"
        >
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="md:col-span-2"
          />
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) =>
              setForm({ ...form, starts_at: e.target.value, ends_at: form.ends_at || defaultEnd(e.target.value) })
            }
            required
          />
          <Input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            required
          />
          <Input
            type="date"
            placeholder="Application deadline"
            value={form.application_deadline}
            onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="md:col-span-2"
          />
          <textarea
            className="border rounded-md px-3 py-2 text-sm md:col-span-2 min-h-[80px]"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button type="submit" disabled={saving} className="md:col-span-2 bg-blue-600">
            {saving ? "Saving…" : "Publish event"}
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-gray-900">{ev.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ev.starts_at).toLocaleString()} · {ev.category}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 shrink-0"
                onClick={() => void handleDelete(ev.id, ev.title)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

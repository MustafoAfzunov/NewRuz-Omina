import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api, type Program, type ProgramCategory, type ProgramDeliveryMode } from "../../lib/api";
import { slugify } from "../../lib/slug";

const categories: ProgramCategory[] = [
  "design",
  "development",
  "business",
  "marketing",
  "data_science",
];

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "development" as ProgramCategory,
    delivery_mode: "online" as ProgramDeliveryMode,
    image_url: "",
    price: 0,
    duration_weeks: 8,
    outcomes: "",
    mentor_name: "",
  });

  const load = () => {
    setLoading(true);
    api
      .getPrograms()
      .then(setPrograms)
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
      const slug = slugify(form.title);
      await api.createProgram({
        title: form.title,
        slug,
        description: form.description,
        category: form.category,
        delivery_mode: form.delivery_mode,
        image_url: form.image_url,
        price: form.price,
        duration_weeks: form.duration_weeks,
        outcomes: form.outcomes,
        mentor_name: form.mentor_name,
        mentor_image_url: "",
      });
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        category: "development",
        delivery_mode: "online",
        image_url: "",
        price: 0,
        duration_weeks: 8,
        outcomes: "",
        mentor_name: "",
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create program.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!window.confirm(`Delete program "${title}"?`)) return;
    try {
      await api.deleteProgram(slug);
      setPrograms((prev) => prev.filter((p) => p.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <Button type="button" onClick={() => setShowForm(!showForm)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? "Cancel" : "Add program"}
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
          />
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ProgramCategory })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea
            className="border rounded-md px-3 py-2 text-sm md:col-span-2 min-h-[80px]"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <Input
            placeholder="Mentor name"
            value={form.mentor_name}
            onChange={(e) => setForm({ ...form, mentor_name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Duration (weeks)"
            value={form.duration_weeks}
            onChange={(e) => setForm({ ...form, duration_weeks: Number(e.target.value) })}
          />
          <Button type="submit" disabled={saving} className="md:col-span-2 bg-blue-600">
            {saving ? "Saving…" : "Publish program"}
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {programs.map((p) => (
            <div key={p.slug} className="p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">{p.slug} · {p.category}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 shrink-0"
                onClick={() => void handleDelete(p.slug, p.title)}
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

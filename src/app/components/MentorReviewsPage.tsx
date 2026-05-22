import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api, type Review } from "../lib/api";

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function MentorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    void api
      .getReviews()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => {
        setReviews([]);
        setError(err instanceof Error ? err.message : "Failed to load reviews.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500">
              Feedback from mentees after completed mentorship sessions.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-8">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-gray-500">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed p-10 text-center text-gray-600">
            No reviews yet. Reviews appear when mentees complete a session and leave feedback.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {reviews.map((review) => (
              <article key={review.id} className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{formatReviewDate(review.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">
                  {review.comment ? `"${review.comment}"` : "No written comment."}
                </p>
                <p className="text-xs text-gray-500">
                  Mentee ID: {review.mentee} · Session #{review.booking}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

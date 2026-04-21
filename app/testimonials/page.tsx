'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquarePlus, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

type Testimonial = {
  id: number;
  customer_name: string;
  location: string;
  testimonial_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({
    customer_name: '',
    location: '',
    testimonial_text: '',
  });

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/testimonials', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data?.error || 'Failed to fetch testimonials');
        }

        setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      } catch (err) {
        console.error('Testimonials fetch failed:', err);
        setError('Unable to load testimonials right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const hasTestimonials = useMemo(() => testimonials.length > 0, [testimonials]);

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = reviewForm.customer_name.trim();
    const text = reviewForm.testimonial_text.trim();

    if (!name || !text) {
      setSubmitMessage('Please enter your name and review message.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage('');

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          location: reviewForm.location.trim(),
          testimonial_text: text,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to submit review');
      }

      setSubmitMessage('Thank you for your review.');
      setReviewForm({ customer_name: '', location: '', testimonial_text: '' });
      setShowReviewForm(false);
    } catch (submitError) {
      console.error('Review submit failed:', submitError);
      setSubmitMessage(submitError instanceof Error ? submitError.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <Navbar />

      <section className="pt-24 sm:pt-28">
        <div className="mx-2 sm:mx-4 lg:mx-6 rounded-none sm:rounded-2xl overflow-hidden">
          <div className="bg-linear-to-r from-[#181f3f] via-[#481026] to-[#7b0b17] px-4 py-10 sm:px-10 sm:py-14">
            <h1 className="text-center text-4xl sm:text-5xl font-black text-white tracking-tight">Testimonial</h1>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-8 sm:pt-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-700 font-semibold">Have feedback to share with us?</p>
            <Button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="bg-[#e63946] hover:bg-[#d62839] text-white"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              {showReviewForm ? 'Close Review Form' : 'Add Review'}
            </Button>
          </div>

          {submitMessage ? (
            <div
              className={`mb-5 rounded-xl border p-4 text-sm font-semibold ${submitMessage.toLowerCase().includes('thank you') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
            >
              {submitMessage}
            </div>
          ) : null}

          {showReviewForm ? (
            <form
              onSubmit={handleSubmitReview}
              className="mb-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <h2 className="text-xl font-black text-slate-900">Write Your Review</h2>
              <p className="text-sm text-slate-500 mt-1">Your review will be visible after admin verification.</p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Your Name</label>
                  <Input
                    value={reviewForm.customer_name}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, customer_name: event.target.value }))}
                    placeholder="Enter your name"
                    maxLength={120}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Location</label>
                  <Input
                    value={reviewForm.location}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="City, State"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">Review</label>
                <Textarea
                  value={reviewForm.testimonial_text}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, testimonial_text: event.target.value }))}
                  placeholder="Write your review here"
                  rows={5}
                  maxLength={1200}
                  required
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting} className="bg-[#e63946] hover:bg-[#d62839] text-white">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Review
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-white/70 border border-white p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && !hasTestimonials ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No testimonials found. Add testimonials from Admin Panel to display them here.
            </div>
          ) : null}

          {!loading && !error && hasTestimonials ? (
            <div className="space-y-4">
              {testimonials.map((item) => (
                <article
                  key={item.id}
                  className="relative rounded-xl bg-[#f3f4f6] border border-slate-200 px-4 py-4 sm:px-5 sm:py-5"
                >
                  <Quote className="absolute right-4 top-4 h-7 w-7 text-slate-300" />

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#ef4444] tracking-tight">{item.customer_name}</h3>
                  <p className="mt-1 text-base text-slate-500">{item.location || 'India'}</p>

                  <p className="mt-3 text-xl sm:text-2xl leading-snug text-slate-900">{item.testimonial_text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
}

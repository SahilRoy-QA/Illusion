/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Check,
} from 'lucide-react';
import { TenantConfig, WebsiteContent } from '../../types/config.ts';
import { PublicBookingModal } from './PublicBookingModal.tsx';
import { websiteCopy } from '../../copy/website.ts';

interface PublicSiteRendererProps {
  config: TenantConfig;
  previewMode?: boolean;
  onExitPreview?: () => void;
}

export function PublicSiteRenderer({
  config,
  previewMode = false,
  onExitPreview,
}: PublicSiteRendererProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');

  // Use published site content, fallback to draft in preview mode
  const site: WebsiteContent = (previewMode && config.website.draft)
    ? config.website.draft
    : (config.website.published || config.website.draft);

  const sections = site.sections || [];
  const primaryColor = config.branding?.primary || '#0284c7';

  const handleBookService = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Optional Preview / Return Banner */}
      {previewMode && (
        <aside aria-label="Website preview banner" className="sticky top-0 z-40 bg-indigo-950 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-white">Live Website Preview Mode:</span>
            <span>Showing current draft updates for {config.name}.</span>
          </div>
          {onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{websiteCopy.backToAdmin}</span>
            </button>
          )}
        </aside>
      )}

      {/* Public Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {config.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 tracking-tight leading-none text-base">
                {config.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {config.profile.address || config.slug}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {config.profile.phone && (
              <a
                href={`tel:${config.profile.phone}`}
                className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{config.profile.phone}</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => handleBookService('')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:brightness-110 flex items-center space-x-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      <div className="flex-1">
        {sections.map((sec) => {
          if (!sec.enabled) return null;

          // SECTION 1: HERO
          if (sec.type === 'hero') {
            const badge = (sec.content?.badge as string) || 'Certified Excellence';
            const highlight = (sec.content?.highlight as string) || '';

            return (
              <section
                key={sec.id}
                className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50"
              >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
                    {sec.title || site.headline}
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    {sec.subtitle || site.tagline}
                  </p>

                  {highlight && (
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      {highlight}
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleBookService('')}
                      className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition hover:brightness-110 flex items-center space-x-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Book Online Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {config.profile.phone && (
                      <a
                        href={`tel:${config.profile.phone}`}
                        className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs flex items-center space-x-2"
                      >
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>Call {config.profile.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          // SECTION 2: SERVICES
          if (sec.type === 'services') {
            const items = (sec.content?.items as Array<{ name: string; fee?: string; desc?: string }>) || [];

            return (
              <section key={sec.id} className="py-16 bg-white border-b border-slate-200/60">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {sec.title}
                    </h2>
                    {sec.subtitle && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((svc, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition duration-150 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {svc.name}
                            </h3>
                            {svc.fee && (
                              <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                                {svc.fee}
                              </span>
                            )}
                          </div>
                          {svc.desc && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {svc.desc}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">
                            Standard Appointment
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBookService(svc.name)}
                            className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center space-x-1"
                          >
                            <span>Book This</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // SECTION 3: ABOUT
          if (sec.type === 'about') {
            const bio = (sec.content?.doctorBio as string) || '';
            const exp = (sec.content?.experienceYears as string) || '';
            const qual = (sec.content?.qualification as string) || '';

            return (
              <section key={sec.id} className="py-16 bg-slate-50/70 border-b border-slate-200/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Trusted Professional Care</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        {sec.title}
                      </h2>
                      {sec.subtitle && (
                        <p className="text-sm text-slate-600">{sec.subtitle}</p>
                      )}
                    </div>

                    {bio && (
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {bio}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {exp && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                          <Star className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Experience</div>
                            <div className="text-sm font-bold text-slate-900">{exp}</div>
                          </div>
                        </div>
                      )}

                      {qual && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Credentials</div>
                            <div className="text-sm font-bold text-slate-900">{qual}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // SECTION 4: BOOKING CTA
          if (sec.type === 'booking') {
            return (
              <section key={sec.id} className="py-16 bg-white border-b border-slate-200/60">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {sec.title}
                    </h2>
                    <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      {sec.subtitle || 'Reserve your slot in minutes. Zero waiting line, fast in-person confirmation.'}
                    </p>
                  </div>

                  <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3">
                    <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-sky-600" />
                      <span>Instant confirmation directly with front-desk staff</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-sky-600" />
                      <span>Convenient time slots tailored to your daily schedule</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-sky-600" />
                      <span>No pre-payment required to book online</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookService('')}
                      className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs transition hover:brightness-110 flex items-center justify-center space-x-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Choose Your Preferred Slot</span>
                    </button>
                  </div>
                </div>
              </section>
            );
          }

          // SECTION 5: CONTACT & HOURS
          if (sec.type === 'contact') {
            return (
              <section key={sec.id} className="py-16 bg-slate-50/70 border-b border-slate-200/60">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {sec.title}
                    </h2>
                    {sec.subtitle && (
                      <p className="text-sm text-slate-600">{sec.subtitle}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Location */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Address & Location</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {config.profile.address || 'Address details available upon reservation.'}
                      </p>
                    </div>

                    {/* Phone & Inquiries */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Phone Inquiries</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {config.profile.phone || 'Phone support available during open hours.'}
                      </p>
                      {config.profile.email && (
                        <p className="text-xs text-slate-500">{config.profile.email}</p>
                      )}
                    </div>

                    {/* Working Hours */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Working Hours</h3>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Mon – Fri: 09:00 AM – 08:00 PM</div>
                        <div>Saturday: 09:00 AM – 06:00 PM</div>
                        <div>Sunday: By advance appointment</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <div className="font-semibold text-slate-700">{config.name}</div>
          <div>Powered by illusion business workspace platform</div>
          <div className="text-[11px] text-slate-400">
            {websiteCopy.publicSiteNotice}
          </div>
        </div>
      </footer>

      {/* Interactive Booking Modal */}
      <PublicBookingModal
        isOpen={isBookingOpen}
        config={config}
        initialService={selectedService}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

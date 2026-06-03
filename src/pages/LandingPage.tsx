/**
 * LandingPage
 *
 * Full-fidelity conversion of /Resuvibe/index.html into a React component.
 * All styles are self-contained in the <style> block, scoped under .lp-wrapper
 * to avoid collisions with the app's Tailwind / shadcn CSS vars and class names.
 *
 * CTA routing:
 *   Sign In link          → /login  (Login page, sign-in tab)
 *   "Get Started – Free" nav CTA  → /signup (Login page, sign-up tab)
 *   "Build My Resume Free" hero   → /signup
 *   "Get Started Free" final CTA  → /signup
 *   "Sign In" final CTA           → /login
 */

import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function LandingPage() {
  return (
    <div className="lp-wrapper">
      {/* ─── Scoped styles ─────────────────────────────────────────────── */}
      <style>{`
        /* ── Design tokens (scoped to .lp-wrapper) ──────────────────── */
        .lp-wrapper {
          --lp-primary:                   #9d4300;
          --lp-on-primary:                #ffffff;
          --lp-primary-container:         #f97316;
          --lp-on-primary-container:      #582200;
          --lp-surface:                   #f9f9ff;
          --lp-surface-dim:               #d3daef;
          --lp-surface-container:         #e9edff;
          --lp-surface-container-low:     #f1f3ff;
          --lp-on-surface:                #141b2b;
          --lp-on-surface-variant:        #584237;
          --lp-inverse-surface:           #293040;
          --lp-inverse-on-surface:        #edf0ff;
          --lp-surface-cream:             #F9FAF1;
          --lp-text-muted:                #64748B;
          --lp-border-subtle:             #E2E8F0;
          --lp-outline:                   #8c7164;
          --lp-outline-variant:           #e0c0b1;

          --lp-radius-sm:   0.25rem;
          --lp-radius:      0.5rem;
          --lp-radius-md:   0.75rem;
          --lp-radius-lg:   1rem;
          --lp-radius-xl:   1.5rem;
          --lp-radius-full: 9999px;

          --lp-container-max: 1280px;
          --lp-gutter:        24px;

          font-family: 'DM Sans', sans-serif;
          background-color: var(--lp-surface-cream);
          color: var(--lp-on-surface);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
        }

        /* ── Reset (scoped) ──────────────────────────────────────────── */
        .lp-wrapper *, .lp-wrapper *::before, .lp-wrapper *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .lp-wrapper img { display: block; max-width: 100%; }

        /* ── Layout ──────────────────────────────────────────────────── */
        .lp-container {
          max-width: var(--lp-container-max);
          margin: 0 auto;
          padding: 0 var(--lp-gutter);
        }

        /* ── Buttons ─────────────────────────────────────────────────── */
        .lp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--lp-radius-md);
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
          white-space: nowrap;
        }
        .lp-btn-primary {
          background: var(--lp-primary-container);
          color: var(--lp-on-primary);
        }
        .lp-btn-primary:hover {
          background: var(--lp-primary);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.38);
        }
        .lp-btn-secondary {
          background: transparent;
          color: var(--lp-on-surface);
          border: 1.5px solid var(--lp-on-surface);
        }
        .lp-btn-secondary:hover {
          background: var(--lp-on-surface);
          color: #fff;
        }
        .lp-btn-ghost-light {
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
        }
        .lp-btn-ghost-light:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.5);
        }
        .lp-btn-white {
          background: #fff;
          color: var(--lp-on-surface);
        }
        .lp-btn-white:hover {
          background: var(--lp-surface-cream);
          transform: translateY(-1px);
        }
        .lp-btn-lg {
          padding: 15px 32px;
          font-size: 17px;
          border-radius: var(--lp-radius-md);
        }

        /* ── Chips ───────────────────────────────────────────────────── */
        .lp-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: var(--lp-radius-full);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .lp-chip-orange {
          background: rgba(249, 115, 22, 0.1);
          color: var(--lp-primary);
        }

        /* ── Section eyebrow ─────────────────────────────────────────── */
        .lp-section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--lp-primary-container);
          margin-bottom: 16px;
        }
        .lp-section-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: var(--lp-radius-full);
          background: currentColor;
          flex-shrink: 0;
        }

        /* ── Navigation ──────────────────────────────────────────────── */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          background: rgba(249, 249, 255, 0.88);
          border-bottom: 1px solid var(--lp-border-subtle);
        }
        .lp-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .lp-nav-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
        }
        .lp-nav-logomark {
          width: 34px;
          height: 34px;
          background: var(--lp-primary-container);
          border-radius: var(--lp-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-nav-logomark svg { display: block; }
        .lp-nav-wordmark {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--lp-on-surface);
        }
        .lp-nav-wordmark em {
          font-style: normal;
          color: var(--lp-primary-container);
        }
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-nav-signin {
          font-size: 15px;
          font-weight: 500;
          color: var(--lp-on-surface);
          text-decoration: none;
          padding: 8px 14px;
          border-radius: var(--lp-radius-md);
          transition: background 0.15s;
        }
        .lp-nav-signin:hover { background: var(--lp-surface-container-low); }

        /* ── Hero ────────────────────────────────────────────────────── */
        .lp-hero {
          padding: 104px 0 88px;
          background: linear-gradient(180deg, var(--lp-surface) 0%, var(--lp-surface-cream) 100%);
          position: relative;
          overflow: hidden;
        }
        .lp-hero::before {
          content: '';
          position: absolute;
          top: -240px;
          right: -160px;
          width: 640px;
          height: 640px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.09) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-hero::after {
          content: '';
          position: absolute;
          bottom: -120px;
          left: -120px;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(81, 96, 114, 0.06) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-hero-inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
        }
        .lp-hero-eyebrow { margin-bottom: 24px; }
        .lp-hero-headline {
          font-family: 'DM Serif Display', serif;
          font-size: 46px;
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: var(--lp-on-surface);
          margin-bottom: 24px;
        }
        .lp-hero-headline em {
          font-style: italic;
          color: var(--lp-primary-container);
        }
        .lp-hero-subhead {
          font-size: 19px;
          line-height: 30px;
          color: var(--lp-text-muted);
          margin-bottom: 40px;
          max-width: 480px;
        }
        .lp-hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }
        .lp-hero-footnote {
          font-size: 14px;
          color: var(--lp-text-muted);
        }
        .lp-hero-footnote strong {
          color: var(--lp-on-surface);
          font-weight: 600;
        }

        /* Resume preview card */
        .lp-hero-visual { position: relative; }
        .lp-resume-card {
          background: #fff;
          border: 1px solid var(--lp-border-subtle);
          border-radius: var(--lp-radius-lg);
          box-shadow: 0 12px 48px rgba(20, 27, 43, 0.1);
          padding: 28px 28px 24px;
          position: relative;
        }
        .lp-resume-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 2px solid var(--lp-primary-container);
        }
        .lp-resume-name {
          font-family: 'DM Serif Display', serif;
          font-size: 21px;
          color: var(--lp-on-surface);
          margin-bottom: 3px;
        }
        .lp-resume-role { font-size: 13px; color: var(--lp-text-muted); }
        .lp-ai-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.22);
          color: var(--lp-primary);
          padding: 4px 10px;
          border-radius: var(--lp-radius-full);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        .lp-resume-section { margin-bottom: 16px; }
        .lp-resume-section:last-child { margin-bottom: 0; }
        .lp-resume-section-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lp-primary-container);
          margin-bottom: 9px;
        }
        .lp-line-block { display: flex; flex-direction: column; gap: 6px; }
        .lp-line {
          height: 8px;
          border-radius: var(--lp-radius-full);
          background: var(--lp-border-subtle);
        }
        .lp-line.w-full  { width: 100%; }
        .lp-line.w-80    { width: 80%; }
        .lp-line.w-65    { width: 65%; }
        .lp-line.w-45    { width: 45%; }
        .lp-line.accent  { background: rgba(249, 115, 22, 0.18); }
        .lp-skill-chips  { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-skill-chip {
          background: rgba(249, 115, 22, 0.09);
          border: 1px solid rgba(249, 115, 22, 0.2);
          color: var(--lp-primary);
          padding: 4px 11px;
          border-radius: var(--lp-radius-full);
          font-size: 11px;
          font-weight: 600;
        }
        .lp-score-float {
          position: absolute;
          bottom: -28px;
          left: -28px;
          background: #fff;
          border: 1px solid var(--lp-border-subtle);
          border-radius: var(--lp-radius-lg);
          padding: 14px 18px;
          box-shadow: 0 6px 24px rgba(20, 27, 43, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lp-score-ring { width: 48px; height: 48px; position: relative; flex-shrink: 0; }
        .lp-score-ring svg { transform: rotate(-90deg); }
        .lp-score-ring-num {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: var(--lp-primary-container);
        }
        .lp-score-text-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--lp-on-surface);
          white-space: nowrap;
        }
        .lp-score-text-sub { font-size: 11px; color: var(--lp-text-muted); margin-top: 2px; }
        .lp-ai-float {
          position: absolute;
          top: -18px;
          right: -24px;
          background: #fff;
          border: 1px solid var(--lp-border-subtle);
          border-radius: var(--lp-radius-lg);
          padding: 12px 16px;
          box-shadow: 0 4px 20px rgba(20, 27, 43, 0.09);
          width: 188px;
        }
        .lp-ai-float-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--lp-primary-container);
          margin-bottom: 5px;
          letter-spacing: 0.03em;
        }
        .lp-ai-float-body { font-size: 12px; color: var(--lp-text-muted); line-height: 1.5; }

        /* ── Recruiter Reality ───────────────────────────────────────── */
        .lp-reality-section { background: var(--lp-inverse-surface); padding: 104px 0; }
        .lp-reality-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 88px;
          align-items: center;
        }
        .lp-reality-content .lp-section-eyebrow { color: rgba(249, 115, 22, 0.85); }
        .lp-reality-headline {
          font-family: 'DM Serif Display', serif;
          font-size: 40px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #fff;
          margin-bottom: 20px;
        }
        .lp-reality-body {
          font-size: 17px;
          line-height: 27px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 32px;
        }
        .lp-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(249, 115, 22, 0.14);
          border: 1px solid rgba(249, 115, 22, 0.28);
          border-radius: var(--lp-radius-full);
          padding: 9px 18px;
          font-size: 14px;
          font-weight: 600;
          color: var(--lp-primary-container);
        }
        .lp-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .lp-stat-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--lp-radius-lg);
          padding: 24px 22px;
          transition: background 0.18s;
        }
        .lp-stat-card:hover { background: rgba(255, 255, 255, 0.09); }
        .lp-stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 44px;
          line-height: 1;
          color: var(--lp-primary-container);
          margin-bottom: 8px;
        }
        .lp-stat-desc { font-size: 14px; color: rgba(255, 255, 255, 0.55); line-height: 1.55; }

        /* ── Features ────────────────────────────────────────────────── */
        .lp-features-section { background: var(--lp-surface); padding: 104px 0; }
        .lp-section-header { text-align: center; margin-bottom: 64px; }
        .lp-section-title {
          font-family: 'DM Serif Display', serif;
          font-size: 40px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--lp-on-surface);
          margin-bottom: 16px;
        }
        .lp-section-sub {
          font-size: 18px;
          line-height: 28px;
          color: var(--lp-text-muted);
          max-width: 540px;
          margin: 0 auto;
        }
        .lp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .lp-feature-card {
          background: #fff;
          border: 1px solid var(--lp-border-subtle);
          border-radius: var(--lp-radius-lg);
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(20, 27, 43, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 36px rgba(20, 27, 43, 0.09);
        }
        .lp-feature-icon-wrap {
          width: 52px;
          height: 52px;
          background: rgba(249, 115, 22, 0.09);
          border-radius: var(--lp-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 26px;
        }
        .lp-feature-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--lp-on-surface);
          margin-bottom: 10px;
          line-height: 1.3;
        }
        .lp-feature-desc { font-size: 15px; color: var(--lp-text-muted); line-height: 1.65; }

        /* ── How it Works ────────────────────────────────────────────── */
        .lp-how-section { background: var(--lp-surface-cream); padding: 104px 0; }
        .lp-steps-track {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          position: relative;
          gap: 8px;
        }
        .lp-steps-track::before {
          content: '';
          position: absolute;
          top: 31px;
          left: calc(16.67% + 20px);
          right: calc(16.67% + 20px);
          height: 2px;
          background: linear-gradient(90deg, var(--lp-primary-container) 0%, rgba(249, 115, 22, 0.15) 100%);
          pointer-events: none;
        }
        .lp-step { padding: 0 16px; text-align: center; }
        .lp-step-num {
          width: 62px;
          height: 62px;
          border-radius: var(--lp-radius-full);
          background: var(--lp-primary-container);
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          position: relative;
          z-index: 1;
          box-shadow: 0 0 0 7px rgba(249, 115, 22, 0.12), 0 4px 16px rgba(249, 115, 22, 0.3);
        }
        .lp-step-title { font-size: 17px; font-weight: 700; color: var(--lp-on-surface); margin-bottom: 12px; }
        .lp-step-desc {
          font-size: 15px;
          color: var(--lp-text-muted);
          line-height: 1.65;
          max-width: 280px;
          margin: 0 auto;
        }

        /* ── Testimonials ────────────────────────────────────────────── */
        .lp-testimonials-section { background: var(--lp-surface); padding: 104px 0; }
        .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .lp-testimonial-card {
          background: var(--lp-surface-cream);
          border: 1px solid var(--lp-border-subtle);
          border-radius: var(--lp-radius-lg);
          padding: 28px 26px;
        }
        .lp-t-stars { color: var(--lp-primary-container); font-size: 17px; letter-spacing: 3px; margin-bottom: 16px; }
        .lp-t-quote {
          font-size: 15px;
          color: var(--lp-on-surface);
          line-height: 1.72;
          font-style: italic;
          margin-bottom: 22px;
        }
        .lp-t-author { display: flex; align-items: center; gap: 12px; }
        .lp-t-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--lp-radius-full);
          background: linear-gradient(135deg, var(--lp-primary-container) 0%, var(--lp-primary) 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-t-name { font-size: 14px; font-weight: 600; color: var(--lp-on-surface); }
        .lp-t-role { font-size: 12px; color: var(--lp-text-muted); margin-top: 2px; }

        /* ── Final CTA ───────────────────────────────────────────────── */
        .lp-cta-section {
          background: linear-gradient(145deg, var(--lp-on-surface) 0%, #1a2640 100%);
          padding: 128px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-section::before {
          content: '';
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 900px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.11) 0%, transparent 55%);
          pointer-events: none;
        }
        .lp-cta-inner { position: relative; z-index: 1; }
        .lp-cta-headline {
          font-family: 'DM Serif Display', serif;
          font-size: 54px;
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: #fff;
          margin-bottom: 20px;
        }
        .lp-cta-headline em { font-style: italic; color: var(--lp-primary-container); }
        .lp-cta-sub {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.58);
          line-height: 28px;
          max-width: 460px;
          margin: 0 auto 44px;
        }
        .lp-cta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-cta-footnote { margin-top: 22px; font-size: 14px; color: rgba(255, 255, 255, 0.35); }

        /* ── Footer ──────────────────────────────────────────────────── */
        .lp-footer {
          background: var(--lp-inverse-surface);
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding: 48px 0 32px;
        }
        .lp-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }
        .lp-footer-logo {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
          text-decoration: none;
        }
        .lp-footer-logo em { font-style: normal; color: var(--lp-primary-container); }
        .lp-footer-links { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
        .lp-footer-link {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.42);
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-footer-link:hover { color: rgba(255, 255, 255, 0.8); }
        .lp-footer-divider { height: 1px; background: rgba(255, 255, 255, 0.06); margin: 32px 0 24px; }
        .lp-footer-copy { font-size: 13px; color: rgba(255, 255, 255, 0.25); text-align: center; }

        /* ── Utilities ───────────────────────────────────────────────── */
        .lp-sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        /* ── Responsive ──────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .lp-hero-inner       { grid-template-columns: 1fr; gap: 48px; }
          .lp-hero-visual      { display: none; }
          .lp-hero-headline    { font-size: 38px; }
          .lp-reality-inner    { grid-template-columns: 1fr; gap: 56px; }
          .lp-reality-headline { font-size: 34px; }
          .lp-features-grid    { grid-template-columns: repeat(2, 1fr); }
          .lp-testimonials-grid{ grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .lp-container { padding: 0 16px; }

          .lp-hero              { padding: 72px 0 64px; }
          .lp-hero-headline     { font-size: 32px; }
          .lp-hero-subhead      { font-size: 17px; }

          .lp-section-title     { font-size: 32px; }
          .lp-reality-headline  { font-size: 30px; }
          .lp-cta-headline      { font-size: 36px; }

          .lp-reality-section,
          .lp-features-section,
          .lp-how-section,
          .lp-testimonials-section { padding: 80px 0; }

          .lp-cta-section       { padding: 96px 0; }

          .lp-features-grid     { grid-template-columns: 1fr; }
          .lp-testimonials-grid { grid-template-columns: 1fr; }

          .lp-stats-grid        { grid-template-columns: 1fr 1fr; }
          .lp-stat-num          { font-size: 36px; }

          .lp-steps-track       { grid-template-columns: 1fr; }
          .lp-steps-track::before { display: none; }
          .lp-step {
            display: flex;
            align-items: flex-start;
            text-align: left;
            gap: 20px;
            padding: 0;
            margin-bottom: 40px;
          }
          .lp-step:last-child   { margin-bottom: 0; }
          .lp-step-num          { margin: 0; flex-shrink: 0; }
          .lp-step-desc         { margin: 0; }

          .lp-footer-row        { flex-direction: column; text-align: center; }
          .lp-footer-links      { justify-content: center; }

          .lp-nav .lp-btn       { display: none; }
        }
      `}</style>

      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <header className="lp-nav" role="banner">
        <div className="lp-container">
          <nav className="lp-nav-inner" aria-label="Main navigation">

            <Link to="/" className="lp-nav-logo" aria-label="Resuvibe — home">
              <BrandLogo iconSize="2em" />
            </Link>


            <div className="lp-nav-actions">
              <Link to="/applications/889931c5-30b7-4a1c-828b-358d0a8d6d49" className="lp-nav-signin">See Example</Link>
              <Link to="/applications/889931c5-30b7-4a1c-828b-358d0a8d6d49" className="lp-btn lp-btn-primary">Get Started — It's Free</Link>
            </div>

          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <main>
        <section className="lp-hero" aria-labelledby="lp-hero-headline">
          <div className="lp-container">
            <div className="lp-hero-inner">

              {/* Copy */}
              <div className="lp-hero-copy">
                <div className="lp-hero-eyebrow">
                  <span className="lp-chip lp-chip-orange" role="note">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <path d="M6 0.75L7.35 4.65H11.45L8.1 7.05L9.35 11.25L6 9L2.65 11.25L3.9 7.05L0.55 4.65H4.65Z"/>
                    </svg>
                    Free · No credit card required
                  </span>
                </div>

                <h1 className="lp-hero-headline" id="lp-hero-headline">
                  The Recruiter Has AI.<br /><em>Now You Do Too – For Free</em>
                </h1>

                <p className="lp-hero-subhead">
                  Resuvibe uses AI to write a perfectly tailored resume and cover letter for every job you apply to — matching keywords, surfacing the right experience, and making sure you actually get seen.
                </p>

                <div className="lp-hero-ctas">
                  <Link to="/applications/889931c5-30b7-4a1c-828b-358d0a8d6d49" className="lp-btn lp-btn-primary lp-btn-lg">Build My Resume Free</Link>
                  <a href="#lp-how-it-works" className="lp-btn lp-btn-secondary lp-btn-lg">See How It Works</a>
                </div>

                <p className="lp-hero-footnote">
                  <strong>100% free.</strong> No templates to fight with. No subscription wall. Just your best application, every time.
                </p>
              </div>

              {/* Resume Preview Illustration */}
              <div className="lp-hero-visual" aria-hidden="true">

                {/* AI suggestion floating card */}
                <div className="lp-ai-float">
                  <div className="lp-ai-float-header">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0.75L7.35 4.65H11.45L8.1 7.05L9.35 11.25L6 9L2.65 11.25L3.9 7.05L0.55 4.65H4.65Z"/>
                    </svg>
                    AI Suggestion
                  </div>
                  <div className="lp-ai-float-body">Added 4 missing keywords from this job listing to your summary.</div>
                </div>

                {/* Resume card */}
                <div className="lp-resume-card">
                  <div className="lp-resume-card-head">
                    <div>
                      <div className="lp-resume-name">Alex Johnson</div>
                      <div className="lp-resume-role">Product Manager · San Francisco, CA</div>
                    </div>
                    <span className="lp-ai-pill">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M5 0.5L6.15 3.85H9.5L6.85 5.8L7.85 9.25L5 7.4L2.15 9.25L3.15 5.8L0.5 3.85H3.85Z"/>
                      </svg>
                      AI Tailored
                    </span>
                  </div>

                  <div className="lp-resume-section">
                    <div className="lp-resume-section-label">Summary</div>
                    <div className="lp-line-block">
                      <div className="lp-line w-full accent"></div>
                      <div className="lp-line w-80 accent"></div>
                      <div className="lp-line w-65"></div>
                    </div>
                  </div>

                  <div className="lp-resume-section">
                    <div className="lp-resume-section-label">Experience</div>
                    <div className="lp-line-block">
                      <div className="lp-line w-65"></div>
                      <div className="lp-line w-full"></div>
                      <div className="lp-line w-80"></div>
                      <div className="lp-line w-45"></div>
                    </div>
                  </div>

                  <div className="lp-resume-section">
                    <div className="lp-resume-section-label">Skills</div>
                    <div className="lp-skill-chips">
                      <span className="lp-skill-chip">Product Strategy</span>
                      <span className="lp-skill-chip">Agile / Scrum</span>
                      <span className="lp-skill-chip">SQL</span>
                      <span className="lp-skill-chip">Roadmapping</span>
                      <span className="lp-skill-chip">Stakeholder Mgmt</span>
                    </div>
                  </div>

                  {/* Match score float */}
                  <div className="lp-score-float">
                    <div className="lp-score-ring">
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="#E2E8F0" strokeWidth="4"/>
                        <circle cx="24" cy="24" r="20" fill="none" stroke="#f97316" strokeWidth="4"
                          strokeDasharray="125.66" strokeDashoffset="7.54" strokeLinecap="round"/>
                      </svg>
                      <div className="lp-score-ring-num">94%</div>
                    </div>
                    <div>
                      <div className="lp-score-text-label">Job Match Score</div>
                      <div className="lp-score-text-sub">ATS-optimized &amp; ready</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>


        {/* ─── Recruiter Reality ────────────────────────────────────────── */}
        <section className="lp-reality-section" aria-labelledby="lp-reality-headline">
          <div className="lp-container">
            <div className="lp-reality-inner">

              <div className="lp-reality-content">
                <div className="lp-section-eyebrow">
                  <span className="lp-section-eyebrow-dot"></span>
                  The Honest Truth
                </div>
                <h2 className="lp-reality-headline" id="lp-reality-headline">
                  Recruiters and HR Teams Have Been Using AI to Screen You for Years.
                </h2>
                <p className="lp-reality-body">
                  Before a human ever reads your resume, an algorithm has already ranked, filtered, and often rejected it. Applicant Tracking Systems scan for keywords, formatting, and relevance signals the same way search engines rank pages. The playing field isn't level — and generic resumes don't stand a chance.
                </p>
                <p className="lp-reality-body" style={{ marginBottom: 0 }}>
                  Resuvibe gives you the same AI-powered advantage — completely free — so your application speaks the language that gets you through the door.
                </p>
                <div style={{ marginTop: 32 }}>
                  <span className="lp-level-badge">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 1L9.8 5.8H15L10.8 8.6L12.4 13.8L8 11L3.6 13.8L5.2 8.6L1 5.8H6.2Z"/>
                    </svg>
                    AI for the job seeker — finally, and for free
                  </span>
                </div>
              </div>

              <div className="lp-stats-grid" aria-label="Key hiring statistics">
                <div className="lp-stat-card">
                  <div className="lp-stat-num" aria-label="75 percent">75%</div>
                  <p className="lp-stat-desc">of resumes are rejected by ATS software before a recruiter sees them</p>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-num" aria-label="6 seconds">6 sec</div>
                  <p className="lp-stat-desc">average time a recruiter spends on each resume that does make it through</p>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-num" aria-label="98 percent">98%</div>
                  <p className="lp-stat-desc">of Fortune 500 companies use AI-powered applicant tracking systems</p>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-num" aria-label="3 times">3×</div>
                  <p className="lp-stat-desc">more likely to land an interview with a resume tailored to the specific job</p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ─── Features ─────────────────────────────────────────────────── */}
        <section className="lp-features-section" aria-labelledby="lp-features-title">
          <div className="lp-container">

            <div className="lp-section-header">
              <div className="lp-section-eyebrow" style={{ justifyContent: "center" }}>
                <span className="lp-section-eyebrow-dot"></span>
                What Resuvibe Does
              </div>
              <h2 className="lp-section-title" id="lp-features-title">Every Tool You Need.<br />Completely Free.</h2>
              <p className="lp-section-sub">From AI resume tailoring to one-click cover letters — Resuvibe gives you the full AI job-search stack, no paywall required.</p>
            </div>

            <div className="lp-features-grid">

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">📄</div>
                <h3 className="lp-feature-title">AI Resume Tailoring</h3>
                <p className="lp-feature-desc">Paste any job listing and Resuvibe rewrites your resume to match — surfacing your most relevant experience and using the exact language hiring managers are looking for.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">✉️</div>
                <h3 className="lp-feature-title">Custom Cover Letters</h3>
                <p className="lp-feature-desc">Generate a compelling, personalized cover letter for every application in seconds. No more staring at a blank page — just a strong, job-specific letter ready to send.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">🎯</div>
                <h3 className="lp-feature-title">ATS Keyword Matching</h3>
                <p className="lp-feature-desc">Our AI identifies the exact keywords and phrases from the job description and weaves them naturally into your resume, so it clears automated screening every time.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">⚡</div>
                <h3 className="lp-feature-title">Instant Generation</h3>
                <p className="lp-feature-desc">From job listing to tailored application in under 60 seconds. Apply to more opportunities, faster — without sacrificing quality or relevance on any of them.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">🔒</div>
                <h3 className="lp-feature-title">Your Data, Your Control</h3>
                <p className="lp-feature-desc">Your career history is yours. We use your information to build better applications — and nothing else. No selling data. No sharing. No surprises.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon-wrap" aria-hidden="true">∞</div>
                <h3 className="lp-feature-title">Unlimited Applications</h3>
                <p className="lp-feature-desc">Apply to as many jobs as you want. Every single application gets the same thorough AI treatment — perfectly tailored, at no cost, with no cap.</p>
              </article>

            </div>
          </div>
        </section>


        {/* ─── How It Works ─────────────────────────────────────────────── */}
        <section className="lp-how-section" id="lp-how-it-works" aria-labelledby="lp-how-title">
          <div className="lp-container">

            <div className="lp-section-header">
              <div className="lp-section-eyebrow" style={{ justifyContent: "center" }}>
                <span className="lp-section-eyebrow-dot"></span>
                Simple by Design
              </div>
              <h2 className="lp-section-title" id="lp-how-title">Three Steps to Your Best Application</h2>
              <p className="lp-section-sub">No complicated setup. No lengthy onboarding. Just fast, intelligent documents that represent your absolute best self.</p>
            </div>

            <div className="lp-steps-track" role="list">

              <div className="lp-step" role="listitem">
                <div className="lp-step-num" aria-label="Step one">1</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">Share Your Background</h3>
                  <p className="lp-step-desc">Tell Resuvibe about your work history, skills, and accomplishments — once. We'll keep everything ready for every future application.</p>
                </div>
              </div>

              <div className="lp-step" role="listitem">
                <div className="lp-step-num" aria-label="Step two">2</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">Paste the Job Listing</h3>
                  <p className="lp-step-desc">Copy and paste any job description from any job board. Our AI reads it the same way an ATS does — and then optimizes your application to beat it.</p>
                </div>
              </div>

              <div className="lp-step" role="listitem">
                <div className="lp-step-num" aria-label="Step three">3</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">Download &amp; Apply</h3>
                  <p className="lp-step-desc">Receive a tailored resume and cover letter, ready to submit. Optimized for the algorithm. Written to impress the human on the other side.</p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ─── Testimonials ─────────────────────────────────────────────── */}
        <section className="lp-testimonials-section" aria-labelledby="lp-testimonials-title">
          <div className="lp-container">

            <div className="lp-section-header">
              <div className="lp-section-eyebrow" style={{ justifyContent: "center" }}>
                <span className="lp-section-eyebrow-dot"></span>
                Real Job Seekers
              </div>
              <h2 className="lp-section-title" id="lp-testimonials-title">Getting Interviews. Landing Jobs.</h2>
            </div>

            <div className="lp-testimonials-grid">

              <article className="lp-testimonial-card">
                <div className="lp-t-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="lp-t-quote">
                  "I was getting zero callbacks after dozens of applications. What changed things wasn't just the tailoring — it was finally feeling confident that my resume would actually survive an ATS scan. For the first time, I knew my application would be seen by a real person."
                </blockquote>
                <div className="lp-t-author">
                  <div className="lp-t-avatar" aria-hidden="true">MR</div>
                  <div>
                    <div className="lp-t-name">Marcus R.</div>
                    <div className="lp-t-role">Software Engineer · Hired at a Series B startup</div>
                  </div>
                </div>
              </article>

              <article className="lp-testimonial-card">
                <div className="lp-t-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="lp-t-quote">
                  "I always knew my experience was strong, but my resume wasn't showing it. Resuvibe helped me speak the right language for each role. My applications feel so much more targeted and relevant now."
                </blockquote>
                <div className="lp-t-author">
                  <div className="lp-t-avatar" aria-hidden="true">JL</div>
                  <div>
                    <div className="lp-t-name">Jennifer L.</div>
                    <div className="lp-t-role">Financial Analyst · Made a successful career change</div>
                  </div>
                </div>
              </article>

              <article className="lp-testimonial-card">
                <div className="lp-t-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="lp-t-quote">
                  "The cover letters alone are worth it. I used to spend an hour writing each one. Now it takes 30 seconds and they're genuinely better than anything I was writing myself."
                </blockquote>
                <div className="lp-t-author">
                  <div className="lp-t-avatar" aria-hidden="true">DK</div>
                  <div>
                    <div className="lp-t-name">David K.</div>
                    <div className="lp-t-role">Marketing Manager · Recently promoted</div>
                  </div>
                </div>
              </article>

            </div>
          </div>
        </section>


        {/* ─── Final CTA ────────────────────────────────────────────────── */}
        <section className="lp-cta-section" aria-labelledby="lp-cta-headline">
          <div className="lp-container">
            <div className="lp-cta-inner">
              <h2 className="lp-cta-headline" id="lp-cta-headline">
                Your Next Job Starts<br />with the <em>Right Resume.</em>
              </h2>
              <p className="lp-cta-sub">
                Join thousands of job seekers bringing AI to their job search — and finally competing on a level playing field.
              </p>
              <div className="lp-cta-buttons">
                <Link to="/applications/889931c5-30b7-4a1c-828b-358d0a8d6d49" className="lp-btn lp-btn-primary lp-btn-lg">Get Started Free</Link>
                <Link to="/applications/889931c5-30b7-4a1c-828b-358d0a8d6d49" className="lp-btn lp-btn-ghost-light lp-btn-lg">See Example</Link>
              </div>
              <p className="lp-cta-footnote">Free forever · No credit card · No catch</p>
            </div>
          </div>
        </section>
      </main>


      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-container">
          <div className="lp-footer-row">
            <Link to="/" className="lp-footer-logo">resu<em>vibe</em></Link>
            <nav className="lp-footer-links" aria-label="Footer navigation">
              <Link to="/about"   className="lp-footer-link">About</Link>
              <Link to="/privacy" className="lp-footer-link">Privacy</Link>
              <Link to="/terms"   className="lp-footer-link">Terms</Link>
              <Link to="/contact" className="lp-footer-link">Contact</Link>
            </nav>
          </div>
          <div className="lp-footer-divider" role="separator"></div>
          <p className="lp-footer-copy">© 2026 Resuvibe. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

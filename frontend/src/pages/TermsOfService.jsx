import React from "react";
import { Link } from "react-router-dom";

function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <Link
          to="/"
          className="inline-block text-sm text-slate-400 hover:text-white transition mb-8"
        >
          ← Back to MoneyMirror
        </Link>

        <p className="text-sm font-medium text-slate-400 mb-3">MoneyMirror</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Effective date: September 2, 2026
        </p>

        <div className="space-y-9 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. About the Service
            </h2>
            <p>
              MoneyMirror is a personal finance and expense-tracking
              application. It can use authorized Gmail access to identify
              transaction-related emails, extract transaction information, and
              present spending data and automated financial insights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Google Account Authorization
            </h2>
            <p>
              To use Gmail-connected features, you must authorize MoneyMirror
              through Google OAuth. You are responsible for using a Google
              account that you are authorized to access. You may revoke this
              authorization through your Google Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Your Responsibilities
            </h2>
            <p>
              You agree not to misuse the service, attempt unauthorized access,
              interfere with the application's operation, or use MoneyMirror in
              violation of applicable law or the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Accuracy of Extracted Data
            </h2>
            <p>
              Transaction information is extracted automatically from email
              content and may contain errors, omissions, incorrect categories,
              or duplicate or missing transactions. You should verify important
              financial information against the original source before relying
              on it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. AI-Generated Insights
            </h2>
            <p>
              Some MoneyMirror features use automated or AI-based processing.
              Outputs are informational and may be incomplete or inaccurate.
              MoneyMirror does not provide professional financial, investment,
              accounting, tax, or legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Service Availability
            </h2>
            <p>
              The service may occasionally be unavailable because of
              maintenance, infrastructure problems, third-party service
              outages, API limitations, or other technical issues. Continuous
              or error-free availability is not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Third-Party Services
            </h2>
            <p>
              MoneyMirror relies on third-party services, including Google
              services for authentication, Gmail access, and automated
              processing. Your use of those services may also be subject to
              their respective terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Account Access and Data Deletion
            </h2>
            <p>
              You may stop using MoneyMirror at any time and revoke Google
              authorization through your Google Account. You may request
              deletion of stored MoneyMirror account data by contacting the
              email address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, MoneyMirror
              and its developer are not liable for losses arising from reliance
              on automatically extracted information, AI-generated insights,
              service interruptions, or inaccurate or incomplete financial
              data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Changes to These Terms
            </h2>
            <p>
              These Terms may be updated as the service changes. The effective
              date at the top of this page will be updated when changes are
              made. Continued use of MoneyMirror after an update constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Contact
            </h2>
            <p>
              Questions about these Terms can be sent to:
              <br />
              <a
                href="mailto:testing15auth@gmail.com"
                className="text-white underline underline-offset-4"
              >
                testing15auth@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} MoneyMirror
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;

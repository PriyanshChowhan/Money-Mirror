import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Effective date: September 2, 2026
        </p>

        <div className="space-y-9 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. About MoneyMirror
            </h2>
            <p>
              MoneyMirror is a personal finance application that helps users
              organize and understand spending by identifying payment-related
              information from their Gmail account and presenting transaction
              history and financial insights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Google Account Information We Access
            </h2>
            <p>
              MoneyMirror uses Google OAuth 2.0 for sign-in and requests access
              to your Google profile information, including your Google account
              identifier, name, and email address. It also requests Gmail
              read-only access so the application can read relevant email
              messages for transaction extraction.
            </p>
            <p className="mt-3">
              MoneyMirror does not request permission to send, modify, or delete
              Gmail messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. How Gmail Data Is Used
            </h2>
            <p>
              Gmail data is accessed for the purpose of identifying
              payment-related emails and extracting transaction information
              such as amount, currency, date, merchant, and category. The
              application may use the Gmail message identifier to avoid
              processing the same transaction more than once.
            </p>
            <p className="mt-3">
              Raw email text is processed during synchronization but is not
              stored as a transaction record in MoneyMirror's database.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Use of Google Gemini
            </h2>
            <p>
              MoneyMirror uses Google's Gemini service to analyze email content
              and extract structured transaction information. This means email
              content selected for transaction processing may be transmitted to
              Google's Gemini service for automated analysis.
            </p>
            <p className="mt-3">
              MoneyMirror stores the resulting structured transaction data
              rather than storing the raw email body as part of the transaction
              record.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Information We Store
            </h2>
            <p>Depending on your use of the service, MoneyMirror may store:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Your Google account identifier, name, and email address.</li>
              <li>
                Google OAuth access and refresh tokens used to maintain
                authorized access to your account.
              </li>
              <li>
                Extracted transaction data, including amount, currency, date,
                merchant, category, confidence information, and Gmail message
                identifiers.
              </li>
              <li>
                Synchronization records used to track when Gmail was last
                checked.
              </li>
              <li>
                Other financial preferences or application data you create
                while using MoneyMirror.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Authentication and Cookies
            </h2>
            <p>
              After successful authentication, MoneyMirror uses an HTTP-only
              authentication cookie to keep you signed in. MoneyMirror does not
              ask for or store your Google password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Google API Services User Data Policy
            </h2>
            <p>
              MoneyMirror's use and transfer to any other app of information
              received from Google APIs will adhere to the Google API Services
              User Data Policy, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Data Sharing
            </h2>
            <p>
              MoneyMirror does not sell your personal information. Data may be
              processed by service providers that are necessary to operate the
              application, including Google services used for authentication,
              Gmail access, and Gemini-based transaction extraction, as well as
              infrastructure and database services used to host the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Data Security
            </h2>
            <p>
              MoneyMirror uses reasonable technical measures designed to
              protect user data, including OAuth-based authorization,
              HTTP-only authentication cookies, and HTTPS in production.
              However, no internet-based system can guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Revoking Google Access
            </h2>
            <p>
              You can revoke MoneyMirror's access to your Google account at any
              time from your Google Account's third-party connections or
              security settings. Revoking access prevents MoneyMirror from
              continuing to access Gmail through your authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Data Deletion
            </h2>
            <p>
              You may request deletion of your MoneyMirror account data by
              contacting us at the email address below. Revoking Google access
              does not automatically guarantee deletion of information already
              stored by MoneyMirror, so please contact us if you also want
              stored application data removed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy as MoneyMirror changes. Material
              changes will be reflected by updating the effective date shown on
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Contact
            </h2>
            <p>
              For privacy questions or data deletion requests, contact:
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

export default PrivacyPolicy;

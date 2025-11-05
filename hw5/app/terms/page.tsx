export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              To use our service, you must:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Register using an OAuth provider (Google, GitHub, or Facebook)</li>
              <li>Create a unique user ID (3-15 characters, alphanumeric + underscore)</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Conduct</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Post harmful, offensive, or illegal content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate others or provide false information</li>
              <li>Spam or engage in any automated posting</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Content Ownership</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of the content you post. By posting content, you grant us a license to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Display and distribute your content through our service</li>
              <li>Use your content for the purpose of operating the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Content Moderation</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Remove any content that violates these terms</li>
              <li>Suspend or terminate accounts that violate our policies</li>
              <li>Moderate content at our discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Service Availability</h2>
            <p className="text-gray-300 leading-relaxed">
              We strive to provide continuous service availability but do not guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Uninterrupted or error-free service</li>
              <li>Complete security of data transmission</li>
              <li>Availability of all features at all times</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Account Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              You may delete your account at any time. We may also suspend or terminate your account if you violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about these Terms of Service, please contact us through the application.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


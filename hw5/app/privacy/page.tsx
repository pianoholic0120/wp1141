export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Account information (email, name, user ID)</li>
              <li>Profile information (bio, avatar, background image)</li>
              <li>Content you create (posts, comments, likes)</li>
              <li>Social connections (follows, mentions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Provide and maintain our services</li>
              <li>Authenticate your account via OAuth providers</li>
              <li>Deliver real-time updates and notifications</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Data Sharing</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell your personal information. We may share your information only:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>With OAuth providers (Google, GitHub, Facebook) for authentication</li>
              <li>With service providers who assist in operating our platform</li>
              <li>When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Deletion</h2>
            <p className="text-gray-300 leading-relaxed">
              You can request deletion of your data at any time. For OAuth providers:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mt-2">
              <li>Facebook: Use the data deletion request feature in your Facebook settings</li>
              <li>Google: Manage your data through Google Account settings</li>
              <li>GitHub: Contact us or manage through GitHub settings</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Our data deletion callback URL: <code className="bg-gray-800 px-2 py-1 rounded">/api/facebook/data-deletion-callback</code>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Cookies and Tracking</h2>
            <p className="text-gray-300 leading-relaxed">
              We use session cookies to maintain your login session and provide authentication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us through the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
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


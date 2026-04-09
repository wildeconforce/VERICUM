import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: February 12, 2026</p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly:</p>
          <ul>
            <li>Account information (name, email, password)</li>
            <li>Profile information (display name, bio, avatar)</li>
            <li>Content metadata (EXIF data, C2PA manifests)</li>
            <li>Payment information (processed by Stripe)</li>
          </ul>
          <p>We also collect information automatically:</p>
          <ul>
            <li>Usage data (pages visited, actions taken)</li>
            <li>Device information (browser, OS, IP address)</li>
            <li>Cookies and similar technologies</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Verify content authenticity through our verification engine</li>
            <li>Communicate with you about your account</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>

          <h2>3. Content Metadata</h2>
          <p>When you upload content, we extract and store metadata (EXIF data, C2PA manifests) for verification purposes. This data may include camera information, GPS coordinates, and timestamps. Verification results are displayed publicly on content detail pages.</p>

          <h2>4. Data Sharing</h2>
          <p>We share information with:</p>
          <ul>
            <li><strong>Payment processors</strong>: Stripe processes all payments.</li>
            <li><strong>Buyers</strong>: Verification results and seller profile info are visible.</li>
            <li><strong>Legal requirements</strong>: When required by law or to protect rights.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>5. Data Security</h2>
          <p>We implement appropriate security measures to protect your data, including encryption, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure.</p>

          <h2>6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You can update your profile information from your Settings page or contact us for data deletion requests.</p>

          <h2>7. Cookies</h2>
          <p>We use cookies for authentication, preferences, and analytics. You can control cookie settings through your browser.</p>

          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.</p>

          <h2>9. Contact</h2>
          <p>For privacy-related questions, contact us at privacy@vericum.com.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

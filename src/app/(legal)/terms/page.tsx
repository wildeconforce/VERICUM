import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: February 12, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Vericum (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>

          <h2>2. Account Registration</h2>
          <p>You must create an account to buy or sell content. You are responsible for maintaining the security of your account and all activities under it. You must provide accurate and complete information during registration.</p>

          <h2>3. Content Licensing</h2>
          <p>All content sold on Vericum is licensed, not sold. The specific rights granted depend on the license type purchased:</p>
          <ul>
            <li><strong>Personal License</strong>: For personal, non-commercial use only.</li>
            <li><strong>Standard License</strong>: Commercial use in a single project.</li>
            <li><strong>Extended License</strong>: Commercial use across unlimited projects.</li>
            <li><strong>Exclusive License</strong>: Full rights transfer to the buyer.</li>
          </ul>

          <h2>4. Seller Obligations</h2>
          <p>Sellers warrant that they own or have the right to sell all content uploaded to Vericum. Content must not infringe on any third-party rights, including copyright, trademark, or privacy rights.</p>

          <h2>5. Verification</h2>
          <p>Vericum provides content verification using C2PA technology and other methods. While we strive for accuracy, verification results are provided as-is and do not constitute a guarantee of content authenticity or origin.</p>

          <h2>6. Payments and Commission</h2>
          <p>Vericum charges a 20% commission on all sales, plus a 5% buyer verification fee. Sellers receive 80% of the content price. Payments are processed through Stripe. Vericum is not responsible for payment processing delays or issues caused by third-party payment providers.</p>

          <h2>7. Prohibited Content</h2>
          <p>The following content is prohibited: illegal content, content depicting minors, content that infringes on intellectual property rights, malicious or harmful content, spam or misleading content.</p>

          <h2>8. Limitation of Liability</h2>
          <p>Vericum is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>

          <h2>9. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>

          <h2>10. Contact</h2>
          <p>For questions about these Terms, please contact us at legal@vericum.com.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

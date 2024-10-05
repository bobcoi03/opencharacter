import React from 'react';

export const runtime = "edge";

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 text-white mb-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for OpenCharacter</h1>
      <p className="mb-4"><strong>Effective Date: 04/10/2024</strong></p>

      <p className="mb-6">
        Welcome to OpenCharacter, we&apos;re creating the old c.ai site and open-sourcing it. We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines how we collect, use, and safeguard your information.
      </p>

      {[
        {
          title: "1. Information We Collect",
          content: [
            "<strong>Personal Information:</strong> We may collect personal information, such as your username and email address, when you register on our site.",
            "<strong>Usage Data:</strong> We automatically collect information about your interactions with the site, including IP address, browser type, and pages visited.",
            "<strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to enhance your experience and gather analytical data."
          ]
        },
        {
          title: "2. How We Use Your Information",
          content: [
            "To provide and maintain our services",
            "To improve, personalize, and expand our services",
            "To communicate with you for updates, marketing, or promotional content",
            "To monitor and analyze usage patterns and trends"
          ]
        },
        {
          title: "3. Information Sharing and Disclosure",
          content: [
            "We do not sell your personal information to third parties. We may share information with:",
            "Service providers involved in operating our site",
            "Legal authorities if required by law",
            "Third parties in the event of a merger, acquisition, or sale of assets"
          ]
        },
        {
          title: "4. Data Security",
          content: [
            "We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure."
          ]
        },
        {
          title: "5. Your Rights and Choices",
          content: [
            "You can access and update your personal information through your account settings.",
            "You have the right to request the deletion of your personal data.",
            "You can opt out of receiving marketing communications from us."
          ]
        },
        {
          title: "6. Third-Party Services",
          content: [
            "Our website may contain links to third-party sites. We are not responsible for the privacy practices of these sites and encourage you to read their privacy policies."
          ]
        },
        {
          title: "7. Changes to This Privacy Policy",
          content: [
            "We may update our Privacy Policy from time to time. Any changes will be posted on this page, and we will notify you via email or a prominent notice on our site."
          ]
        },
        {
          title: "8. Contact Us",
          content: [
            "If you have any questions or concerns regarding this Privacy Policy, please contact us at minh@everythingcompany.co"
          ]
        }
      ].map((section, index) => (
        <div key={index} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
          {Array.isArray(section.content) ? (
            <ul className="list-disc pl-6 space-y-2">
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          ) : (
            <p dangerouslySetInnerHTML={{ __html: section.content }} />
          )}
        </div>
      ))}
    </div>
  );
}
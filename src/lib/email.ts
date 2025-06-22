import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Theme } from "@auth/core/types";
import type { EmailConfig } from "@auth/core/providers/email";

// Initialize the SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

type AbandonedCartEmailProps = {
  email: string;
  userId: string;
  couponCode: string;
  sessionId: string;
};

export async function sendAbandonedCartEmail({ 
  email, 
  userId, 
  couponCode, 
  sessionId 
}: AbandonedCartEmailProps) {
  // Format current date
  const date = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  const params = {
    Source: process.env.SES_SENDER_EMAIL || "minh@everythingcompany.co",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Complete Your Subscription - Special Discount Inside!",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                  h1 { color: #2563eb; }
                  .coupon { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
                  .coupon-code { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2563eb; }
                  .btn { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                </style>
              </head>
              <body>
                <h1>Your Subscription is Waiting!</h1>
                <p>Hi there,</p>
                <p>We noticed you started to subscribe but didn't complete the checkout process. We'd love to have you join our community!</p>
                
                <div class="coupon">
                  <p>As a special offer, we're giving you a discount:</p>
                  <p class="coupon-code">${couponCode}</p>
                  <p>This code gives you 20% off for 3 months!</p>
                </div>
                
                <p>To use this discount, simply click the button below to resume your subscription:</p>
                
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans?coupon=${couponCode}" class="btn">Complete My Subscription</a>
                </p>
                
                <p>This special offer expires in 48 hours, so don't miss out!</p>
                
                <p>If you have any questions, just reply to this email - we're here to help.</p>
                
                <p>Best regards,<br>The Team</p>
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                  Sent on ${date}<br>
                  Reference: ${sessionId}
                </p>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `
            Your Subscription is Waiting!
            
            Hi there,
            
            We noticed you started to subscribe but didn't complete the checkout process. We'd love to have you join our community!
            
            As a special offer, we're giving you a discount: ${couponCode}
            
            This code gives you 20% off for 3 months!
            
            To use this discount, visit: ${process.env.NEXT_PUBLIC_APP_URL}/pricing?coupon=${couponCode}
            
            This special offer expires in 48 hours, so don't miss out!
            
            If you have any questions, just reply to this email - we're here to help.
            
            Best regards,
            The Team
            
            Sent on ${date}
            Reference: ${sessionId}
          `,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

interface CharacterReportEmailProps {
  reporterEmail: string;
  reporterId: string;
  characterId: string;
  characterName: string;
  reason: string;
}

export async function sendCharacterReportEmail({
  reporterEmail,
  reporterId,
  characterId,
  characterName,
  reason,
}: CharacterReportEmailProps) {
  const characterUrl = `${process.env.NEXT_PUBLIC_APP_URL}/character/${characterId}/profile`;
  const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL || "minh@everythingcompany.co"; // Use env variable or default

  const params = {
    Source: process.env.SES_SENDER_EMAIL || "minh@everythingcompany.co", // Use a noreply or specific sender
    Destination: {
      ToAddresses: [recipientEmail],
    },
    Message: {
      Subject: {
        Data: `Character Report: ${characterName} (ID: ${characterId})`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <html>
              <head>
                <style>
                  body { font-family: sans-serif; line-height: 1.5; }
                  p { margin-bottom: 10px; }
                  strong { font-weight: bold; }
                  pre { background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
                  a { color: #007bff; text-decoration: none; }
                  a:hover { text-decoration: underline; }
                </style>
              </head>
              <body>
                <h2>Character Report Received</h2>
                <p><strong>Character Name:</strong> ${characterName}</p>
                <p><strong>Character ID:</strong> ${characterId}</p>
                <p><strong>Character URL:</strong> <a href="${characterUrl}">${characterUrl}</a></p>
                <p><strong>Reported By (Email):</strong> ${reporterEmail}</p>
                <p><strong>Reported By (ID):</strong> ${reporterId}</p>
                <p><strong>Reason:</strong></p>
                <pre>${reason}</pre>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `
            Character Report Received
            -------------------------
            Character Name: ${characterName}
            Character ID: ${characterId}
            Character URL: ${characterUrl}
            Reported By (Email): ${reporterEmail}
            Reported By (ID): ${reporterId}
            Reason:
            ${reason}
          `,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log("Character report email sent successfully:", response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("Error sending character report email:", error);
    return { success: false, error: "Failed to send report email" };
  }
}

export async function sendVerificationRequestEmail(
  params: Parameters<EmailConfig["sendVerificationRequest"]>[0]
) {
  const { identifier: email, url, provider, theme } = params;
  const { host } = new URL(url);
  const escapedHost = host.replace(/\./g, "&#8203;.");

  const sesParams = {
    Source: provider.from,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Sign in to ${host}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html({ url, host: escapedHost, theme }),
          Charset: "UTF-8",
        },
        Text: {
          Data: text({ url, host }),
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(sesParams);
    await sesClient.send(command);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error}`);
  }
}

function html(params: { url: string; host: string; theme: Theme }) {
  const { url, host, theme } = params;

  const escapedHost = host.replace(/\./g, "&#8203;.");

  const brandColor = theme.brandColor || "#346df1";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || "#fff",
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px 0px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}

// --- New function for Magic Link ---
interface SendMagicLinkEmailParams {
  email: string;
  url: string;   // The verification URL with the token
  host: string;  // The hostname of your app
}

export async function sendMagicLinkEmail({
  email,
  url,
  host,
}: SendMagicLinkEmailParams) {
  console.log(`Sending OpenCharacter magic link to ${email} via SES`);
  const escapedHost = host.replace(/\./g, "&#8203;.");
  // Use the hardcoded logo URL
  const logoUrl = `https://opencharacter.org/opencharacter_icon.png`;

  const params = {
    Source: `OpenCharacter <${process.env.SES_SENDER_EMAIL || "minh@everythingcompany.co"}>`, // Add App Name to Source
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        // Update Subject Line
        Data: `Sign in to OpenCharacter`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          // Pass logoUrl to HTML generator
          Data: magicLinkHtml({ url, host: escapedHost, logoUrl }),
          Charset: "UTF-8",
        },
        Text: {
          // Update Text version
          Data: magicLinkText({ url, host }),
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    console.log(`OpenCharacter magic link email successfully sent to ${email}`);
  } catch (error) {
    console.error("Error sending magic link email via SES:", error);
    // Re-throw the error to be caught by the API route
    throw new Error(`Failed to send magic link email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function for Magic Link HTML content (Updated)
function magicLinkHtml(params: { url: string; host: string; logoUrl: string }) {
  const { url, host, logoUrl } = params;
  const brandColor = "#346df1"; // Example brand color
  const color = {
    background: "#f0f2f5", // Light gray background
    text: "#333333",      // Darker text
    mainBackground: "#ffffff", // White main area
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: "#ffffff",
    footerText: "#888888" // Lighter text for footer
  };

  return `
<body style="margin: 0; padding: 0; width: 100%; background-color: ${color.background}; font-family: Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${color.background};">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="40" style="max-width: 600px; width: 100%; margin: 40px auto; background-color: ${color.mainBackground}; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="${logoUrl}" alt="OpenCharacter Logo" width="80" height="80" style="display: block;">
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; font-size: 24px; font-weight: bold; color: ${color.text};">
              Sign in to OpenCharacter
            </td>
          </tr>
          <!-- Main text -->
          <tr>
             <td align="center" style="padding: 0 0 30px 0; font-size: 16px; line-height: 1.5; color: ${color.text};">
               Click the button below to securely sign in to your OpenCharacter account.
             </td>
          </tr>
          <!-- Button -->
          <tr>
            <td align="center" style="padding: 0 0 30px 0;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}">
                    <a href="${url}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">
                      Sign In Securely
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer text -->
          <tr>
            <td align="center" style="padding: 0; font-size: 14px; line-height: 1.5; color: ${color.footerText};">
              If you did not request this email, you can safely ignore it.<br>This link is valid for 15 minutes.
            </td>
          </tr>
           <tr>
            <td align="center" style="padding: 30px 0 0 0; font-size: 12px; color: ${color.footerText};">
              © ${new Date().getFullYear()} OpenCharacter. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;
}

// Helper function for Magic Link plain text content (Updated)
function magicLinkText({ url, host }: { url: string; host: string }) {
  return `Sign in to OpenCharacter\n\nClick the link below to sign in:\n${url}\n\nThis link is valid for 15 minutes.\n\nIf you didn't request this email, please ignore it.\n\n© ${new Date().getFullYear()} OpenCharacter`;
} 
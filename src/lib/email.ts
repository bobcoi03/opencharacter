import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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
  const characterUrl = `${process.env.NEXT_PUBLIC_APP_URL}/character/${characterId}`;
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
// Email service utility for sending support emails
// This is a placeholder implementation that can be easily replaced with actual email providers

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

interface SupportEmailData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  userId: string;
  requestId: string;
}

export async function sendSupportEmail(data: SupportEmailData): Promise<boolean> {
  try {
    const emailData: EmailData = {
      to: process.env.SUPPORT_EMAIL || 'support@sweatshares.com',
      from: process.env.FROM_EMAIL || 'noreply@sweatshares.com',
      subject: `[Support] ${data.subject}`,
      html: generateSupportEmailHTML(data),
      text: generateSupportEmailText(data)
    };

    // For now, just log the email
    // In production, replace this with your email service integration
    console.log('Support Email to be sent:', emailData);

    // TODO: Integrate with your preferred email service
    // Examples:
    
    // SendGrid
    // await sendGridEmail(emailData);
    
    // Mailgun
    // await mailgunEmail(emailData);
    
    // AWS SES
    // await sesEmail(emailData);
    
    // Resend
    // await resendEmail(emailData);

    return true;
  } catch (error) {
    console.error('Error sending support email:', error);
    return false;
  }
}

function generateSupportEmailHTML(data: SupportEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Support Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #555; }
        .field-value { margin-top: 5px; }
        .message-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🆘 New Support Request</h2>
          <p>A new support request has been submitted through the website.</p>
        </div>
        
        <div class="field">
          <div class="field-label">From:</div>
          <div class="field-value">${data.name} (${data.email})</div>
        </div>
        
        <div class="field">
          <div class="field-label">Category:</div>
          <div class="field-value">${data.category}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Subject:</div>
          <div class="field-value">${data.subject}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Message:</div>
          <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="field">
          <div class="field-label">User ID:</div>
          <div class="field-value">${data.userId}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Request ID:</div>
          <div class="field-value">${data.requestId}</div>
        </div>
        
        <div class="footer">
          <p>This email was sent from the SweatShares support system.</p>
          <p>Please respond to this request within 24 hours.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSupportEmailText(data: SupportEmailData): string {
  return `
New Support Request

From: ${data.name} (${data.email})
Category: ${data.category}
Subject: ${data.subject}

Message:
${data.message}

User ID: ${data.userId}
Request ID: ${data.requestId}

---
This email was sent from the SweatShares support system.
Please respond to this request within 24 hours.
  `.trim();
}

// Example integrations with popular email services

// SendGrid integration example
export async function sendGridEmail(data: EmailData): Promise<boolean> {
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // try {
  //   await sgMail.send(data);
  //   return true;
  // } catch (error) {
  //   console.error('SendGrid error:', error);
  //   return false;
  // }
  
  console.log('SendGrid email would be sent:', data);
  return true;
}

// Mailgun integration example
export async function mailgunEmail(data: EmailData): Promise<boolean> {
  // const formData = require('form-data');
  // const Mailgun = require('mailgun.js');
  // const mailgun = new Mailgun(formData);
  // const client = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
  
  // try {
  //   await client.messages.create(process.env.MAILGUN_DOMAIN, {
  //     from: data.from,
  //     to: data.to,
  //     subject: data.subject,
  //     html: data.html,
  //     text: data.text
  //   });
  //   return true;
  // } catch (error) {
  //   console.error('Mailgun error:', error);
  //   return false;
  // }
  
  console.log('Mailgun email would be sent:', data);
  return true;
}

// AWS SES integration example
export async function sesEmail(data: EmailData): Promise<boolean> {
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  //   region: process.env.AWS_REGION || 'us-east-1'
  // });
  
  // try {
  //   await ses.sendEmail({
  //     Source: data.from,
  //     Destination: { ToAddresses: [data.to] },
  //     Message: {
  //       Subject: { Data: data.subject },
  //       Body: {
  //         Html: { Data: data.html },
  //         Text: { Data: data.text || data.html.replace(/<[^>]*>/g, '') }
  //       }
  //     }
  //   }).promise();
  //   return true;
  // } catch (error) {
  //   console.error('AWS SES error:', error);
  //   return false;
  // }
  
  console.log('AWS SES email would be sent:', data);
  return true;
}

// Resend integration example
export async function resendEmail(data: EmailData): Promise<boolean> {
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  
  // try {
  //   await resend.emails.send({
  //     from: data.from,
  //     to: data.to,
  //     subject: data.subject,
  //     html: data.html,
  //     text: data.text
  //   });
  //   return true;
  // } catch (error) {
  //   console.error('Resend error:', error);
  //   return false;
  // }
  
  console.log('Resend email would be sent:', data);
  return true;
} 
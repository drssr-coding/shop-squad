import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure nodemailer with your SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

interface EmailData {
  to: string;
  template: 'payment-request' | 'payment-confirmation' | 'payment-notification' | 'party-complete';
  data: {
    partyTitle: string;
    partyDate: any;
    partyLocation: string;
    organizerName: string;
    totalAmount: number;
    recipientName?: string;
    amount?: number;
    products?: Array<{
      title: string;
      price: number;
    }>;
    payerName?: string;
  };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (date: any): string => {
  return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getEmailTemplate = (template: string, data: EmailData['data']): { subject: string; html: string } => {
  switch (template) {
    case 'payment-request':
      return {
        subject: `Payment Request for ${data.partyTitle}`,
        html: `
          <h2>Payment Request for ${data.partyTitle}</h2>
          <p>Hi ${data.recipientName},</p>
          <p>The shopping squad leader ${data.organizerName} has initiated the payment collection for "${data.partyTitle}".</p>
          
          <h3>Your Items:</h3>
          <ul>
            ${data.products?.map(product => `
              <li>${product.title} - ${formatCurrency(product.price)}</li>
            `).join('')}
          </ul>
          
          <p><strong>Your Total: ${formatCurrency(data.amount || 0)}</strong></p>
          
          <p>Meeting Details:</p>
          <ul>
            <li>Date: ${formatDate(data.partyDate)}</li>
            <li>Location: ${data.partyLocation}</li>
          </ul>
          
          <p>Please log in to ShopSquad to complete your payment.</p>
        `
      };

    case 'payment-confirmation':
      return {
        subject: `Payment Confirmed for ${data.partyTitle}`,
        html: `
          <h2>Payment Confirmation</h2>
          <p>Hi ${data.recipientName},</p>
          <p>Your payment of ${formatCurrency(data.amount || 0)} for "${data.partyTitle}" has been confirmed.</p>
          
          <p>Meeting Details:</p>
          <ul>
            <li>Date: ${formatDate(data.partyDate)}</li>
            <li>Location: ${data.partyLocation}</li>
          </ul>
          
          <p>See you at the shopping squad!</p>
        `
      };

    case 'payment-notification':
      return {
        subject: `Payment Received for ${data.partyTitle}`,
        html: `
          <h2>Payment Notification</h2>
          <p>Hi ${data.organizerName},</p>
          <p>${data.payerName} has completed their payment for "${data.partyTitle}".</p>
          <p>You can check the payment status in your ShopSquad dashboard.</p>
        `
      };

    case 'party-complete':
      return {
        subject: `Shopping Squad Complete: ${data.partyTitle}`,
        html: `
          <h2>Shopping Squad Complete</h2>
          <p>Hi ${data.recipientName},</p>
          <p>All payments have been completed for "${data.partyTitle}"!</p>
          
          <p>Meeting Details:</p>
          <ul>
            <li>Date: ${formatDate(data.partyDate)}</li>
            <li>Location: ${data.partyLocation}</li>
          </ul>
          
          <p>Total Squad Amount: ${formatCurrency(data.totalAmount)}</p>
          <p>See you at the meeting point!</p>
        `
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
};

export const sendEmail = functions.https.onCall(async (data: EmailData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { subject, html } = getEmailTemplate(data.template, data.data);

    await transporter.sendMail({
      from: `"ShopSquad" <${functions.config().email.user}>`,
      to: data.to,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Error sending email');
  }
});
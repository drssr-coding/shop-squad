import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_7c1oqes';
const EMAILJS_PUBLIC_KEY = '-5oxe3Z7oLCoKFUCE';

interface EmailData {
  to: string;
  template: 'payment_req' | 'party_complete';
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

const TEMPLATE_IDS = {
  'payment_req': 'template_mhxw3qh',
  'party_complete': 'template_3mmv4ns'
};

export const sendEmail = async (emailData: EmailData) => {
  try {
    const templateParams = {
      to_email: emailData.to,
      ...emailData.data,
      products_list: emailData.data.products?.map(p => 
        `${p.title} - $${p.price.toFixed(2)}`
      ).join('\n')
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_IDS[emailData.template],
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
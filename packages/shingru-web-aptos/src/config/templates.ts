export interface PaymentTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  perfectFor: string;
  icon: string;
  isPrimary?: boolean;
  isComingSoon?: boolean;
  color?: string;
}

export const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: "simple-payment",
    title: "Simple Payment",
    subtitle: '"Just send me money!"',
    description: "Basic payment link. Share it, get paid.",
    perfectFor: "Everything else",
    icon: "/assets/payment-template/simple-payment.svg",
    isPrimary: true,
    isComingSoon: false,
    color: "#00CE2B",
  },
  {
    id: "digital-product",
    title: "Digital Product",
    subtitle: '"Buy my design pack - $25"',
    description: "Sell digital files with instant delivery.",
    perfectFor: "Selling digital stuff",
    icon: "/assets/payment-template/digital-product.svg",
    isPrimary: true,
    isComingSoon: false,
    color: "#DB2BEF",
  },
  {
    id: "fundraiser",
    title: "Fundraiser",
    subtitle: '"Help me reach $1,000!"',
    description: "Collect money toward a goal with progress bar.",
    perfectFor: "Raising funds for something",
    icon: "/assets/payment-template/fundraising.svg",
    isComingSoon: false,
    color: "#FFAC00",
  },
  {
    id: "payment-request",
    title: "Payment Request",
    subtitle: '"You owe me $50"',
    description: "Ask someone specific to pay you.",
    perfectFor: "When someone owes you",
    icon: "/assets/payment-template/one-time-request.svg",
    isPrimary: true,
    isComingSoon: true,
    color: "#0092FF",
  },
];

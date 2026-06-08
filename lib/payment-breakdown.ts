type NumericLike = number | string | null | undefined;

export interface PaymentBreakdownInput {
  productsTotal?: NumericLike;
  subtotal?: NumericLike;
  installationCharges?: NumericLike;
  amcCharges?: NumericLike;
  deliveryCharges?: NumericLike;
  taxAmount?: NumericLike;
  totalAmount?: NumericLike;
  paymentMethod?: string | null;
  codFlatAmount?: NumericLike;
  discountAmount?: NumericLike;
  referralDiscount?: NumericLike;
  pointsRedeemed?: NumericLike;
}

export interface PaymentBreakdownResult {
  actualProductPrice: number;
  installationCharges: number;
  amcCharges: number;
  deliveryCharges: number;
  netBaseAmount: number;
  gstAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  codExtraCharges: number;
  totalAmount: number;
  storedTotalAmount: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

const toAmount = (value: NumericLike): number => {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function buildPaymentBreakdown(input: PaymentBreakdownInput): PaymentBreakdownResult {
  const paymentMethod = String(input.paymentMethod || '').toLowerCase();
  const isCod = paymentMethod === 'cod';

  const actualProductPrice = round2(toAmount(input.productsTotal || input.subtotal));
  const installationCharges = round2(toAmount(input.installationCharges));
  const amcCharges = round2(toAmount(input.amcCharges));
  const deliveryCharges = round2(toAmount(input.deliveryCharges));

  const discountAmount = round2(toAmount(input.discountAmount));
  const referralDiscount = round2(toAmount(input.referralDiscount));
  const pointsRedeemed = round2(toAmount(input.pointsRedeemed));

  const grossBaseAmount = round2(actualProductPrice + installationCharges + amcCharges + deliveryCharges);
  const netBaseAmount = round2(Math.max(0, grossBaseAmount - discountAmount - referralDiscount - pointsRedeemed));

  const storedTotalAmount = round2(toAmount(input.totalAmount));
  const codFlatAmount = round2(toAmount(input.codFlatAmount));

  const codExtraCharges = isCod ? codFlatAmount : 0;
  const taxableAmount = round2(netBaseAmount + codExtraCharges);
  const sgstAmount = round2(taxableAmount * 0.09);
  const cgstAmount = round2(taxableAmount * 0.09);
  const gstAmount = round2(sgstAmount + cgstAmount);
  const totalAmount = round2(taxableAmount + gstAmount);

  return {
    actualProductPrice,
    installationCharges,
    amcCharges,
    deliveryCharges,
    netBaseAmount,
    gstAmount,
    sgstAmount,
    cgstAmount,
    codExtraCharges: round2(codExtraCharges),
    totalAmount,
    storedTotalAmount,
  };
}

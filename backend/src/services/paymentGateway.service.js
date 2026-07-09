const crypto = require('crypto');
const env = require('../config/env');

/**
 * Sandbox/mock payment gateways used until real Zaad and e-Dahab merchant
 * credentials are available. Each gateway implements the same
 * { initiate, checkStatus } interface a real integration would, so
 * swapping in a real HTTP client later requires no caller-side changes —
 * only the two methods below need real implementations.
 *
 * Sandbox test scenarios (mirroring how real gateway sandboxes use magic
 * test card/account numbers): `checkStatus` looks at the last 4 digits of
 * the payer's phone number to decide the outcome, so the mobile app and
 * tests can deterministically exercise every path:
 *   - ends in 0000, or any unrecognized number: succeeds
 *   - ends in 1111: fails with "insufficient_funds"
 *   - ends in 2222: fails with "timeout"
 *   - ends in 3333: stays "processing" forever (customer never confirms
 *     the USSD prompt) — useful for testing the "still processing" UI
 */
function classifyMobileMoneyOutcome(payerPhone) {
  const suffix = (payerPhone || '').replace(/\D/g, '').slice(-4);
  if (suffix === '1111') return { status: 'failed', failureReason: 'insufficient_funds' };
  if (suffix === '2222') return { status: 'failed', failureReason: 'timeout' };
  if (suffix === '3333') return { status: 'processing', failureReason: '' };
  return { status: 'completed', failureReason: '' };
}

function buildMobileMoneyGateway(providerName) {
  return {
    providerName,
    async initiate({ amount, currency, reference, payerPhone }) {
      return {
        providerReference: `${providerName.toUpperCase()}-${crypto.randomInt(1000000, 9999999)}`,
        status: 'processing',
        rawResponse: {
          provider: providerName,
          amount,
          currency,
          reference,
          payerPhone,
          sandbox: true,
          message: `${providerName} sandbox payment request sent to ${payerPhone || 'the payer'}`,
        },
      };
    },
    async checkStatus(providerReference, { payerPhone } = {}) {
      const { status, failureReason } = classifyMobileMoneyOutcome(payerPhone);
      return {
        status,
        failureReason,
        rawResponse: {
          provider: providerName,
          providerReference,
          sandbox: true,
          message:
            status === 'completed'
              ? `${providerName} sandbox payment confirmed`
              : status === 'processing'
                ? `${providerName} sandbox payment still awaiting customer confirmation`
                : `${providerName} sandbox payment failed: ${failureReason}`,
        },
      };
    },
  };
}

const cashOnDeliveryGateway = {
  providerName: 'cod',
  async initiate({ amount, currency, reference }) {
    return {
      providerReference: `COD-${reference}`,
      status: 'pending',
      rawResponse: { provider: 'cod', amount, currency, message: 'Payable on delivery' },
    };
  },
  async checkStatus(providerReference) {
    return {
      status: 'pending',
      failureReason: '',
      rawResponse: {
        provider: 'cod',
        providerReference,
        message: 'Cash on delivery is settled on delivery, not verified in advance',
      },
    };
  },
};

const gateways = {
  zaad: buildMobileMoneyGateway('zaad'),
  edahab: buildMobileMoneyGateway('edahab'),
  cod: cashOnDeliveryGateway,
};

const webhookSecrets = {
  zaad: env.payments.zaadWebhookSecret,
  edahab: env.payments.edahabWebhookSecret,
};

function getGateway(method) {
  const gateway = gateways[method];
  if (!gateway) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  return gateway;
}

function getWebhookSecret(provider) {
  return webhookSecrets[provider];
}

/** HMAC-SHA256 signature a real Zaad/e-Dahab webhook would attach to its callback body. */
function signWebhookPayload(provider, rawBody) {
  const secret = getWebhookSecret(provider);
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

function verifyWebhookSignature(provider, rawBody, signature) {
  const expected = signWebhookPayload(provider, rawBody);
  if (!expected || !signature) return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(String(signature), 'hex');
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

module.exports = {
  getGateway,
  signWebhookPayload,
  verifyWebhookSignature,
};

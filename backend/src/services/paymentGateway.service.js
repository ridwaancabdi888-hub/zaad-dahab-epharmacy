const crypto = require('crypto');

/**
 * Sandbox/mock payment gateway used until real Zaad and e-Dahab merchant
 * credentials are available. Real integrations should implement the same
 * { initiate, confirm } interface and be selected in `getGateway` below,
 * without any caller-side changes.
 */
function buildMockGateway(providerName) {
  return {
    providerName,
    async initiate({ amount, currency, reference }) {
      return {
        providerReference: `${providerName.toUpperCase()}-${crypto.randomInt(1000000, 9999999)}`,
        status: 'processing',
        rawResponse: {
          provider: providerName,
          amount,
          currency,
          reference,
          sandbox: true,
          message: `${providerName} sandbox payment initiated`,
        },
      };
    },
    async confirm(providerReference) {
      return {
        status: 'completed',
        rawResponse: {
          provider: providerName,
          providerReference,
          sandbox: true,
          message: `${providerName} sandbox payment confirmed`,
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
  async confirm(providerReference) {
    return {
      status: 'completed',
      rawResponse: { provider: 'cod', providerReference, message: 'Cash collected on delivery' },
    };
  },
};

const gateways = {
  zaad: buildMockGateway('zaad'),
  edahab: buildMockGateway('edahab'),
  cod: cashOnDeliveryGateway,
};

function getGateway(method) {
  const gateway = gateways[method];
  if (!gateway) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  return gateway;
}

module.exports = { getGateway };

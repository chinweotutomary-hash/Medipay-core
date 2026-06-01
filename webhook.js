import express from 'express';
import crypto from 'crypto';
import { updateSaversWalletBalance, logTransaction, getTierLabelByAmount } from './database.js';

const router = express.Router();

// Merchant Secret Key issued by the OPay Developer Console
const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY || 'OPAY_SECRET_TEST_KEY_12345';

/**
 * POST /api/v1/medipay/opay-webhook
 * Dynamic real-time webhook consumer to ingest micro-insurance savings pool credits safely
 */
router.post('/opay-webhook', async (req, res) => {
  try {
    const payload = req.body;
    const incomingSignature = req.headers['opay-signature'];
    
    if (!incomingSignature) {
      return res.status(401).json({ status: 'FAIL', message: 'Missing cryptographic signature validation header' });
    }

    // Cryptographic Sign Check: Compute SHA256 HMAC hash to protect balances against malicious tampering
    const computedSignature = crypto
      .createHmac('sha256', OPAY_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (incomingSignature !== computedSignature) {
      console.warn(`[SECURITY BREACH DETECTED] Signature discrepancy flagged for order string: ${payload.outOrderNo}`);
      return res.status(403).json({ status: 'FAIL', message: 'Cryptographic validation mismatch' });
    }

    const { orderStatus, amount, outOrderNo, customerId } = payload;
    const depositAmountNaira = parseFloat(amount);

    if (orderStatus === 'SUCCESSFUL') {
      // Map currency fractions to corresponding presentation bracket tiers 
      const activeTierLabel = getTierLabelByAmount(depositAmountNaira);

      console.log(`[LEDGER RECORD] Cleared ₦${depositAmountNaira} for Account: ${customerId}. Assigned: ${activeTierLabel}`);

      // Commit changes to the core escrow pool balances
      await updateSaversWalletBalance(customerId, depositAmountNaira);
      await logTransaction(outOrderNo, customerId, depositAmountNaira, `DEPOSIT_${activeTierLabel.toUpperCase().replace(/[\s()]/g, '_')}`);

      // Respond directly to OPay with success parameters to close out the request cycle
      return res.status(200).json({
        code: '0000',
        message: 'SUCCESS',
        data: { outOrderNo: outOrderNo }
      });
    }

    if (orderStatus === 'FAILED') {
      console.warn(`[POOL ALERT] Transaction failed (Insufficient User Wallet Funds) for Order: ${outOrderNo}`);
      await logTransaction(outOrderNo, customerId, 0, 'DEPOSIT_FAILED_INSUFFICIENT_FUNDS');
      return res.status(200).json({ code: '0000', message: 'Transaction failure logged' });
    }

  } catch (error) {
    console.error("[WEBHOOK EXCEPTION] Server encountered an invalid parsing matrix:", error);
    return res.status(500).json({ status: 'FAIL', message: 'Internal Payment Processing Exception' });
  }
});

export default router;

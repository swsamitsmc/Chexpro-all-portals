import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { sendEmail } from '../utils/email';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Initialize Stripe if available
const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-04-10' as const }) : null;

// ============================================================
// ZOD SCHEMAS
// ============================================================

const paymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
});

// ============================================================
// PUBLIC WEBHOOK ROUTE (must be before authenticate middleware)
// ============================================================

// POST /api/v1/billing/webhook
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!stripe || !env.stripeWebhookSecret) {
      return sendError(res, 503, 'NOT_CONFIGURED', 'Payment processing not configured');
    }

    let event: Stripe.Event;
    
    try {
      // Get raw body for verification
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret);
    } catch (err: any) {
      return sendError(res, 400, 'INVALID_SIGNATURE', `Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { invoiceId, clientId } = paymentIntent.metadata;
        
        if (invoiceId) {
          // Update invoice status
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { 
              status: 'paid',
              paidAt: new Date(),
            },
          });

          // Create payment record
          await prisma.payment.create({
            data: {
              clientId,
              invoiceId,
              amount: Number(paymentIntent.amount) / 100,
              paymentMethod: 'stripe',
              transactionId: paymentIntent.id,
              status: 'completed',
            },
          });

          // Send confirmation email
          const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: { select: { email: true, companyName: true } } },
          });

          if (invoice?.client?.email) {
            await sendEmail({
              to: invoice.client.email,
              subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
              html: `
                <h2>Payment Received</h2>
                <p>We have received your payment for invoice ${invoice.invoiceNumber}.</p>
                <p>Amount: $${invoice.total}</p>
                <p>Thank you for your business!</p>
              `,
              text: `Payment received for invoice ${invoice.invoiceNumber}. Amount: $${invoice.total}`,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { invoiceId } = paymentIntent.metadata;
        
        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'overdue' },
          });
        }
        break;
      }

      default:
        // Ignore other events
        break;
    }

    return sendSuccess(res, { received: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

router.use(authenticate as any);

// ============================================================
// BILLING ACCOUNT
// ============================================================

// GET /api/v1/billing/account
router.get('/account', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const billingAccount = await prisma.billingAccount.findUnique({
      where: { clientId: user.clientId },
    });

    if (!billingAccount) {
      return sendSuccess(res, {
        balance: 0,
        currency: 'CAD',
        paymentTerms: 'net30',
      });
    }

    return sendSuccess(res, {
      balance: billingAccount.creditBalance,
      currency: 'CAD',
      paymentTerms: billingAccount.billingModel === 'prepaid_credits' ? 'prepaid' : 'net30',
      billingModel: billingAccount.billingModel,
      monthlyBudget: billingAccount.monthlyBudget,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// INVOICES
// ============================================================

// GET /api/v1/billing/invoices
router.get('/invoices', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;

    const where: any = { clientId: user.clientId };
    if (status === 'paid') {
      where.status = 'paid';
    } else if (status === 'unpaid') {
      where.status = { in: ['draft', 'sent'] };
    } else if (status === 'overdue') {
      where.status = 'overdue';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          dueDate: true,
          createdAt: true,
          paidAt: true,
          _count: { select: { lineItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    return sendSuccess(res, {
      items: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/billing/invoices/:id
router.get('/invoices/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, clientId: user.clientId },
      include: {
        lineItems: true,
        client: { select: { companyName: true } },
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'NOT_FOUND', 'Invoice not found');
    }

    return sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/billing/invoices/:id/download
router.get('/invoices/:id/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, clientId: user.clientId },
      include: { lineItems: true },
    });

    if (!invoice) {
      return sendError(res, 404, 'NOT_FOUND', 'Invoice not found');
    }

    // Build CSV
    let csv = 'Description,Quantity,Unit Price,Total\n';
    
    invoice.lineItems.forEach(item => {
      csv += `"${item.description}",${item.quantity},${item.unitPrice},${item.total}\n`;
    });

    // Footer
    csv += `\nGrand Total,,,${invoice.total}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PAYMENT
// ============================================================

// POST /api/v1/billing/payment-intent
router.post('/payment-intent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = paymentIntentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { invoiceId } = parsed.data;

    // Check if Stripe is configured
    if (!stripe) {
      return sendError(res, 503, 'NOT_CONFIGURED', 'Payment processing not configured');
    }

    // Find invoice and verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: user.clientId },
    });

    if (!invoice) {
      return sendError(res, 404, 'NOT_FOUND', 'Invoice not found');
    }

    if (invoice.status !== 'draft' && invoice.status !== 'sent') {
      return sendError(res, 400, 'INVALID_STATUS', 'Invoice is not payable');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(invoice.total) * 100), // Convert to cents
      currency: 'cad',
      metadata: {
        invoiceId: invoice.id,
        clientId: user.clientId,
      },
    });

    return sendSuccess(res, {
      clientSecret: paymentIntent.client_secret,
      amount: invoice.total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

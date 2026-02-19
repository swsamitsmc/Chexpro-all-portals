import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { encryptField, decryptField } from '../services/encryptionService';
import { publishWizardCompleted } from '../services/redisPublisher';
import { addBusinessDays, maskSIN } from '../utils/helpers';

const router = Router();

// Step schemas
const step1Schema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  phone: z.string().min(1),
  gender: z.string().optional(),
  sin: z.string().optional(),
});

const step2Schema = z.object({
  currentAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Canada'),
    residenceType: z.string().optional(),
    yearsAtAddress: z.number().optional(),
  }),
});

const step3Schema = z.object({
  addressHistory: z.array(z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string(),
    from: z.string(),
    to: z.string().optional(),
  })),
});

const step4Schema = z.object({
  employmentHistory: z.array(z.object({
    employer: z.string().min(1),
    jobTitle: z.string().min(1),
    startDate: z.string(),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    supervisorName: z.string().optional(),
    supervisorContact: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    permissionToContact: z.boolean(),
  })),
});

const step5Schema = z.object({
  educationHistory: z.array(z.object({
    institution: z.string().min(1),
    degree: z.string().min(1),
    fieldOfStudy: z.string().optional(),
    graduationDate: z.string().optional(),
    studentId: z.string().optional(),
    didNotGraduate: z.boolean().optional(),
  })),
});

const step6Schema = z.object({
  otherNames: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    type: z.enum(['maiden', 'legal', 'alias']),
  })).optional(),
  licenses: z.string().optional(),
  criminalDisclosure: z.boolean(),
  criminalDetails: z.string().optional(),
  additionalInfo: z.string().optional(),
});

const step7Schema = z.object({
  signatureBase64: z.string().min(1),
  consentGiven: z.boolean().refine((val) => val === true, 'Consent is required'),
});

// GET /api/v1/wizard/status
router.get('/status', authenticateJWT, async (req, res: Response) => {
  try {
    const applicants = await prisma.applicant.findMany({
      where: { userId: req.user!.id },
      include: {
        order: {
          include: { client: true },
        },
      },
    });

    const orders = await Promise.all(
      applicants.map(async (applicant) => {
        const order = await prisma.order.findUnique({
          where: { id: applicant.orderId! },
          include: { client: true },
        });
        return order;
      })
    );

    const wizardStatuses = orders.filter(Boolean).map((order) => ({
      orderId: order!.id,
      orderNumber: order!.orderNumber,
      positionTitle: order!.positionTitle,
      clientName: order!.client?.companyName,
      wizardStatus: {
        completedSteps: (applicants.find(a => a.orderId === order!.id)?.completedSteps || []) as string[],
        portalCompleted: applicants.find(a => a.orderId === order!.id)?.portalCompleted || false,
      },
    }));

    res.json(successResponse(wizardStatuses));
  } catch (error) {
    console.error('Error getting wizard status:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get wizard status'));
  }
});

// GET /api/v1/wizard/:orderId
router.get('/:orderId', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId } = req.params;

    const applicant = await prisma.applicant.findFirst({
      where: {
        orderId,
        userId: req.user!.id,
      },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized to access this order'));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    let decryptedSin = null;
    if (applicant.sin) {
      try {
        const decrypted = decryptField(applicant.sin);
        decryptedSin = maskSIN(decrypted);
      } catch {
        decryptedSin = '***-***-**';
      }
    }

    res.json(successResponse({
      applicant: {
        ...applicant,
        sin: decryptedSin,
      },
      order: {
        orderNumber: order?.orderNumber,
        positionTitle: order?.positionTitle,
        packageName: order?.packageName,
        clientName: order?.client?.companyName,
        clientLogo: order?.client?.companyName?.charAt(0),
      },
      completedSteps: (applicant.completedSteps || []) as string[],
    }));
  } catch (error) {
    console.error('Error getting wizard data:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get wizard data'));
  }
});

// PUT /api/v1/wizard/:orderId/step/:stepNumber
router.put('/:orderId/step/:stepNumber', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId, stepNumber } = req.params;
    const step = parseInt(stepNumber, 10);

    const applicant = await prisma.applicant.findFirst({
      where: {
        orderId,
        userId: req.user!.id,
      },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    let updateData: Record<string, unknown> = {};
    let completedSteps = (applicant.completedSteps || []) as string[];

    switch (step) {
      case 1: {
        const data = step1Schema.parse(req.body);
        const encryptedSin = data.sin ? encryptField(data.sin) : null;
        updateData = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          phone: data.phone,
          gender: data.gender,
          sin: encryptedSin,
        };
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { firstName: data.firstName, lastName: data.lastName },
        });
        if (!completedSteps.includes('step1')) completedSteps.push('step1');
        break;
      }
      case 2: {
        const data = step2Schema.parse(req.body);
        updateData = { currentAddress: data.currentAddress };
        if (!completedSteps.includes('step2')) completedSteps.push('step2');
        break;
      }
      case 3: {
        const data = step3Schema.parse(req.body);
        updateData = { addressHistory: data.addressHistory };
        if (!completedSteps.includes('step3')) completedSteps.push('step3');
        break;
      }
      case 4: {
        const data = step4Schema.parse(req.body);
        updateData = { employmentHistory: data.employmentHistory };
        if (!completedSteps.includes('step4')) completedSteps.push('step4');
        break;
      }
      case 5: {
        const data = step5Schema.parse(req.body);
        updateData = { educationHistory: data.educationHistory };
        if (!completedSteps.includes('step5')) completedSteps.push('step5');
        break;
      }
      case 6: {
        const data = step6Schema.parse(req.body);
        updateData = {
          otherNames: data.otherNames,
          additionalInfo: {
            licenses: data.licenses,
            criminalDisclosure: data.criminalDisclosure,
            criminalDetails: data.criminalDetails,
            additionalInfo: data.additionalInfo,
          },
        };
        if (!completedSteps.includes('step6')) completedSteps.push('step6');
        break;
      }
      case 7: {
        const data = step7Schema.parse(req.body);
        updateData = {
          eSignature: data.signatureBase64,
          consentGiven: true,
          consentDate: new Date(),
        };
        if (!completedSteps.includes('step7')) completedSteps.push('step7');
        break;
      }
      default:
        return res.status(400).json(errorResponse('INVALID_STEP', 'Invalid step number'));
    }

    updateData.completedSteps = completedSteps;

    const portalCompleted = step === 7 && completedSteps.length >= 7;
    if (portalCompleted) {
      updateData.portalCompleted = true;
    }

    await prisma.applicant.update({
      where: { id: applicant.id },
      data: updateData,
    });

    res.json(successResponse({
      completedSteps,
      portalCompleted,
      nextStep: step < 7 ? step + 1 : null,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data', error.errors.reduce((acc, e) => {
        acc[e.path.join('.')] = [e.message];
        return acc;
      }, {} as Record<string, string[]>)));
    }
    console.error('Error saving wizard step:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to save wizard step'));
  }
});

// POST /api/v1/wizard/:orderId/submit
router.post('/:orderId/submit', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId } = req.params;

    const applicant = await prisma.applicant.findFirst({
      where: {
        orderId,
        userId: req.user!.id,
      },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    const requiredSteps = ['step1', 'step2', 'step6', 'step7'];
    const completedSteps = (applicant.completedSteps || []) as string[];
    const missingSteps = requiredSteps.filter(s => !completedSteps.includes(s));

    if (missingSteps.length > 0) {
      return res.status(400).json(errorResponse('INCOMPLETE_STEPS', `Missing required steps: ${missingSteps.join(', ')}`));
    }

    if (!applicant.consentGiven) {
      return res.status(400).json(errorResponse('CONSENT_REQUIRED', 'Consent is required to submit'));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    await prisma.applicant.update({
      where: { id: applicant.id },
      data: { portalCompleted: true },
    });

    if (order) {
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'data_verification',
          submittedAt: new Date(),
        },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'data_verification',
          description: 'Candidate submitted background check information',
        },
      });
    }

    await publishWizardCompleted({
      orderId,
      applicantId: applicant.id,
      submittedAt: new Date().toISOString(),
    });

    const estimatedDate = addBusinessDays(new Date(), 5);

    res.json(successResponse({
      message: 'Your background check information has been submitted.',
      orderNumber: order?.orderNumber,
      estimatedCompletionDate: estimatedDate.toISOString(),
    }));
  } catch (error) {
    console.error('Error submitting wizard:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to submit wizard'));
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { generateToken } from '../utils/helpers';
import { sendEmail, invitationEmailTemplate } from '../utils/email';
import { generateApiKey, hashApiKey, maskApiKey } from '../utils/encryption';
import { AuthenticatedRequest } from '../types';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authenticate as any);

// ============================================================
// ZOD SCHEMAS
// ============================================================

const updateProfileSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  primaryContact: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(20).optional(),
  address: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'user']),
});

const updateUserSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const updateBrandingSchema = z.object({
  customDomain: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  removeChexproBranding: z.boolean().optional(),
  emailHeaderHtml: z.string().optional(),
  emailFooterHtml: z.string().optional(),
  customCss: z.string().optional(),
  helpDeskUrl: z.string().optional(),
  welcomeMessage: z.string().optional(),
  customLinks: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

const notificationPreferencesSchema = z.object({
  emailOnStatusChange: z.boolean().optional(),
  emailOnCompletion: z.boolean().optional(),
  emailOnRequiresAction: z.boolean().optional(),
  smsOnUrgent: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
});

// ============================================================
// CLIENT PROFILE ROUTES
// ============================================================

// GET /api/v1/client/profile - Get current client's company profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: {
        id: true,
        companyName: true,
        primaryContact: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return sendError(res, 404, 'NOT_FOUND', 'Client not found');
    }

    return sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/client/profile - Update company profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const client = await prisma.client.update({
      where: { id: user.clientId },
      data: parsed.data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'client_profile_update',
        resourceType: 'client',
        resourceId: client.id,
        requestDetails: parsed.data,
      },
    });

    return sendSuccess(res, {
      id: client.id,
      companyName: client.companyName,
      primaryContact: client.primaryContact,
      phone: client.phone,
      address: client.address,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// USER MANAGEMENT ROUTES (Owner only)
// ============================================================

// GET /api/v1/client/users - List all users in this client account
router.get('/users', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const users = await prisma.user.findMany({
      where: { clientId: user.clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mfaEnabled: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/client/users - Invite new user (send email, create pending user)
router.post('/users', requireRoles('owner') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = inviteUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { email, firstName, lastName, role } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 400, 'EMAIL_EXISTS', 'A user with this email already exists');
    }

    // Generate temporary password
    const temporaryPassword = generateToken(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, env.security.bcryptRounds);

    // Generate invitation token
    const invitationToken = generateToken(32);
    const invitationExpiry = new Date(Date.now() + env.security.invitationTokenExpiresDays * 24 * 60 * 60 * 1000);

    // Create pending user
    const newUser = await prisma.user.create({
      data: {
        clientId: user.clientId,
        email,
        firstName,
        lastName,
        role,
        status: 'pending',
        passwordHash,
        passwordResetToken: invitationToken,
        passwordResetExpiry: invitationExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    // Get client info for email
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: { companyName: true },
    });

    // Send invitation email
    const resetLink = `${env.frontendUrl}/reset-password?token=${invitationToken}`;
    const template = invitationEmailTemplate({
      applicantName: `${firstName} ${lastName}`,
      clientName: client?.companyName ?? 'ChexPro',
      portalLink: resetLink,
      expiresInDays: env.security.invitationTokenExpiresDays,
    });

    // Note: Using applicant template but with user context - could create a separate template
    await sendEmail({
      to: email,
      subject: `You have been invited to ${client?.companyName ?? 'ChexPro'} Portal`,
      html: `<p>You have been invited to join the ${client?.companyName ?? 'ChexPro'} Portal.</p><p>Click <a href="${resetLink}">here</a> to set up your account.</p>`,
      text: `You have been invited to join the ${client?.companyName ?? 'ChexPro'} Portal. Visit ${resetLink} to set up your account.`,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'user_invite',
        resourceType: 'user',
        resourceId: newUser.id,
        requestDetails: { email, role },
      },
    });

    return sendSuccess(res, { ...newUser, message: 'Invitation sent successfully' }, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/client/users/:id - Update user role/status (owner/admin only)
router.put('/users/:id', requireRoles('owner') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    // Cannot modify owner
    const targetUser = await prisma.user.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!targetUser) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }

    // Check if target is owner (compare with string cast for Prisma enum)
    if ((targetUser.role as string) === 'owner') {
      return sendError(res, 403, 'FORBIDDEN', 'Cannot modify the account owner');
    }

    // Note: Zod schema doesn't allow 'owner' role assignment, so no need to check for owner role assignment

    const updatedUser = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'user_update',
        resourceType: 'user',
        resourceId: updatedUser.id,
        requestDetails: parsed.data,
      },
    });

    return sendSuccess(res, updatedUser);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/client/users/:id - Deactivate user (cannot delete owner)
router.delete('/users/:id', requireRoles('owner') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Cannot delete/deactivate self
    if (id === user.id) {
      return sendError(res, 400, 'INVALID_OPERATION', 'Cannot deactivate yourself');
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!targetUser) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }

    if ((targetUser.role as string) === 'owner') {
      return sendError(res, 403, 'FORBIDDEN', 'Cannot deactivate the account owner');
    }

    // Deactivate user instead of deleting
    await prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'user_deactivate',
        resourceType: 'user',
        resourceId: id,
      },
    });

    return sendSuccess(res, { message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// BRANDING ROUTES
// ============================================================

// GET /api/v1/client/branding - Get theme/branding config
router.get('/branding', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    let branding = await prisma.clientBranding.findUnique({
      where: { clientId: user.clientId },
    });

    // If no branding exists, return defaults
    if (!branding) {
      branding = await prisma.clientBranding.create({
        data: { clientId: user.clientId },
      });
    }

    return sendSuccess(res, branding);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/client/branding - Update logo, colors, custom links
router.put('/branding', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = updateBrandingSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    // Handle logo upload if present
    let logoUrl = parsed.data.logoUrl;
    if (req.body.logoFile) {
      // Logo file upload handling would go here
      // For now, use the provided logoUrl
    }

    // Upsert branding
    const branding = await prisma.clientBranding.upsert({
      where: { clientId: user.clientId },
      update: parsed.data,
      create: { clientId: user.clientId, ...parsed.data },
    });

    // Also update customLinks in Client model if provided
    if (parsed.data.customLinks) {
      await prisma.client.update({
        where: { id: user.clientId },
        data: { customLinks: parsed.data.customLinks as any },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'branding_update',
        resourceType: 'branding',
        resourceId: branding.id,
      },
    });

    return sendSuccess(res, branding);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/client/branding/logo - Upload logo
router.post('/branding/logo', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Use multer for file upload
    const uploadDir = path.join(process.cwd(), 'uploads', 'branding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Simple file handling - in production use multer
    const { logo } = req.body;
    if (!logo || !logo.startsWith('data:image/')) {
      return sendError(res, 400, 'INVALID_FILE', 'Valid image file required');
    }

    // Extract base64 data
    const matches = logo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return sendError(res, 400, 'INVALID_FORMAT', 'Invalid image format');
    }

    const ext = matches[1];
    const base64Data = matches[2];
    const filename = `logo-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    fs.writeFileSync(filePath, base64Data, 'base64');

    const logoUrl = `/uploads/branding/${filename}`;

    // Update branding
    const branding = await prisma.clientBranding.upsert({
      where: { clientId: user.clientId },
      update: { logoUrl },
      create: { clientId: user.clientId, logoUrl },
    });

    return sendSuccess(res, { logoUrl: branding.logoUrl });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// API KEY ROUTES
// ============================================================

// GET /api/v1/client/api-keys - List API keys (show only last 4 chars of secret)
router.get('/api-keys', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const apiKeys = await prisma.apiKey.findMany({
      where: { clientId: user.clientId, isActive: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, apiKeys);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/client/api-keys - Generate new API key (return full key ONCE)
router.post('/api-keys', requireRoles('owner') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createApiKeySchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { name, expiresInDays } = parsed.data;

    // Generate new API key
    const plainKey = generateApiKey();
    const { hash, salt } = hashApiKey(plainKey);
    const keyPrefix = plainKey.slice(0, 8);

    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        clientId: user.clientId,
        name,
        keyHash: hash,
        keyPrefix,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'api_key_create',
        resourceType: 'api_key',
        resourceId: apiKey.id,
        requestDetails: { name, expiresAt },
      },
    });

    // Return full key only once
    return sendSuccess(res, {
      id: apiKey.id,
      name: apiKey.name,
      key: plainKey, // Full key - only returned once!
      keyPrefix: apiKey.keyPrefix,
      expiresAt: apiKey.expiresAt,
      message: 'Store this key securely - it will not be shown again',
    }, 201);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/client/api-keys/:id - Revoke API key
router.delete('/api-keys/:id', requireRoles('owner') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!apiKey) {
      return sendError(res, 404, 'NOT_FOUND', 'API key not found');
    }

    // Soft delete - mark as inactive
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'api_key_revoke',
        resourceType: 'api_key',
        resourceId: id,
      },
    });

    return sendSuccess(res, { message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// NOTIFICATION PREFERENCES ROUTES
// ============================================================

// GET /api/v1/client/notifications/preferences - Get notification preferences
router.get('/notifications/preferences', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const userPrefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true } as any,
    });

    const preferences = userPrefs?.notificationPreferences || {
      emailOnStatusChange: true,
      emailOnCompletion: true,
      emailOnRequiresAction: true,
      smsOnUrgent: false,
      browserNotifications: true,
    };

    return sendSuccess(res, preferences);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/client/notifications/preferences - Update notification preferences
router.put('/notifications/preferences', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = notificationPreferencesSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    // Get current preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true } as any,
    });

    const currentPrefs = (currentUser?.notificationPreferences as any) || {};
    const updatedPrefs = { ...currentPrefs, ...parsed.data };

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPreferences: updatedPrefs } as any,
    });

    return sendSuccess(res, updatedPrefs);
  } catch (error) {
    next(error);
  }
});

export default router;

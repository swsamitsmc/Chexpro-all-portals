import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ChexPro Portal database...');

  // ============================================================
  // SERVICES
  // ============================================================
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-criminal-federal' },
      update: {},
      create: {
        id: 'svc-criminal-federal',
        name: 'Federal Criminal Record Check',
        category: 'Criminal',
        description: 'RCMP-based federal criminal record check',
        basePrice: 29.99,
        estimatedTurnaroundDays: 2,
        requiresSin: true,
        vendorType: 'cleara',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-criminal-provincial' },
      update: {},
      create: {
        id: 'svc-criminal-provincial',
        name: 'Provincial Criminal Record Check',
        category: 'Criminal',
        description: 'Provincial court database criminal record check',
        basePrice: 24.99,
        estimatedTurnaroundDays: 3,
        requiresSin: false,
        vendorType: 'accurate_source',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-criminal-local' },
      update: {},
      create: {
        id: 'svc-criminal-local',
        name: 'Local Court Criminal Check',
        category: 'Criminal',
        description: 'Local courthouse criminal record search',
        basePrice: 34.99,
        estimatedTurnaroundDays: 5,
        requiresSin: false,
        vendorType: 'baxter',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-employment-verification' },
      update: {},
      create: {
        id: 'svc-employment-verification',
        name: 'Employment Verification',
        category: 'Verification',
        description: 'Verify past employment history and job titles',
        basePrice: 19.99,
        estimatedTurnaroundDays: 3,
        requiresSin: false,
        vendorType: 'inform_data',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-education-verification' },
      update: {},
      create: {
        id: 'svc-education-verification',
        name: 'Education Verification',
        category: 'Verification',
        description: 'Verify academic credentials and degrees',
        basePrice: 17.99,
        estimatedTurnaroundDays: 3,
        requiresSin: false,
        vendorType: 'inform_data',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-social-media' },
      update: {},
      create: {
        id: 'svc-social-media',
        name: 'Social Media Screening',
        category: 'Social Media',
        description: 'AI-powered social media and online presence screening',
        basePrice: 39.99,
        estimatedTurnaroundDays: 2,
        requiresSin: false,
        vendorType: 'ferretly',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-reference-check' },
      update: {},
      create: {
        id: 'svc-reference-check',
        name: 'Reference Check',
        category: 'Verification',
        description: 'Professional reference verification (3 references)',
        basePrice: 49.99,
        estimatedTurnaroundDays: 5,
        requiresSin: false,
        vendorType: 'inform_data',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-driving-record' },
      update: {},
      create: {
        id: 'svc-driving-record',
        name: 'Driving Record Check',
        category: 'Driving',
        description: "Motor vehicle record and driver's abstract",
        basePrice: 14.99,
        estimatedTurnaroundDays: 1,
        requiresSin: false,
        vendorType: 'accurate_source',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-credit-check' },
      update: {},
      create: {
        id: 'svc-credit-check',
        name: 'Credit Check',
        category: 'Financial',
        description: 'Soft credit inquiry for employment screening',
        basePrice: 22.99,
        estimatedTurnaroundDays: 1,
        requiresSin: true,
        vendorType: 'accurate_source',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-international-criminal' },
      update: {},
      create: {
        id: 'svc-international-criminal',
        name: 'International Criminal Check',
        category: 'Criminal',
        description: 'Criminal record check for non-Canadian residents/history',
        basePrice: 79.99,
        estimatedTurnaroundDays: 10,
        requiresSin: false,
        vendorType: 'cleara',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // ============================================================
  // GLOBAL PACKAGES (no client, available to all)
  // ============================================================
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { id: 'pkg-basic-employment' },
      update: {},
      create: {
        id: 'pkg-basic-employment',
        clientId: null,
        name: 'Basic Employment Package',
        description: 'Essential background checks for general employment screening',
        services: ['svc-criminal-federal', 'svc-employment-verification'],
        price: 44.99,
        turnaroundTimeDays: 3,
        isActive: true,
      },
    }),
    prisma.package.upsert({
      where: { id: 'pkg-standard-employment' },
      update: {},
      create: {
        id: 'pkg-standard-employment',
        clientId: null,
        name: 'Standard Employment Package',
        description: 'Comprehensive screening for most employment positions',
        services: [
          'svc-criminal-federal',
          'svc-criminal-provincial',
          'svc-employment-verification',
          'svc-education-verification',
        ],
        price: 79.99,
        turnaroundTimeDays: 5,
        isActive: true,
      },
    }),
    prisma.package.upsert({
      where: { id: 'pkg-premium-employment' },
      update: {},
      create: {
        id: 'pkg-premium-employment',
        clientId: null,
        name: 'Premium Employment Package',
        description: 'Full-spectrum background check for sensitive roles',
        services: [
          'svc-criminal-federal',
          'svc-criminal-provincial',
          'svc-criminal-local',
          'svc-employment-verification',
          'svc-education-verification',
          'svc-reference-check',
          'svc-social-media',
          'svc-credit-check',
        ],
        price: 199.99,
        turnaroundTimeDays: 7,
        isActive: true,
      },
    }),
    prisma.package.upsert({
      where: { id: 'pkg-driver-screening' },
      update: {},
      create: {
        id: 'pkg-driver-screening',
        clientId: null,
        name: 'Driver Screening Package',
        description: 'Specialized screening for drivers and delivery personnel',
        services: [
          'svc-criminal-federal',
          'svc-driving-record',
          'svc-employment-verification',
        ],
        price: 59.99,
        turnaroundTimeDays: 2,
        isActive: true,
      },
    }),
    prisma.package.upsert({
      where: { id: 'pkg-volunteer-screening' },
      update: {},
      create: {
        id: 'pkg-volunteer-screening',
        clientId: null,
        name: 'Volunteer Screening Package',
        description: 'Background check for volunteers and non-profit organizations',
        services: ['svc-criminal-federal', 'svc-criminal-provincial'],
        price: 39.99,
        turnaroundTimeDays: 2,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${packages.length} global packages`);

  // ============================================================
  // DEMO CLIENT
  // ============================================================
  const demoClient = await prisma.client.upsert({
    where: { email: 'demo@acmecorp.com' },
    update: {},
    create: {
      id: 'client-demo-acme',
      companyName: 'Acme Corporation',
      primaryContact: 'Jane Smith',
      email: 'demo@acmecorp.com',
      phone: '+1-416-555-0100',
      address: '123 Bay Street, Toronto, ON M5J 2T3',
      themeConfig: {
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        accentColor: '#f59e0b',
      },
      customLinks: [
        { title: 'Privacy Policy', url: 'https://acmecorp.com/privacy' },
        { title: 'Terms of Service', url: 'https://acmecorp.com/terms' },
      ],
      status: 'active',
    },
  });

  console.log(`✅ Created demo client: ${demoClient.companyName}`);

  // ============================================================
  // DEMO USERS
  // ============================================================
  const passwordHash = await bcrypt.hash('Demo@123456', 12);

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@acmecorp.com' },
    update: {},
    create: {
      id: 'user-demo-owner',
      clientId: 'client-demo-acme',
      email: 'owner@acmecorp.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'owner',
      status: 'active',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acmecorp.com' },
    update: {},
    create: {
      id: 'user-demo-admin',
      clientId: 'client-demo-acme',
      email: 'admin@acmecorp.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'admin',
      status: 'active',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@acmecorp.com' },
    update: {},
    create: {
      id: 'user-demo-manager',
      clientId: 'client-demo-acme',
      email: 'manager@acmecorp.com',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Davis',
      role: 'manager',
      status: 'active',
    },
  });

  const standardUser = await prisma.user.upsert({
    where: { email: 'user@acmecorp.com' },
    update: {},
    create: {
      id: 'user-demo-standard',
      clientId: 'client-demo-acme',
      email: 'user@acmecorp.com',
      passwordHash,
      firstName: 'David',
      lastName: 'Wilson',
      role: 'user',
      status: 'active',
    },
  });

  console.log(
    `✅ Created 4 demo users (owner, admin, manager, user) - password: Demo@123456`
  );

  // ============================================================
  // CLIENT BRANDING
  // ============================================================
  await prisma.clientBranding.upsert({
    where: { clientId: 'client-demo-acme' },
    update: {},
    create: {
      clientId: 'client-demo-acme',
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      accentColor: '#f59e0b',
      helpDeskUrl: 'https://support.acmecorp.com',
      welcomeMessage:
        'Welcome to the Acme Corporation Background Check Portal. Please complete all required steps accurately.',
    },
  });

  // ============================================================
  // BILLING ACCOUNT
  // ============================================================
  await prisma.billingAccount.upsert({
    where: { clientId: 'client-demo-acme' },
    update: {},
    create: {
      clientId: 'client-demo-acme',
      billingModel: 'monthly_invoice',
      creditBalance: 500.0,
      monthlyBudget: 5000.0,
    },
  });

  // ============================================================
  // DEMO APPLICANTS
  // ============================================================
  const applicant1 = await prisma.applicant.upsert({
    where: { id: 'applicant-demo-1' },
    update: {},
    create: {
      id: 'applicant-demo-1',
      firstName: 'Michael',
      middleName: 'James',
      lastName: 'Thompson',
      dateOfBirth: new Date('1990-03-15'),
      email: 'michael.thompson@email.com',
      phone: '+1-647-555-0201',
      currentAddress: {
        street: '456 Queen Street West',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 2B4',
        country: 'Canada',
        residenceType: 'Rent',
        yearsAtAddress: 2,
      },
      addressHistory: [
        {
          street: '789 King Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5H 1B1',
          country: 'Canada',
          from: '2018-01',
          to: '2022-01',
        },
      ],
      employmentHistory: [
        {
          employer: 'Tech Solutions Inc.',
          jobTitle: 'Software Developer',
          startDate: '2020-06',
          endDate: 'present',
          supervisorName: 'Sarah Lee',
          supervisorContact: 'sarah.lee@techsolutions.com',
          reasonForLeaving: '',
          canContact: true,
        },
      ],
      educationHistory: [
        {
          institution: 'University of Toronto',
          degree: 'Bachelor of Computer Science',
          fieldOfStudy: 'Computer Science',
          graduationDate: '2012-06',
          studentId: 'UToronto-1234567',
        },
      ],
      consentGiven: true,
      consentDate: new Date(),
      portalCompleted: true,
      portalStep: 7,
    },
  });

  const applicant2 = await prisma.applicant.upsert({
    where: { id: 'applicant-demo-2' },
    update: {},
    create: {
      id: 'applicant-demo-2',
      firstName: 'Sarah',
      lastName: 'Chen',
      dateOfBirth: new Date('1995-07-22'),
      email: 'sarah.chen@email.com',
      phone: '+1-416-555-0305',
      invitationToken: 'demo-invitation-token-sarah-chen-2026',
      tokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      portalCompleted: false,
      portalStep: 2,
    },
  });

  const applicant3 = await prisma.applicant.upsert({
    where: { id: 'applicant-demo-3' },
    update: {},
    create: {
      id: 'applicant-demo-3',
      firstName: 'Robert',
      lastName: 'Martinez',
      dateOfBirth: new Date('1988-11-30'),
      email: 'robert.martinez@email.com',
      phone: '+1-905-555-0412',
      currentAddress: {
        street: '321 Yonge Street',
        city: 'North York',
        province: 'ON',
        postalCode: 'M2N 3N8',
        country: 'Canada',
        residenceType: 'Own',
        yearsAtAddress: 5,
      },
      consentGiven: true,
      consentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      portalCompleted: true,
      portalStep: 7,
    },
  });

  console.log(`✅ Created 3 demo applicants`);

  // ============================================================
  // DEMO ORDERS
  // ============================================================

  // Order 1: Completed
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'CHX-20260201-0001' },
    update: {},
    create: {
      id: 'order-demo-1',
      orderNumber: 'CHX-20260201-0001',
      clientId: 'client-demo-acme',
      createdByUserId: 'user-demo-admin',
      packageId: 'pkg-standard-employment',
      status: 'completed',
      totalPrice: 79.99,
      referenceNumber: 'EMP-2026-001',
      positionTitle: 'Software Developer',
      department: 'Engineering',
      screeningReason: 'Employment',
      jobLocation: 'CA-ON',
      applicantId: 'applicant-demo-1',
      completionPercentage: 100,
      submittedAt: new Date('2026-02-01T10:00:00Z'),
      completedAt: new Date('2026-02-06T14:30:00Z'),
    },
  });

  // Order 2: In Progress
  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'CHX-20260210-0002' },
    update: {},
    create: {
      id: 'order-demo-2',
      orderNumber: 'CHX-20260210-0002',
      clientId: 'client-demo-acme',
      createdByUserId: 'user-demo-manager',
      packageId: 'pkg-premium-employment',
      status: 'in_progress',
      totalPrice: 199.99,
      referenceNumber: 'EMP-2026-002',
      positionTitle: 'Financial Analyst',
      department: 'Finance',
      screeningReason: 'Employment',
      jobLocation: 'CA-ON',
      applicantId: 'applicant-demo-3',
      completionPercentage: 55,
      submittedAt: new Date('2026-02-10T09:00:00Z'),
    },
  });

  // Order 3: Awaiting Applicant
  const order3 = await prisma.order.upsert({
    where: { orderNumber: 'CHX-20260215-0003' },
    update: {},
    create: {
      id: 'order-demo-3',
      orderNumber: 'CHX-20260215-0003',
      clientId: 'client-demo-acme',
      createdByUserId: 'user-demo-standard',
      packageId: 'pkg-basic-employment',
      status: 'awaiting_applicant',
      totalPrice: 44.99,
      referenceNumber: 'EMP-2026-003',
      positionTitle: 'Marketing Coordinator',
      department: 'Marketing',
      screeningReason: 'Employment',
      jobLocation: 'CA-ON',
      applicantId: 'applicant-demo-2',
      completionPercentage: 10,
      submittedAt: new Date('2026-02-15T11:30:00Z'),
    },
  });

  // Order 4: Draft
  const order4 = await prisma.order.upsert({
    where: { orderNumber: 'CHX-20260217-0004' },
    update: {},
    create: {
      id: 'order-demo-4',
      orderNumber: 'CHX-20260217-0004',
      clientId: 'client-demo-acme',
      createdByUserId: 'user-demo-admin',
      customServices: ['svc-criminal-federal', 'svc-social-media'],
      status: 'draft',
      totalPrice: 69.98,
      positionTitle: 'Customer Success Manager',
      department: 'Sales',
      screeningReason: 'Employment',
      jobLocation: 'CA-ON',
      completionPercentage: 0,
    },
  });

  console.log(`✅ Created 4 demo orders`);

  // ============================================================
  // ORDER TIMELINES
  // ============================================================
  await prisma.orderTimeline.createMany({
    skipDuplicates: true,
    data: [
      // Order 1 timeline
      {
        orderId: 'order-demo-1',
        status: 'submitted',
        description: 'Order submitted for processing',
        createdBy: 'system',
        createdAt: new Date('2026-02-01T10:00:00Z'),
      },
      {
        orderId: 'order-demo-1',
        status: 'data_verification',
        description: 'Applicant information received and verified',
        createdBy: 'system',
        createdAt: new Date('2026-02-01T10:05:00Z'),
      },
      {
        orderId: 'order-demo-1',
        status: 'in_progress',
        description: 'Background checks initiated with vendors',
        createdBy: 'system',
        createdAt: new Date('2026-02-01T14:00:00Z'),
      },
      {
        orderId: 'order-demo-1',
        status: 'completed',
        description: 'All checks completed. Report is ready for download.',
        createdBy: 'system',
        createdAt: new Date('2026-02-06T14:30:00Z'),
      },
      // Order 2 timeline
      {
        orderId: 'order-demo-2',
        status: 'submitted',
        description: 'Order submitted for processing',
        createdBy: 'system',
        createdAt: new Date('2026-02-10T09:00:00Z'),
      },
      {
        orderId: 'order-demo-2',
        status: 'in_progress',
        description: 'Criminal checks completed. Verification checks in progress.',
        createdBy: 'system',
        createdAt: new Date('2026-02-10T15:00:00Z'),
      },
    ],
  });

  // ============================================================
  // COMPLIANCE RULES
  // ============================================================
  await prisma.complianceRule.upsert({
    where: { id: 'rule-canada-pipeda' },
    update: {},
    create: {
      id: 'rule-canada-pipeda',
      jurisdiction: 'CA',
      ruleType: 'privacy',
      effectiveDate: new Date('2001-01-01'),
      ruleDetails: {
        name: 'PIPEDA',
        description: 'Personal Information Protection and Electronic Documents Act',
        requirements: ['Consent required', 'Right to access', 'Right to correction'],
      },
      isActive: true,
    },
  });

  await prisma.complianceRule.upsert({
    where: { id: 'rule-canada-ban-the-box-ont' },
    update: {},
    create: {
      id: 'rule-canada-ban-the-box-ont',
      jurisdiction: 'CA-ON',
      ruleType: 'ban_the_box',
      effectiveDate: new Date('2018-01-01'),
      ruleDetails: {
        name: 'Ontario Human Rights Code',
        description:
          'Restriction on using criminal records in hiring before conditional offer',
        applies_to: ['criminal_records'],
        restriction:
          'Cannot deny employment solely based on a record for which a pardon has been granted',
      },
      isActive: true,
    },
  });

  console.log(`✅ Created compliance rules`);

  // ============================================================
  // DEMO NOTIFICATIONS
  // ============================================================
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: 'user-demo-owner',
        orderId: 'order-demo-1',
        type: 'order_completed',
        title: 'Report Ready',
        message: 'Background check for Michael Thompson (CHX-20260201-0001) is complete. Download the report now.',
        isRead: false,
      },
      {
        userId: 'user-demo-admin',
        orderId: 'order-demo-2',
        type: 'order_update',
        title: 'Order In Progress',
        message: 'Background check for Robert Martinez is 55% complete.',
        isRead: true,
      },
      {
        userId: 'user-demo-manager',
        orderId: 'order-demo-3',
        type: 'awaiting_applicant',
        title: 'Awaiting Applicant Response',
        message: 'Sarah Chen has not yet completed her background check form. A reminder email was sent.',
        isRead: false,
      },
    ],
  });

  console.log(`✅ Created demo notifications`);

  // ============================================================
  // ANALYTICS SEED DATA
  // ============================================================
  const today = new Date();
  const analyticsData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    analyticsData.push({
      clientId: 'client-demo-acme',
      date,
      ordersSubmitted: Math.floor(Math.random() * 8) + 1,
      ordersCompleted: Math.floor(Math.random() * 6) + 1,
      avgTurnaroundHours: Math.round((Math.random() * 48 + 24) * 100) / 100,
      totalCost: Math.round((Math.random() * 500 + 100) * 100) / 100,
      passRate: Math.round((Math.random() * 20 + 78) * 100) / 100,
    });
  }

  for (const metric of analyticsData) {
    await prisma.analyticsDailyMetric.upsert({
      where: { clientId_date: { clientId: 'client-demo-acme', date: metric.date } },
      update: {},
      create: metric,
    });
  }

  console.log(`✅ Created 30 days of analytics data`);

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Demo Login Credentials:');
  console.log('   Owner:   owner@acmecorp.com    / Demo@123456');
  console.log('   Admin:   admin@acmecorp.com    / Demo@123456');
  console.log('   Manager: manager@acmecorp.com  / Demo@123456');
  console.log('   User:    user@acmecorp.com     / Demo@123456\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

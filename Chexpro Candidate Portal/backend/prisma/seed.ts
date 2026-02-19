import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test candidate user
  const hashedPassword = await bcrypt.hash('Demo@123456', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'candidate@test.com' },
    update: {},
    create: {
      email: 'candidate@test.com',
      username: 'candidate',
      passwordHash: hashedPassword,
      role: 'candidate',
      firstName: 'Test',
      lastName: 'Candidate',
      isActive: true,
    },
  });

  console.log('Created test user:', testUser.email);

  // Create candidate profile
  await prisma.candidateProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      preferredName: 'Test User',
      timezone: 'America/Toronto',
      language: 'en',
    },
  });

  console.log('Created candidate profile');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a sample company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      domain: 'acme.com',
      currency: 'USD',
    },
  });

  // Create sample users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@acme.com',
      firstName: 'Jane',
      lastName: 'Manager',
      role: 'MANAGER',
      companyId: company.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@acme.com',
      firstName: 'Bob',
      lastName: 'Employee',
      role: 'EMPLOYEE',
      companyId: company.id,
    },
  });

  // Create sample approval rules
  await prisma.rule.create({
    data: {
      name: 'Small Expenses (< $100)',
      companyId: company.id,
      maxAmount: 100,
      approvers: [manager.id],
      sequence: 1,
      ruleType: 'SEQUENTIAL',
    },
  });

  await prisma.rule.create({
    data: {
      name: 'Large Expenses (>= $100)',
      companyId: company.id,
      minAmount: 100,
      approvers: [manager.id, admin.id],
      sequence: 1,
      ruleType: 'SEQUENTIAL',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
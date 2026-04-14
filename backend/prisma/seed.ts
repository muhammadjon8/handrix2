import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: 'Small Leak',
      description: 'Fix minor plumbing leaks — faucets, pipes, or connections',
      basePrice: 45.0,
      estimatedDuration: 60,
      skillTags: ['plumbing', 'leak-repair'],
    },
    {
      name: 'Outlet Switch',
      description: 'Replace or repair electrical outlet or light switch',
      basePrice: 35.0,
      estimatedDuration: 30,
      skillTags: ['electrical', 'outlets'],
    },
    {
      name: 'Furniture Assembly',
      description: 'Assemble flat-pack or pre-built furniture items',
      basePrice: 40.0,
      estimatedDuration: 90,
      skillTags: ['assembly', 'furniture'],
    },
    {
      name: 'Door Repair',
      description: 'Fix door hinges, locks, or frame alignment issues',
      basePrice: 50.0,
      estimatedDuration: 45,
      skillTags: ['carpentry', 'doors'],
    },
    {
      name: 'AC Servicing',
      description: 'Clean and service air conditioning units',
      basePrice: 70.0,
      estimatedDuration: 90,
      skillTags: ['hvac', 'ac-repair'],
    },
    {
      name: 'Painting',
      description: 'Interior wall painting — single room',
      basePrice: 80.0,
      estimatedDuration: 180,
      skillTags: ['painting', 'interior'],
    },
  ];

  for (const cat of categories) {
    await prisma.jobCategory.upsert({
      where: { id: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
        basePrice: cat.basePrice,
        estimatedDuration: cat.estimatedDuration,
        skillTags: cat.skillTags,
      },
    });
  }

  console.log('Seeded job categories');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@humanwriter.ai' },
    update: {},
    create: {
      email: 'admin@humanwriter.ai',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      plan: 'ENTERPRISE',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@humanwriter.ai' },
    update: {},
    create: {
      email: 'test@humanwriter.ai',
      password: testPassword,
      name: 'Test User',
      role: 'USER',
      plan: 'PRO',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Created test user:', testUser.email);

  // Create sample generation
  const sampleGeneration = await prisma.generation.create({
    data: {
      userId: testUser.id,
      prompt: 'Escribe sobre la importancia de la ingeniería industrial en la República Dominicana',
      discipline: 'INGENIERIA',
      modelUsed: 'humanwriter-base:8b',
      maxWords: 500,
      temperature: 0.7,
      rawText: 'La ingeniería industrial desempeña un papel crucial en el desarrollo económico de la República Dominicana...',
      humanizedText: 'Fíjate que la ingeniería industrial, la verdad es que tiene un papel bien importante en el desarrollo económico del país...',
      metrics: {
        burstiness: 8.5,
        humanizationScore: 87,
        aiWordsCount: 2,
        colloquialismsCount: 5,
        sentenceVariation: {
          min: 8,
          max: 35,
          avg: 18.5,
        },
      },
      duration: 5420,
      tokensGenerated: 512,
      status: 'COMPLETED',
    },
  });
  console.log('✅ Created sample generation');

  // Create sample feedback
  await prisma.feedback.create({
    data: {
      userId: testUser.id,
      generationId: sampleGeneration.id,
      rating: 5,
      helpful: true,
      issues: [],
      comment: 'Excelente generación, muy natural y académica',
    },
  });
  console.log('✅ Created sample feedback');

  // Create sample documents
  const documents = [
    {
      title: 'Análisis de la Producción Industrial en República Dominicana',
      authors: ['Juan Pérez', 'María García'],
      year: 2015,
      institution: 'UASD',
      source: 'https://repositoriovip.uasd.edu.do/example1.pdf',
      discipline: 'INGENIERIA' as const,
      subdiscipline: 'Ingeniería Industrial',
      language: 'es',
      keywords: ['industria', 'producción', 'economía'],
      wordCount: 8500,
      filePath: '/data/raw/doc1.pdf',
      processedPath: '/data/processed/doc1.txt',
      validated: true,
      validationScore: 92.5,
    },
    {
      title: 'Impacto Económico del Turismo en el Caribe',
      authors: ['Carlos Rodríguez'],
      year: 2018,
      institution: 'PUCMM',
      source: 'https://repositorio.pucmm.edu.do/example2.pdf',
      discipline: 'CIENCIAS_SOCIALES' as const,
      subdiscipline: 'Economía',
      language: 'es',
      keywords: ['turismo', 'economía', 'caribe'],
      wordCount: 12000,
      filePath: '/data/raw/doc2.pdf',
      processedPath: '/data/processed/doc2.txt',
      validated: true,
      validationScore: 89.0,
    },
    {
      title: 'Estudios de Biodiversidad en Sistemas Agrícolas Tropicales',
      authors: ['Ana Martínez', 'Pedro Sánchez'],
      year: 2020,
      institution: 'INTEC',
      source: 'https://biblioteca.intec.edu.do/example3.pdf',
      discipline: 'AGRARIAS' as const,
      subdiscipline: 'Agronomía',
      language: 'es',
      keywords: ['biodiversidad', 'agricultura', 'trópico'],
      wordCount: 9500,
      filePath: '/data/raw/doc3.pdf',
      processedPath: '/data/processed/doc3.txt',
      validated: true,
      validationScore: 95.5,
    },
  ];

  for (const doc of documents) {
    await prisma.document.create({ data: doc });
  }
  console.log(`✅ Created ${documents.length} sample documents`);

  // Create initial system metrics
  await prisma.systemMetric.create({
    data: {
      cpuUsage: 45.2,
      ramUsage: 62.8,
      diskUsage: 35.5,
      apiCalls: 150,
      errors: 2,
      avgResponseTime: 1250.5,
      activeUsers: 5,
      generationsCount: 45,
      avgGenerationTime: 5200.0,
      ollamaUptime: 99.5,
      dbConnections: 10,
      dbQueryTime: 25.5,
    },
  });
  console.log('✅ Created initial system metrics');

  // Create knowledge gap example
  await prisma.knowledgeGap.create({
    data: {
      topic: 'Inteligencia Artificial en Agricultura',
      keywords: ['IA', 'machine learning', 'agricultura de precisión'],
      discipline: 'AGRARIAS',
      lowScoreCount: 8,
      failedPrompts: [
        'Escribe sobre aplicaciones de IA en agricultura dominicana',
        'Discute el futuro de la agricultura inteligente',
      ],
      recommendedDocs: 'Buscar papers sobre IA en agricultura, agricultura de precisión, y tecnología agrícola moderna',
      priority: 7,
      status: 'IDENTIFIED',
    },
  });
  console.log('✅ Created sample knowledge gap');

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userEmail: admin.email,
      ipAddress: '127.0.0.1',
      action: 'database.seed',
      resource: 'system',
      details: {
        message: 'Database seeded with initial data',
      },
      success: true,
    },
  });
  console.log('✅ Created audit log');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('   Admin: admin@humanwriter.ai / admin123');
  console.log('   User:  test@humanwriter.ai / test123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

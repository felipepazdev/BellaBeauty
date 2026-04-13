/**
 * Script para gerar um token JWT de longa duração para integração n8n
 * Usa o mesmo JWT_SECRET do backend para gerar um token ADMIN válido por 1 ano
 */
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Buscar o usuário admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@bellabeauty.com' },
  });

  if (!admin) {
    console.error('❌ Usuário admin não encontrado!');
    process.exit(1);
  }

  console.log(`✅ Admin encontrado: ${admin.name} (${admin.id})`);
  console.log(`   SalonId: ${admin.salonId}`);

  // Gerar token com o mesmo payload que o backend usa
  const payload = {
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    salonId: admin.salonId,
    professionalId: admin.professionalId || null,
    permissions: admin.permissions || null,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'access_secret_key_123', {
    expiresIn: '365d', // 1 ano de validade
  });

  console.log('\n🔑 Token JWT para integração n8n (válido por 1 ano):');
  console.log('━'.repeat(60));
  console.log(token);
  console.log('━'.repeat(60));
  console.log('\nUse este token no n8n como Header Auth:');
  console.log('  Header Name: Authorization');
  console.log(`  Header Value: Bearer ${token}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

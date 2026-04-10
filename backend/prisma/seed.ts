import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🌱 Iniciando seed minimalista...\n');

    // ─── UPSERT SALÃO ───────────────────────────────────────────────
    let salon = await prisma.salon.findFirst();
    if (!salon) {
        salon = await prisma.salon.create({ 
            data: { 
                name: 'Bella Beauty', 
                whatsappProvider: 'NONE' 
            } 
        });
    }
    console.log(`✅ Salão: ${salon.name} (${salon.id})`);

    // ─── ADMIN ───────────────────────────────────────────────────────
    const adminEmail = 'admin@bellabeauty.com';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!adminExists) {
        await prisma.user.create({
            data: {
                name: 'Administrador',
                email: adminEmail,
                password: await bcrypt.hash('bella@2025', 10),
                role: 'ADMIN',
                salonId: salon.id,
            },
        });
        console.log(`✅ Admin criado: ${adminEmail} / bella@2025`);
    } else {
        console.log(`ℹ️ Admin já existe: ${adminEmail}`);
    }

    console.log('\n🎉 Seed minimalista concluído com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Acesse: http://localhost:3001/login`);
    console.log(`  Admin : ${adminEmail} / bella@2025`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => { 
        console.error('❌ Erro no seed:', e); 
        process.exit(1); 
    })
    .finally(() => prisma.$disconnect());


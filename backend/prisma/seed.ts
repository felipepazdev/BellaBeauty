import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 10, minute = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, minute, 0, 0);
    return d;
}
function today(hour: number, minute = 0): Date {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
}
function daysFromNow(n: number, hour = 10, minute = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, minute, 0, 0);
    return d;
}

async function main() {
    console.log('\n🌱 Iniciando seed de dados fictícios...\n');

    // ─── UPSERT SALÃO ───────────────────────────────────────────────
    let salon = await prisma.salon.findFirst();
    if (!salon) {
        salon = await prisma.salon.create({ data: { name: 'Bella Beauty', whatsappProvider: 'NONE' } });
    }
    console.log(`✅ Salão: ${salon.name} (${salon.id})`);

    // ─── ADMIN ───────────────────────────────────────────────────────
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@bellabeauty.com' } });
    if (!adminExists) {
        await prisma.user.create({
            data: {
                name: 'Administrador',
                email: 'admin@bellabeauty.com',
                password: await bcrypt.hash('bella@2025', 10),
                role: 'ADMIN',
                salonId: salon.id,
            },
        });
    }
    console.log('✅ Admin: admin@bellabeauty.com / bella@2025');

    // ─── NICHOS ──────────────────────────────────────────────────────
    const nicheData = [
        { name: 'Cabelo', order: 1 },
        { name: 'Unhas', order: 2 },
        { name: 'Cílios', order: 3 },
        { name: 'Designer de Sobrancelhas', order: 4 }
    ];

    const niches: any = {};
    for (const n of nicheData) {
        let niche = await prisma.serviceNicho.findFirst({ where: { name: n.name, salonId: salon.id } });
        if (!niche) {
            niche = await prisma.serviceNicho.create({ data: { ...n, salonId: salon.id } });
        }
        niches[n.name] = niche;
    }
    console.log(`✅ ${Object.keys(niches).length} nichos criados`);

    // ─── CATEGORIAS ──────────────────────────────────────────────────
    const catData = [
        { name: 'Corte', niche: 'Cabelo' },
        { name: 'Tratamento', niche: 'Cabelo' },
        { name: 'Unhas', niche: 'Unhas' },
        { name: 'Alongamento', niche: 'Unhas' },
        { name: 'Cílios', niche: 'Cílios' },
        { name: 'Sobrancelha', niche: 'Designer de Sobrancelhas' },
        { name: 'Coloração', niche: 'Designer de Sobrancelhas' },
    ];

    const categories: any = {};
    for (const c of catData) {
        let cat = await prisma.serviceCategory.findFirst({ where: { name: c.name, salonId: salon.id } });
        if (!cat) {
            cat = await prisma.serviceCategory.create({ 
                data: { 
                    name: c.name, 
                    nicheId: niches[c.niche].id,
                    salonId: salon.id 
                } 
            });
        } else if (!cat.nicheId) {
            cat = await prisma.serviceCategory.update({
                where: { id: cat.id },
                data: { nicheId: niches[c.niche].id }
            });
        }
        categories[c.name] = cat;
    }
    console.log(`✅ ${Object.keys(categories).length} categorias criadas`);

    // ─── SERVIÇOS ────────────────────────────────────────────────────
    const serviceData = [
        { name: 'Corte Feminino', price: 80, duration: 60, cat: 'Corte' },
        { name: 'Corte Masculino', price: 50, duration: 40, cat: 'Corte' },
        { name: 'Coloração', price: 180, duration: 120, cat: 'Tratamento' },
        { name: 'Progressiva', price: 250, duration: 180, cat: 'Tratamento' },
        { name: 'Manicure', price: 40, duration: 45, cat: 'Unhas' },
        { name: 'Pedicure', price: 50, duration: 50, cat: 'Unhas' },
        { name: 'Escova', price: 70, duration: 60, cat: 'Tratamento' },
        { name: 'Hidratação', price: 90, duration: 60, cat: 'Tratamento' },
        { name: 'Fio a Fio', price: 150, duration: 120, cat: 'Cílios' },
        { name: 'Volume Russo', price: 180, duration: 150, cat: 'Cílios' },
        { name: 'Lash Lifting', price: 120, duration: 60, cat: 'Cílios' },
        { name: 'Design Simples', price: 45, duration: 40, cat: 'Sobrancelha' },
        { name: 'Henna Vermelha', price: 60, duration: 50, cat: 'Coloração' },
        { name: 'Fox Eyes', price: 200, duration: 150, cat: 'Cílios' },
    ];

    const services: any[] = [];
    for (const s of serviceData) {
        let svc = await prisma.service.findFirst({ where: { name: s.name, salonId: salon.id } });
        const { cat, ...data } = s;
        if (!svc) {
            svc = await prisma.service.create({ 
                data: { 
                    ...data, 
                    bufferTime: 10, 
                    salonId: salon.id,
                    categoryId: categories[cat].id
                } 
            });
        }
        services.push(svc);
    }
    console.log(`✅ ${services.length} serviços criados`);

    // ─── PROFISSIONAIS ───────────────────────────────────────────────
    const profData = [
        { name: 'Carla Mendes', commission: 0.4, email: 'carla@bellabeauty.com', nicheNames: ['Cabelo'] },
        { name: 'Juliana Silva', commission: 0.4, email: 'juliana@bellabeauty.com', nicheNames: ['Cílios', 'Designer de Sobrancelhas'] },
        { name: 'Marcos Oliveira', commission: 0.35, email: 'marcos@bellabeauty.com', nicheNames: ['Unhas'] },
        { name: 'Fernanda Costa', commission: 0.45, email: 'fernanda@bellabeauty.com', nicheNames: ['Cabelo'] },
    ];

    const professionals: any[] = [];
    for (const p of profData) {
        let prof = await prisma.professional.findFirst({ where: { name: p.name, salonId: salon.id } });
        if (!prof) {
            prof = await prisma.professional.create({ 
                data: { 
                    name: p.name, 
                    commission: p.commission, 
                    salonId: salon.id,
                    niches: {
                        connect: p.nicheNames.map(n => ({ id: niches[n].id }))
                    }
                } 
            });
        } else {
            // Atualiza nichos do profissional existente
            await prisma.professional.update({
                where: { id: prof.id },
                data: {
                    niches: {
                        set: p.nicheNames.map(n => ({ id: niches[n].id }))
                    }
                }
            });
        }
        professionals.push(prof);

        const userExists = await prisma.user.findUnique({ where: { email: p.email } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    name: p.name,
                    email: p.email,
                    password: await bcrypt.hash('bella@2025', 10),
                    role: 'PROFESSIONAL',
                    salonId: salon.id,
                    professionalId: prof.id,
                },
            });
        }
    }
    console.log(`✅ ${professionals.length} profissionais + usuários criados`);

    // ─── CLIENTES ────────────────────────────────────────────────────
    const clientData = [
        { name: 'Ana Paula Rodrigues', phone: '(11) 98765-4321' },
        { name: 'Beatriz Lima', phone: '(11) 91234-5678' },
        { name: 'Camila Ferreira', phone: '(11) 99876-1234' },
        { name: 'Daniela Santos', phone: '(11) 97654-3210' },
        { name: 'Elaine Martins', phone: '(11) 96543-2109' },
        { name: 'Fernanda Alves', phone: '(11) 95432-1098' },
        { name: 'Gabriela Souza', phone: '(11) 94321-0987' },
        { name: 'Helena Pinto', phone: '(11) 93210-9876' },
        { name: 'Isabela Cunha', phone: '(11) 92109-8765' },
        { name: 'Joana Carvalho', phone: '(11) 91098-7654' },
        { name: 'Karina Pereira', phone: '(11) 90987-6543' },
        { name: 'Larissa Nunes', phone: '(11) 89876-5432' },
        { name: 'Marina Lopes', phone: '(11) 88765-4321' },
        { name: 'Natália Gomes', phone: '(11) 87654-3210' },
        { name: 'Olivia Ramos', phone: '(11) 86543-2109' },
    ];

    const clients: any[] = [];
    for (const c of clientData) {
        let client = await prisma.client.findFirst({ where: { name: c.name, salonId: salon.id } });
        if (!client) {
            client = await prisma.client.create({ data: { ...c, salonId: salon.id } });
        }
        clients.push(client);
    }
    console.log(`✅ ${clients.length} clientes criados`);

    // ─── PRODUTOS ────────────────────────────────────────────────────
    const productData = [
        { name: 'Shampoo Profissional', price: 89.90, costPrice: 35.00, stock: 20, minStock: 5 },
        { name: 'Condicionador Hidratante', price: 79.90, costPrice: 28.00, stock: 15, minStock: 5 },
        { name: 'Máscara de Hidratação', price: 120.00, costPrice: 45.00, stock: 8, minStock: 3 },
        { name: 'Óleo Capilar', price: 95.00, costPrice: 38.00, stock: 12, minStock: 4 },
        { name: 'Esmalte Cremoso', price: 18.90, costPrice: 6.00, stock: 2, minStock: 5 },
        { name: 'Base Coat', price: 22.00, costPrice: 8.00, stock: 10, minStock: 3 },
    ];

    const products: any[] = [];
    for (const p of productData) {
        let prod = await prisma.product.findFirst({ where: { name: p.name, salonId: salon.id } });
        if (!prod) {
            prod = await prisma.product.create({ data: { ...p, salonId: salon.id } });
        }
        products.push(prod);
    }
    console.log(`✅ ${products.length} produtos criados`);

    // ─── AGENDAMENTOS PASSADOS (CONCLUÍDOS) ─────────────────────────
    const pastSlots: { clientIdx: number; profIdx: number; svcIdx: number; daysBack: number; hour: number }[] = [
        // Semana passada
        { clientIdx: 0, profIdx: 0, svcIdx: 0, daysBack: 7, hour: 9 },
        { clientIdx: 1, profIdx: 0, svcIdx: 2, daysBack: 7, hour: 11 },
        { clientIdx: 2, profIdx: 1, svcIdx: 4, daysBack: 7, hour: 10 },
        { clientIdx: 3, profIdx: 1, svcIdx: 5, daysBack: 7, hour: 14 },
        { clientIdx: 4, profIdx: 2, svcIdx: 1, daysBack: 7, hour: 15 },
        { clientIdx: 5, profIdx: 3, svcIdx: 3, daysBack: 6, hour: 9 },
        { clientIdx: 6, profIdx: 0, svcIdx: 6, daysBack: 6, hour: 11 },
        { clientIdx: 7, profIdx: 1, svcIdx: 7, daysBack: 6, hour: 13 },
        { clientIdx: 8, profIdx: 2, svcIdx: 0, daysBack: 5, hour: 9 },
        { clientIdx: 9, profIdx: 3, svcIdx: 4, daysBack: 5, hour: 10 },
        { clientIdx: 10, profIdx: 0, svcIdx: 2, daysBack: 4, hour: 9 },
        { clientIdx: 11, profIdx: 1, svcIdx: 3, daysBack: 4, hour: 14 },
        { clientIdx: 12, profIdx: 2, svcIdx: 5, daysBack: 3, hour: 10 },
        { clientIdx: 13, profIdx: 3, svcIdx: 1, daysBack: 3, hour: 11 },
        { clientIdx: 14, profIdx: 0, svcIdx: 6, daysBack: 2, hour: 9 },
        { clientIdx: 0, profIdx: 1, svcIdx: 7, daysBack: 2, hour: 14 },
        { clientIdx: 1, profIdx: 2, svcIdx: 0, daysBack: 1, hour: 10 },
        { clientIdx: 2, profIdx: 3, svcIdx: 2, daysBack: 1, hour: 13 },
        { clientIdx: 3, profIdx: 0, svcIdx: 4, daysBack: 1, hour: 15 },
        { clientIdx: 4, profIdx: 1, svcIdx: 3, daysBack: 14, hour: 9 },
        { clientIdx: 5, profIdx: 0, svcIdx: 0, daysBack: 14, hour: 11 },
        { clientIdx: 6, profIdx: 2, svcIdx: 6, daysBack: 10, hour: 14 },
        { clientIdx: 7, profIdx: 3, svcIdx: 5, daysBack: 10, hour: 16 },
        { clientIdx: 8, profIdx: 0, svcIdx: 7, daysBack: 9, hour: 9 },
        { clientIdx: 9, profIdx: 1, svcIdx: 1, daysBack: 9, hour: 15 },
        { clientIdx: 10, profIdx: 2, svcIdx: 2, daysBack: 8, hour: 10 },
        { clientIdx: 11, profIdx: 3, svcIdx: 4, daysBack: 8, hour: 11 },
    ];

    let totalAppointments = 0;
    let totalRevenue = 0;

    for (const slot of pastSlots) {
        const client = clients[slot.clientIdx];
        const professional = professionals[slot.profIdx];
        const service = services[slot.svcIdx];
        const date = daysAgo(slot.daysBack, slot.hour);
        const methods = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];
        const method = methods[Math.floor(Math.random() * methods.length)];

        const existing = await prisma.appointment.findFirst({
            where: { clientId: client.id, professionalId: professional.id, date },
        });
        if (existing) continue;

        const appointment = await prisma.appointment.create({
            data: {
                date,
                status: 'COMPLETED',
                salonId: salon.id,
                clientId: client.id,
                professionalId: professional.id,
                serviceId: service.id,
            },
        });

        const payment = await prisma.payment.create({
            data: { amount: service.price, method, salonId: salon.id, appointmentId: appointment.id },
        });

        await prisma.financialTransaction.create({
            data: {
                salonId: salon.id,
                type: 'INCOME',
                category: 'SERVICE',
                description: `${service.name} - ${client.name}`,
                amount: service.price,
                paymentId: payment.id,
                createdAt: date,
            },
        });

        const commAmount = service.price * professional.commission;
        await prisma.commission.create({
            data: {
                amount: commAmount,
                status: slot.daysBack > 5 ? 'PAID' : 'PENDING',
                professionalId: professional.id,
                appointmentId: appointment.id,
            },
        });

        totalAppointments++;
        totalRevenue += service.price;
    }
    console.log(`✅ ${totalAppointments} agendamentos concluídos (receita: R$ ${totalRevenue.toFixed(2)})`);

    // ─── AGENDAMENTOS DE HOJE ────────────────────────────────────────
    const todaySlots = [
        { clientIdx: 5, profIdx: 0, svcIdx: 0, hour: 9, status: 'CONFIRMED' },
        { clientIdx: 6, profIdx: 0, svcIdx: 6, hour: 11, status: 'SCHEDULED' },
        { clientIdx: 7, profIdx: 1, svcIdx: 4, hour: 10, status: 'CONFIRMED' },
        { clientIdx: 8, profIdx: 1, svcIdx: 2, hour: 13, status: 'SCHEDULED' },
        { clientIdx: 9, profIdx: 2, svcIdx: 1, hour: 9, status: 'CHECKED_IN' },
        { clientIdx: 10, profIdx: 3, svcIdx: 3, hour: 14, status: 'SCHEDULED' },
    ];

    for (const slot of todaySlots) {
        const date = today(slot.hour);
        const existing = await prisma.appointment.findFirst({
            where: { clientId: clients[slot.clientIdx].id, date },
        });
        if (existing) continue;
        await prisma.appointment.create({
            data: {
                date,
                status: slot.status,
                salonId: salon.id,
                clientId: clients[slot.clientIdx].id,
                professionalId: professionals[slot.profIdx].id,
                serviceId: services[slot.svcIdx].id,
            },
        });
    }
    console.log(`✅ ${todaySlots.length} agendamentos para hoje`);

    // ─── AGENDAMENTOS FUTUROS ────────────────────────────────────────
    const futureSlots = [
        { clientIdx: 11, profIdx: 0, svcIdx: 0, daysAhead: 1, hour: 10 },
        { clientIdx: 12, profIdx: 1, svcIdx: 2, daysAhead: 1, hour: 14 },
        { clientIdx: 13, profIdx: 2, svcIdx: 3, daysAhead: 2, hour: 9 },
        { clientIdx: 14, profIdx: 3, svcIdx: 4, daysAhead: 2, hour: 11 },
        { clientIdx: 0, profIdx: 0, svcIdx: 7, daysAhead: 3, hour: 10 },
        { clientIdx: 1, profIdx: 1, svcIdx: 5, daysAhead: 3, hour: 15 },
        { clientIdx: 2, profIdx: 2, svcIdx: 1, daysAhead: 4, hour: 9 },
    ];

    for (const slot of futureSlots) {
        const date = daysFromNow(slot.daysAhead, slot.hour);
        const existing = await prisma.appointment.findFirst({
            where: { clientId: clients[slot.clientIdx].id, date },
        });
        if (existing) continue;
        await prisma.appointment.create({
            data: {
                date,
                status: 'SCHEDULED',
                salonId: salon.id,
                clientId: clients[slot.clientIdx].id,
                professionalId: professionals[slot.profIdx].id,
                serviceId: services[slot.svcIdx].id,
            },
        });
    }
    console.log(`✅ ${futureSlots.length} agendamentos futuros`);

    // ─── DESPESAS (TRANSAÇÕES FINANCEIRAS DE SAÍDA) ──────────────────
    const expenses = [
        { category: 'RENT', description: 'Aluguel de março', amount: 3500, daysBack: 10 },
        { category: 'SALARY', description: 'Salário – recepcionista', amount: 2200, daysBack: 8 },
        { category: 'MATERIAL', description: 'Tinta para cabelo', amount: 420, daysBack: 6 },
        { category: 'MATERIAL', description: 'Produtos de limpeza e EPI', amount: 180, daysBack: 5 },
        { category: 'PRODUCT', description: 'Reposição de estoque shampoo', amount: 650, daysBack: 4 },
        { category: 'OTHER', description: 'Manutenção ar-condicionado', amount: 380, daysBack: 3 },
        { category: 'PRO_LABORE', description: 'Pró-labore proprietária', amount: 4000, daysBack: 2 },
    ];

    for (const exp of expenses) {
        const existing = await prisma.financialTransaction.findFirst({
            where: { description: exp.description, salonId: salon.id, type: 'EXPENSE' },
        });
        if (existing) continue;
        await prisma.financialTransaction.create({
            data: {
                salonId: salon.id,
                type: 'EXPENSE',
                category: exp.category,
                description: exp.description,
                amount: exp.amount,
                createdAt: daysAgo(exp.daysBack),
            },
        });
    }
    console.log(`✅ ${expenses.length} despesas registradas`);

    // ─── COMANDAS ABERTAS ────────────────────────────────────────────
    const orderClient = clients[4];
    const existingOrder = await prisma.order.findFirst({ where: { clientId: orderClient.id, status: 'OPEN' } });
    if (!existingOrder) {
        await prisma.order.create({
            data: {
                salonId: salon.id,
                clientId: orderClient.id,
                status: 'OPEN',
                totalAmount: 0,
                discount: 0,
            },
        });
    }
    console.log('✅ 1 comanda aberta criada');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Acesse: http://localhost:3001/login');
    console.log('  Admin : admin@bellabeauty.com / bella@2025');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {}

    // Roda a cada 5 minutos
    // Roda a cada 5 minutos
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleReminders() {
        this.logger.log('Executando job de lembretes Automáticos (WhatsApp)...');

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // --- 1) LEMBRETE DE 24 HORAS ---
        const windowEnd24h = new Date(in24Hours.getTime() + 5 * 60 * 1000); // margem de 5 min
        
        const appointments24h = await this.prisma.appointment.findMany({
            where: {
                status: 'SCHEDULED',
                notified24h: false,
                date: {
                    gte: in24Hours,
                    lt: windowEnd24h,
                },
            },
            include: { client: true, service: true, salon: true }
        });

        for (const app of appointments24h) {
            if (app.client.phone) {
                const dia = app.date.toLocaleDateString('pt-BR');
                const hora = app.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                let message = `Olá *${app.client.name}*!\n\nPassando para confirmar o seu agendamento de *${app.service.name}* amanhã (${dia}) às *${hora}* no salão *${app.salon.name}*.\n\nNos vemos em breve!`;
                
                if (app.salon.whatsappTemplate24h) {
                    message = this.replaceTemplateVariables(app.salon.whatsappTemplate24h, app, dia, hora);
                }
                
                await this.sendMessage(app, message);
                
                await this.prisma.appointment.update({
                    where: { id: app.id },
                    data: { notified24h: true }
                });
            }
        }

        // --- 2) LEMBRETE DE 2 HORAS ---
        const windowEnd2h = new Date(in2Hours.getTime() + 5 * 60 * 1000);
        
        const appointments2h = await this.prisma.appointment.findMany({
            where: {
                status: 'SCHEDULED',
                notified2h: false,
                date: {
                    gte: in2Hours,
                    lt: windowEnd2h,
                },
            },
            include: { client: true, service: true, salon: true }
        });

        for (const app of appointments2h) {
            if (app.client.phone) {
                const dia = app.date.toLocaleDateString('pt-BR');
                const hora = app.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                let message = `Olá *${app.client.name}*, seu agendamento de *${app.service.name}* no *${app.salon.name}* é em 2 horas!\n\nEstamos aguardando você.`;
                
                if (app.salon.whatsappTemplate2h) {
                    message = this.replaceTemplateVariables(app.salon.whatsappTemplate2h, app, dia, hora);
                }
                
                await this.sendMessage(app, message);
                
                await this.prisma.appointment.update({
                    where: { id: app.id },
                    data: { notified2h: true }
                });
            }
        }
    }

    private replaceTemplateVariables(template: string, app: any, date: string, time: string): string {
        return template
            .replace(/\{\{clientName\}\}/g, app.client.name)
            .replace(/\{\{serviceName\}\}/g, app.service.name)
            .replace(/\{\{salonName\}\}/g, app.salon.name)
            .replace(/\{\{date\}\}/g, date)
            .replace(/\{\{time\}\}/g, time);
    }

    private async sendMessage(app: any, message: string) {
        const phone = app.client.phone;
        const provider = app.salon.whatsappProvider;

        if (provider === 'EVOLUTION') {
            await this.sendEvolutionMessage(phone, message);
        } else if (provider === 'OFFICIAL') {
            await this.sendOfficialMessage(phone, message, app.salon.whatsappToken, app.salon.whatsappPhoneId);
        } else {
            this.logger.debug(`Salão ${app.salon.name} não possui notificação de WhatsApp ativada (Provider: NONE).`);
        }
    }

    private formatPhoneNumber(phone: string): string {
        let number = phone.replace(/\D/g, ''); 
        if (number.length === 11 || number.length === 10) {
            number = `55${number}`;
        }
        return number;
    }

    private async sendEvolutionMessage(phone: string, message: string) {
        const apiUrl = this.configService.get('EVOLUTION_API_URL');
        const instance = this.configService.get('EVOLUTION_INSTANCE');
        const apikey = this.configService.get('EVOLUTION_API_KEY');

        if (!apiUrl || !instance || !apikey) {
            this.logger.warn(`Credenciais da Evolution API não estão configuradas no .env. Ignorando mensagem.`);
            return;
        }

        const number = this.formatPhoneNumber(phone);

        try {
            const endpoint = `${apiUrl}/message/sendText/${instance}`;
            await axios.post(
                endpoint,
                { number: number, text: message },
                {
                    headers: {
                        'apikey': apikey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            this.logger.log(`Mensagem Evolution enviada para: ${phone}`);
        } catch (error) {
            this.logger.error(`Erro na Evolution API para ${phone}: ${error.message}`);
        }
    }

    private async sendOfficialMessage(phone: string, message: string, token: string, phoneId: string) {
        if (!token || !phoneId) {
            this.logger.warn(`Salão não forneceu Token ou PhoneID para API Oficial do WhatsApp. Ignorando.`);
            return;
        }

        const number = this.formatPhoneNumber(phone);

        try {
            const endpoint = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
            await axios.post(
                endpoint,
                {
                    messaging_product: "whatsapp",
                    to: number,
                    type: "text",
                    text: { body: message }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            this.logger.log(`Mensagem API Oficial enviada para: ${phone}`);
        } catch (error) {
            this.logger.error(`Erro na API Oficial WhatsApp para ${phone}: ${error.message}`);
        }
    }
}

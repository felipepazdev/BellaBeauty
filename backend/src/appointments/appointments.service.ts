import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

type CalendarSlot = {
  time: string;
  status: 'FREE' | 'BOOKED' | 'BLOCKED';
  client?: string;
  professional?: string;
  service?: string;
};

type ProfessionalDayCalendar = {
  professionalId: string;
  professional: string;
  slots: CalendarSlot[];
};

type WeekDaySlots = {
  date: string;
  slots: CalendarSlot[];
};

type ProfessionalWeekCalendar = {
  professionalId: string;
  professional: string;
  days: WeekDaySlots[];
};

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateAppointmentDto,
    salonId: string,
    user: { role: string; permissions?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointmentStart = new Date(data.date);

      const service = await tx.service.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Serviço não encontrado');
      }

      // Prioriza duration ou endDate manual se fornecidos
      let appointmentEnd: Date;
      let finalDuration: number;

      if (data.endDate) {
        appointmentEnd = new Date(data.endDate);
        finalDuration = Math.round(
          (appointmentEnd.getTime() - appointmentStart.getTime()) / 60000,
        );
      } else if (data.duration) {
        finalDuration = data.duration;
        appointmentEnd = new Date(
          appointmentStart.getTime() + finalDuration * 60000,
        );
      } else {
        finalDuration = service.duration;
        const buffer = service.bufferTime ?? 0;
        appointmentEnd = new Date(
          appointmentStart.getTime() + (finalDuration + buffer) * 60000,
        );
      }

      if (appointmentEnd <= appointmentStart) {
        throw new BadRequestException(
          'O horário de término deve ser após o de início',
        );
      }

      const block = await tx.scheduleBlock.findFirst({
        where: {
          salonId,
          start: { lte: appointmentEnd },
          end: { gte: appointmentStart },
          OR: [
            { professionalId: data.professionalId },
            { professionalId: null },
          ],
        },
      });

      if (block) {
        throw new BadRequestException('Este horário está bloqueado na agenda');
      }

      const conflict = await tx.appointment.findFirst({
        where: {
          salonId,
          professionalId: data.professionalId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          date: { lte: appointmentEnd },
          endDate: { gte: appointmentStart },
        },
      });

      if (conflict) {
        throw new ConflictException('Este horário já está ocupado');
      }

      // Validar se está dentro do horário de trabalho (se não for ADMIN ou tiver permissão)
      const canScheduleOutside =
        user.role === 'ADMIN' ||
        user.permissions?.includes('schedule_outside_hours');

      if (!canScheduleOutside) {
        const isInside = await this.isInsideWorkingHours(
          data.professionalId,
          appointmentStart,
          appointmentEnd,
        );

        if (!isInside) {
          throw new BadRequestException(
            'Apenas usuários autorizados podem agendar fora do horário de trabalho',
          );
        }
      }

      // 1) Garante que o cliente tenha uma comanda aberta
      let order = await tx.order.findFirst({
        where: { salonId, clientId: data.clientId, status: 'OPEN' },
      });

      if (!order) {
        order = await tx.order.create({
          data: {
            salonId,
            clientId: data.clientId,
            status: 'OPEN',
          },
        });
      }

      return tx.appointment.create({
        data: {
          salonId,
          clientId: data.clientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          date: appointmentStart,
          endDate: appointmentEnd,
          duration: finalDuration,
          status: 'SCHEDULED',
          orderId: order.id,
        },
      });
    });
  }

  async findByDay(
    date: string,
    salonId: string,
    role?: string,
    professionalId?: string,
  ) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const whereClause: any = {
      salonId,
      status: { not: 'CANCELLED' },
      date: { gte: start, lte: end },
    };

    if (role === 'PROFESSIONAL' && professionalId) {
      whereClause.professionalId = professionalId;
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        professional: true,
        service: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getTimelineDay(
    date: string,
    salonId: string,
    role?: string,
    professionalId?: string,
  ) {
    const day = new Date(date);
    const dayOfWeek = day.getDay();

    const professionalWhere: any = { salonId };
    if (role === 'PROFESSIONAL' && professionalId) {
      professionalWhere.id = professionalId;
    }

    const professionals = await this.prisma.professional.findMany({
      where: professionalWhere,
    });

    const schedules = await this.prisma.professionalSchedule.findMany({
      where: {
        professionalId: { in: professionals.map((p) => p.id) },
        dayOfWeek,
      },
    });

    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        salonId,
        start: { gte: new Date(`${date}T00:00:00`) },
        end: { lte: new Date(`${date}T23:59:59`) },
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        status: { not: 'CANCELLED' },
        date: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      },
      include: {
        client: true,
        service: true,
      },
    });

    const appointmentMap = new Map<string, any>();

    for (const a of appointments) {
      const start = new Date(a.date);
      const duration = a.service.duration;

      const totalSlots = Math.ceil(duration / 15);

      for (let i = 0; i < totalSlots; i++) {
        const slotTime = new Date(start);
        slotTime.setMinutes(start.getMinutes() + i * 15);

        const time = slotTime.toISOString().substring(11, 16);

        appointmentMap.set(`${a.professionalId}-${time}`, a);
      }
    }

    const result: ProfessionalDayCalendar[] = [];

    for (const professional of professionals) {
      const professionalSchedules = schedules.filter(
        (s) => s.professionalId === professional.id,
      );

      if (professionalSchedules.length === 0) {
        result.push({
          professionalId: professional.id,
          professional: professional.name,
          slots: [],
        });
        continue;
      }

      const slots: CalendarSlot[] = [];

      // Para cada range do dia (ex: 08-12, 13-18)
      for (const schedule of professionalSchedules) {
        const start = new Date(`${date}T${schedule.startTime}:00`);
        const end = new Date(`${date}T${schedule.endTime}:00`);

        const current = new Date(start);

        while (current < end) {
          const time = current.toISOString().substring(11, 16);

          const appointment = appointmentMap.get(`${professional.id}-${time}`);

          const isBlocked = blocks.some((b) => {
            if (b.professionalId && b.professionalId !== professional.id)
              return false;

            const blockStart = new Date(b.start);
            const blockEnd = new Date(b.end);

            return current >= blockStart && current < blockEnd;
          });

          if (isBlocked) {
            slots.push({
              time,
              status: 'BLOCKED',
              professional: professional.name,
            });
          } else if (appointment) {
            slots.push({
              time,
              status: 'BOOKED',
              client: appointment.client.name,
              service: appointment.service.name,
              professional: professional.name,
            });
          } else {
            slots.push({
              time,
              status: 'FREE',
              professional: professional.name,
            });
          }

          current.setMinutes(current.getMinutes() + 15);
        }
      }

      result.push({
        professionalId: professional.id,
        professional: professional.name,
        slots,
      });
    }

    return result;
  }

  async getTimelineWeek(
    date: string,
    salonId: string,
    role?: string,
    professionalId?: string,
  ) {
    // PERFOMANCE: Reduzindo de (7 days * 4 queries) = 28 queries para apenas 4 queries para gerar a semana inteira!
    const base = new Date(date);

    const firstDay = new Date(base);
    firstDay.setDate(base.getDate() - base.getDay());

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    const startWeekStr = firstDay.toISOString().substring(0, 10);
    const endWeekStr = lastDay.toISOString().substring(0, 10);

    const professionalWhere: any = { salonId };
    if (role === 'PROFESSIONAL' && professionalId) {
      professionalWhere.id = professionalId;
    }

    const professionals = await this.prisma.professional.findMany({
      where: professionalWhere,
    });

    const schedules = await this.prisma.professionalSchedule.findMany({
      where: {
        professionalId: { in: professionals.map((p) => p.id) },
      },
    });

    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        salonId,
        start: { gte: new Date(`${startWeekStr}T00:00:00`) },
        end: { lte: new Date(`${endWeekStr}T23:59:59`) },
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        status: { not: 'CANCELLED' },
        date: {
          gte: new Date(`${startWeekStr}T00:00:00`),
          lte: new Date(`${endWeekStr}T23:59:59`),
        },
      },
      include: {
        client: true,
        service: true,
      },
    });

    const result: ProfessionalWeekCalendar[] = [];

    for (const professional of professionals) {
      const days: WeekDaySlots[] = [];

      for (let i = 0; i < 7; i++) {
        const current = new Date(firstDay);
        current.setDate(firstDay.getDate() + i);

        const dayStr = current.toISOString().substring(0, 10);
        const dayOfWeek = current.getDay();

        const daySchedules = schedules.filter(
          (s) =>
            s.professionalId === professional.id && s.dayOfWeek === dayOfWeek,
        );

        const slots: CalendarSlot[] = [];

        if (daySchedules.length === 0) {
          days.push({ date: dayStr, slots: [] });
          continue;
        }

        for (const schedule of daySchedules) {
          const start = new Date(`${dayStr}T${schedule.startTime}:00`);
          const end = new Date(`${dayStr}T${schedule.endTime}:00`);

          const currentSlot = new Date(start);

          while (currentSlot < end) {
            const time = currentSlot.toISOString().substring(11, 16);
            let isBlocked = false;
            let bookedInfo: any = null;

            // Verifica se está bloqueado
            for (const b of blocks) {
              if (b.professionalId && b.professionalId !== professional.id)
                continue;
              if (currentSlot >= b.start && currentSlot < b.end) {
                isBlocked = true;
                break;
              }
            }

            if (!isBlocked) {
              // Verifica agendamentos
              for (const a of appointments) {
                if (a.professionalId !== professional.id) continue;
                const appStart = new Date(a.date);
                const duration = a.service.duration;
                const appEnd = new Date(appStart);
                appEnd.setMinutes(
                  appStart.getMinutes() + Math.ceil(duration / 15) * 15,
                );

                if (currentSlot >= appStart && currentSlot < appEnd) {
                  bookedInfo = a;
                  break;
                }
              }
            }

            if (isBlocked) {
              slots.push({
                time,
                status: 'BLOCKED',
                professional: professional.name,
              });
            } else if (bookedInfo) {
              slots.push({
                time,
                status: 'BOOKED',
                client: bookedInfo.client.name,
                service: bookedInfo.service.name,
                professional: professional.name,
              });
            } else {
              slots.push({
                time,
                status: 'FREE',
                professional: professional.name,
              });
            }

            currentSlot.setMinutes(currentSlot.getMinutes() + 15);
          }
        }

        days.push({
          date: dayStr,
          slots,
        });
      }

      result.push({
        professionalId: professional.id,
        professional: professional.name,
        days,
      });
    }

    return result;
  }

  async update(
    appointmentId: string,
    data: UpdateAppointmentDto,
    salonId: string,
    user: { role: string; permissions?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, salonId },
        include: { service: true },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      const appointmentStart = data.date
        ? new Date(data.date)
        : appointment.date;

      let appointmentEnd: Date;
      let finalDuration: number;

      if (data.endDate) {
        appointmentEnd = new Date(data.endDate);
        finalDuration = Math.round(
          (appointmentEnd.getTime() - appointmentStart.getTime()) / 60000,
        );
      } else if (data.duration) {
        finalDuration = data.duration;
        appointmentEnd = new Date(
          appointmentStart.getTime() + finalDuration * 60000,
        );
      } else if (data.date || data.serviceId) {
        // Se mudou data ou serviço, recalcular com base no serviço atualizado
        const service = data.serviceId
          ? await tx.service.findUnique({ where: { id: data.serviceId } })
          : appointment.service;

        if (!service) {
          throw new NotFoundException('Serviço não encontrado');
        }

        finalDuration = service.duration;
        const buffer = service.bufferTime ?? 0;
        appointmentEnd = new Date(
          appointmentStart.getTime() + (finalDuration + buffer) * 60000,
        );
      } else {
        appointmentEnd =
          appointment.endDate ||
          new Date(
            appointment.date.getTime() + appointment.service.duration * 60000,
          );
        finalDuration = appointment.duration || appointment.service.duration;
      }

      if (appointmentEnd <= appointmentStart) {
        throw new BadRequestException(
          'O horário de término deve ser após o de início',
        );
      }

      const professionalId = data.professionalId ?? appointment.professionalId;

      // Bloqueio
      const block = await tx.scheduleBlock.findFirst({
        where: {
          salonId,
          start: { lte: appointmentEnd },
          end: { gte: appointmentStart },
          OR: [{ professionalId }, { professionalId: null }],
        },
      });

      if (block) {
        throw new BadRequestException('Este horário está bloqueado na agenda');
      }

      // Conflito (ignorando o próprio agendamento)
      const conflict = await tx.appointment.findFirst({
        where: {
          id: { not: appointmentId },
          salonId,
          professionalId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          date: { lte: appointmentEnd },
          endDate: { gte: appointmentStart },
        },
      });

      if (conflict) {
        throw new ConflictException('Este horário já está ocupado');
      }

      // Horário de trabalho
      const canScheduleOutside =
        user.role === 'ADMIN' ||
        user.permissions?.includes('schedule_outside_hours');
      if (!canScheduleOutside) {
        const isInside = await this.isInsideWorkingHours(
          professionalId,
          appointmentStart,
          appointmentEnd,
        );
        if (!isInside) {
          throw new BadRequestException(
            'Fora do horário de trabalho permitido',
          );
        }
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          clientId: data.clientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          date: appointmentStart,
          endDate: appointmentEnd,
          duration: finalDuration,
        },
      });
    });
  }

  async reschedule(
    appointmentId: string,
    newDate: string,
    professionalId: string,
    salonId: string,
    user: { role: string; permissions?: string },
  ) {
    // Agora podemos simplesmente reutilizar o update
    return this.update(
      appointmentId,
      { date: newDate, professionalId },
      salonId,
      user,
    );
  }

  async cancel(
    appointmentId: string,
    salonId: string,
    dto: CancelAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, salonId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelReason: dto.reason,
      },
    });
  }

  async checkIn(appointmentId: string, salonId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, salonId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CHECKED_IN' },
    });
  }

  async complete(appointmentId: string, salonId: string, paymentData?: { method: string; fee?: number }) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, salonId },
        include: {
          service: true,
          professional: true,
          client: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      const price = appointment.service.price;
      const fee = paymentData?.fee || 0;
      const costPrice = appointment.service.costPrice || 0;
      const netValue = Math.max(0, price - fee - costPrice); // Preço líquido descontando taxa do cartão e custo do material

      const payment = await tx.payment.create({
        data: {
          salonId,
          appointmentId: appointment.id,
          amount: price,
          method: paymentData?.method || 'LOCAL',
          fee: fee,
        },
      });

      // REGISTRO FINANCEIRO
      await tx.financialTransaction.create({
        data: {
          salonId,
          type: 'ENTRADA',
          category: 'SERVICE',
          description: `Agendamento: ${appointment.service.name} (Cliente: ${appointment.client?.name || 'Local'}) - Pagamento via ${paymentData?.method || 'Dinheiro'}`,
          amount: price,
          fee: fee,
          paymentId: payment.id,
        },
      });

      // CÁLCULO DE COMISSÃO (Valor Líquido - Taxas)
      // Se for RENT (Aluguel), o profissional fica com 100% do líquido.
      // Se for COMMISSION, aplica a % sobre o líquido.
      const commissionAmount =
        appointment.professional.contractType === 'RENT'
          ? netValue
          : (netValue * appointment.professional.commission) / 100;

      const commission = await tx.commission.create({
        data: {
          appointmentId: appointment.id,
          professionalId: appointment.professional.id,
          amount: commissionAmount,
          status: 'PENDING',
        },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'COMPLETED' },
      });

      return {
        appointment: updatedAppointment,
        payment,
        commission,
        netValue,
      };
    });
  }

  async noShow(id: string, salonId: string) {
    return this.prisma.appointment.update({
      where: { id, salonId },
      data: { status: 'NO_SHOW' },
    });
  }

  async findByProfessional(
    salonId: string,
    professionalId: string,
    limit: number = 50,
  ) {
    return this.prisma.appointment.findMany({
      where: {
        salonId,
        professionalId,
      },
      include: {
        client: true,
        service: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });
  }

  async getAvailableSlots(
    professionalId: string,
    serviceId: string,
    date: string,
    salonId: string,
    user: { role: string; permissions?: string },
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const day = new Date(date);
    const dayOfWeek = day.getDay();

    const canScheduleOutside =
      user.role === 'ADMIN' ||
      user.permissions?.includes('schedule_outside_hours');

    let shifts: { startTime: string; endTime: string }[] = [];

    if (canScheduleOutside) {
      // Se pode agendar fora, liberamos um range amplo (05:00 às 23:45)
      shifts = [{ startTime: '05:00', endTime: '23:45' }];
    } else {
      const workingHours = await this.prisma.professionalSchedule.findMany({
        where: { professionalId, dayOfWeek },
      });
      if (workingHours.length === 0) return [];
      shifts = workingHours.map((wh) => ({
        startTime: wh.startTime,
        endTime: wh.endTime,
      }));
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        status: { not: 'CANCELLED' },
        date: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      },
      include: { service: true },
    });

    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        salonId,
        OR: [{ professionalId }, { professionalId: null }],
        start: { lte: new Date(`${date}T23:59:59`) },
        end: { gte: new Date(`${date}T00:00:00`) },
      },
    });

    const availableSlots: string[] = [];
    const duration = service.duration + (service.bufferTime ?? 0);

    for (const wh of shifts) {
      const start = new Date(`${date}T${wh.startTime}:00`);
      const end = new Date(`${date}T${wh.endTime}:00`);
      const current = new Date(start);

      while (current.getTime() + duration * 60000 <= end.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + duration * 60000);

        const hasConflict = appointments.some((a) => {
          const aStart = new Date(a.date);
          const aEnd = new Date(
            aStart.getTime() +
              (a.service.duration + (a.service.bufferTime ?? 0)) * 60000,
          );
          return slotStart < aEnd && slotEnd > aStart;
        });

        const hasBlock = blocks.some((b) => {
          const bStart = new Date(b.start);
          const bEnd = new Date(b.end);
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (!hasConflict && !hasBlock) {
          availableSlots.push(
            String(current.getHours()).padStart(2, '0') +
              ':' +
              String(current.getMinutes()).padStart(2, '0'),
          );
        }

        current.setMinutes(current.getMinutes() + 15);
      }
    }

    return availableSlots;
  }

  async isInsideWorkingHours(
    professionalId: string,
    start: Date,
    end?: Date,
  ): Promise<boolean> {
    const timeZone = 'America/Sao_Paulo';

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('pt-BR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    const startTimeStr = formatTime(start);
    const endTimeStr = end ? formatTime(end) : null;

    const dayStr = start.toLocaleDateString('en-US', {
      timeZone,
      weekday: 'long',
    });
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const dayOfWeek = dayMap[dayStr];

    const schedules = await this.prisma.professionalSchedule.findMany({
      where: { professionalId, dayOfWeek },
    });

    if (schedules.length === 0) return false;

    // Validar início
    const startValid = schedules.some(
      (s) => startTimeStr >= s.startTime && startTimeStr < s.endTime,
    );
    if (!startValid) return false;

    // Validar término (se fornecido)
    if (endTimeStr) {
      const endValid = schedules.some(
        (s) => endTimeStr > s.startTime && endTimeStr <= s.endTime,
      );
      if (!endValid) return false;
    }

    return true;
  }
}

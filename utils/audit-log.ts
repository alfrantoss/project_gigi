import { prisma } from '@/lib/prisma';

interface AuditLogData {
  userId: string;
  action: string;
  module: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: any;
  newData?: any;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: data.module,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        oldData: data.oldData,
        newData: data.newData,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(
  filters: {
    userId?: string;
    module?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
  page = 1,
  limit = 50
) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.module) where.module = filters.module;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

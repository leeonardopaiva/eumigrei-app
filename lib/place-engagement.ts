import { Prisma } from '@prisma/client';

const normalizeAverage = (average: number | null | undefined) => {
  if (!average || Number.isNaN(average)) {
    return 0;
  }

  return Math.round(average * 10) / 10;
};

export const refreshBusinessRating = async (
  tx: Prisma.TransactionClient,
  businessId: string,
) => {
  const aggregate = await tx.businessRating.aggregate({
    where: { businessId },
    _avg: { stars: true },
    _count: { _all: true },
  });

  return tx.business.update({
    where: { id: businessId },
    data: {
      ratingAverage: normalizeAverage(aggregate._avg.stars),
      ratingCount: aggregate._count._all,
    },
    select: {
      id: true,
      ratingAverage: true,
      ratingCount: true,
    },
  });
};

export const refreshEventRating = async (
  tx: Prisma.TransactionClient,
  eventId: string,
) => {
  const aggregate = await tx.eventRating.aggregate({
    where: { eventId },
    _avg: { stars: true },
    _count: { _all: true },
  });

  return tx.event.update({
    where: { id: eventId },
    data: {
      ratingAverage: normalizeAverage(aggregate._avg.stars),
      ratingCount: aggregate._count._all,
    },
    select: {
      id: true,
      ratingAverage: true,
      ratingCount: true,
    },
  });
};

import { PrismaClient } from "@prisma/client";

const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export class CategoryRepository {
  async getCategories(type?: string) {
    const data = await prisma.categories.findMany({
      where: type ? { type } : undefined,
      include: {
        kpidefinitions_category: {
          include: { kpidefinition: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return data.map(this.mapPrismaCategory);
  }

  mapPrismaCategory(row: any) {
    const kpis = row.kpidefinitions_category?.map((k: any) => k.kpidefinition);
    return {
      ...row,
      kpis,
    };
  }
}

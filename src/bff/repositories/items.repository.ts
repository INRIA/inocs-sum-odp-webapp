import { PrismaClient } from "@prisma/client";

const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export class ItemRepository {
  async getItems(categoryIds?: number[]) {
    const data = await prisma.items.findMany({
      where: {
        visible: 1,
        category_id: categoryIds?.length
          ? { in: categoryIds.map((id) => BigInt(id)) }
          : undefined,
      },
      include: {
        living_lab: true,
        kpidefinition: true,
        project: true,
        item_tag: {
          include: { tags: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return data;
  }

  async getItemsByCategoryType(categoryType: string) {
    const categories = await prisma.categories.findMany({
      where: { type: categoryType },
    });

    if (categories.length === 0) {
      return null;
    }

    const categoryIds = categories.map((c: any) => c.id);
    const categoryMap = new Map(categories.map((c: any) => [String(c.id), c]));

    const data = await prisma.items.findMany({
      where: {
        visible: 1,
        category_id: { in: categoryIds },
      },
      include: {
        living_lab: true,
        kpidefinition: true,
        project: true,
        item_tag: {
          include: { tags: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return data.map((item: any) => ({
      ...item,
      category: categoryMap.get(String(item.category_id)) || null,
    }));
  }
}

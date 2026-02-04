import { ItemRepository } from "../repositories/items.repository";

export class ItemService {
  private repo = new ItemRepository();

  async getItems(categoryIds?: number[]) {
    return this.repo.getItems(categoryIds);
  }

  async getItemsByCategoryType(categoryType: string) {
    return this.repo.getItemsByCategoryType(categoryType);
  }
}

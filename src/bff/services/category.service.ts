import { CategoryRepository } from "../repositories/category.repository";

export class CategoryService {
  private repo = new CategoryRepository();

  async getCategories(type?: string) {
    return this.repo.getCategories(type);
  }
}

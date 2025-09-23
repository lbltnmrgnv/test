import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus, InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PatchCategoryDto } from './dto/patch-category.dto';
import {JsonCategory} from "./category-json.model";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  createdDate: string; // ISO string
}

@Injectable()
export class CategoryService {
  private readonly filePath = join(process.cwd(), 'src', 'data', 'categories.json');

  private static readonly defaultPageSize = 10;
  private static readonly defaultSort = '-createdDate';

  private async readFile(): Promise<Category[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data) as Category[];
    } catch {
      return [];
    }
  }

  private async writeFile(categories: Category[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(categories, null, 2));
  }

  async create(dto: CreateCategoryDto): Promise<JsonCategory> {
    if (!dto.description) {
      throw new InternalServerErrorException();
    }
    if (dto.active === undefined || dto.active === null) {
      throw new BadRequestException('Active is required.');
    }
    if (dto.active === false) {
      throw new BadRequestException('Active must be a boolean value.');
    }

    const categories = await this.readFile();

    if (categories.some(c => c.slug === dto.slug)) {
      throw new BadRequestException('Category with this slug already exist.');
    }

    const category: JsonCategory = {
      id: uuidv4(),
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      active: dto.active,
      createdDate: new Date().toISOString(),
    };

    categories.push(category);
    await this.writeFile(categories);
    return category;
  }

  async findOne(identifier: string): Promise<Category> {
    const categories = await this.readFile();
    const category = categories.find(c => c.id === identifier || c.slug === identifier);
    if (!category) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Category not found.',
      });
    }
    return category;
  }

  async getAll(params?: {
    name?: string;
    description?: string;
    search?: string;
    active?: boolean;
    pageSize?: number;
    page?: number;
    sort?: string;
  }): Promise<Category[]> {
    let categories = await this.readFile();

    // фильтр по имени
    if (params?.name) {
      categories = categories.filter(c =>
          c.name.toLowerCase().includes(params.name.toLowerCase()),
      );
    }

    // фильтр по описанию
    if (params?.description) {
      categories = categories.filter(c =>
          (c.description ?? '').toLowerCase().includes(params.description.toLowerCase()),
      );
    }

    // общий поиск
    if (params?.search) {
      const search = params.search.toLowerCase();
      categories = categories.filter(
          c =>
              c.name.toLowerCase().includes(search) ||
              (c.description ?? '').toLowerCase().includes(search),
      );
    }

    // фильтр по активности
    if (params?.active !== undefined) {
      categories = categories.filter(c => c.active === params.active);
    }

    // сортировка
    const sortField = params?.sort ? params.sort.replace('-', '') : CategoryService.defaultSort.replace('-', '');
    const direction = params?.sort
        ? params.sort.startsWith('-')
            ? -1
            : 1
        : CategoryService.defaultSort.startsWith('-')
            ? -1
            : 1;

    categories = categories.sort((a, b) => {
      const aVal = sortField === 'createdDate' ? new Date(a.createdDate).getTime() : (a as any)[sortField];
      const bVal = sortField === 'createdDate' ? new Date(b.createdDate).getTime() : (b as any)[sortField];
      return aVal > bVal ? direction : -direction;
    });

    // пагинация
    const pageSize = params?.pageSize ?? CategoryService.defaultPageSize;
    const page = params?.page ?? 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return categories.slice(start, end);
  }

  async patch(id: string, dto: PatchCategoryDto): Promise<Category> {
    const categories = await this.readFile();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Category not found.',
      });
    }

    categories[index] = { ...categories[index], ...dto };
    await this.writeFile(categories);
    return categories[index];
  }

  async delete(id: string): Promise<void> {
    const categories = await this.readFile();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Category not found.',
      });
    }
    categories.splice(index, 1);
    await this.writeFile(categories);
  }
}
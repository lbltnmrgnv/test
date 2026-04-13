import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PatchCategoryDto } from './dto/patch-category.dto';
import { Category } from './category.schema'; // Для Swagger
import { FindOneParams } from './utils/find-one-params';
import { IdParam } from './utils/id-param';
import { QueryParams } from './utils/query-params';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JsonCategory } from './category-json.model'; // JSON-модель

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  private mapToSwaggerCategory(json: JsonCategory): Category {
    return {
      _id: json.id,
      slug: json.slug,
      name: json.name,
      description: json.description ?? '',
      createdDate: new Date(json.createdDate),
      active: json.active,
    } as Category;
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Get category by id or slug',
    description: 'Legacy CRUD endpoint. Secondary priority for interview.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success response.', type: Category })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found.' })
  async findOne(@Param() { identifier }: FindOneParams): Promise<Category> {
    const jsonCategory = await this.categoryService.findOne(identifier);
    return this.mapToSwaggerCategory(jsonCategory);
  }

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Legacy CRUD endpoint with filters and pagination.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success response.', type: Category })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  async getAll(@Query() params: QueryParams): Promise<Category[]> {
    const jsonCategories = await this.categoryService.getAll(params);
    return jsonCategories.map(c => this.mapToSwaggerCategory(c));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create category',
    description: 'Legacy CRUD endpoint. Not the main interview flow.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success response.', type: Category })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  async create(@Body() data: CreateCategoryDto): Promise<Category> {
    const jsonCategory = await this.categoryService.create(data);
    return this.mapToSwaggerCategory(jsonCategory);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Patch category',
    description: 'Legacy CRUD endpoint.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success response.', type: Category })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found.' })
  async patch(
      @Param() { id }: IdParam,
      @Body() data: PatchCategoryDto,
  ): Promise<Category> {
    const jsonCategory = await this.categoryService.patch(id, data);
    return this.mapToSwaggerCategory(jsonCategory);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete category',
    description: 'Legacy CRUD endpoint.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Success response.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found.' })
  async delete(@Param() { id }: IdParam): Promise<void> {
    await this.categoryService.delete(id);
  }
}

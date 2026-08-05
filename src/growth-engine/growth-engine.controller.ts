import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { GrowthEngineService } from './growth-engine.service';

@Controller('growth-engine')
export class GrowthEngineController {
  constructor(private readonly growthEngineService: GrowthEngineService) {}

  @Get('trends')
  async getTrends(@Query('force') force?: string) {
    return this.growthEngineService.getDailyTrends(force === 'true');
  }

  @Post('ideas')
  @HttpCode(HttpStatus.OK)
  async getIdeas(@Body('trend') trend: string) {
    if (!trend) {
      return { error: 'Trend string is required.' };
    }
    return this.growthEngineService.generateIdeas(trend);
  }

  @Post('draft')
  @HttpCode(HttpStatus.OK)
  async generateDraft(
    @Body('title') title: string,
    @Body('category') category: string,
  ) {
    if (!title || !category) {
      return { error: 'Title and category are required.' };
    }
    return this.growthEngineService.generateDraft(title, category);
  }

  @Post('repurpose')
  @HttpCode(HttpStatus.OK)
  async repurposeDraft(@Body('content') content: string) {
    if (!content) {
      return { error: 'Content text is required.' };
    }
    return this.growthEngineService.repurposeDraft(content);
  }
}

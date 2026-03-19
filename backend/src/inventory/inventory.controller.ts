import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@ApiTags('Inventory (Estoque)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Cadastrar novo produto no estoque' })
  @Post('products')
  async createProduct(@Req() req, @Body() data: CreateProductDto) {
    return this.inventoryService.createProduct(req.user.salonId, data);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Obter painel de estatísticas de estoque (baixo estoque, valor)',
  })
  @Get('stats')
  async getProductStats(@Req() req) {
    return this.inventoryService.getProductStats(req.user.salonId);
  }

  @Roles('ADMIN', 'MANAGER', 'PROFESSIONAL')
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @Get('products')
  async getProducts(@Req() req) {
    return this.inventoryService.getProducts(req.user.salonId);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Detalhes do produto com histórico de movimentações',
  })
  @Get('products/:id')
  async getProduct(@Req() req, @Param('id') id: string) {
    return this.inventoryService.getProduct(req.user.salonId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Atualizar informações do produto' })
  @Patch('products/:id')
  async updateProduct(
    @Req() req,
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(req.user.salonId, id, data);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Excluir produto' })
  @Delete('products/:id')
  async deleteProduct(@Req() req, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.salonId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Registrar entrada ou saída manual de estoque' })
  @Post('products/:id/movement')
  async addStockMovement(
    @Req() req,
    @Param('id') id: string,
    @Body() data: StockMovementDto,
  ) {
    return this.inventoryService.addStockMovement(req.user.salonId, id, data);
  }
}

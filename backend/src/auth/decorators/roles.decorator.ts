import { SetMetadata } from '@nestjs/common';
import { VaiTro } from 'src/entities/nguoi_dung.entity';

export const Roles = (...roles: VaiTro[]) => SetMetadata('roles', roles);
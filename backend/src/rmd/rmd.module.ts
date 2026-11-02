import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RmdController } from './rmd.controller';
import { RmdService } from './rmd.service';
import { RmdProject } from './rmd.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RmdProject])],
  controllers: [RmdController],
  providers: [RmdService],
  exports: [RmdService],
})
export class RmdModule {}
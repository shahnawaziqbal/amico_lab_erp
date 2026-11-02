import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldOfficer } from './field-officers.entity';
import { FieldOfficersService } from './field-officers.service';
import { FieldOfficersController } from './field-officers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FieldOfficer])],
  controllers: [FieldOfficersController],
  providers: [FieldOfficersService],
  exports: [FieldOfficersService],
})
export class FieldOfficersModule {}
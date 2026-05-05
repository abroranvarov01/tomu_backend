import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateQuizDto, CreateQuizQuestionDto } from "./create-quiz.dto";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class UpdateQuizQuestionDto {
  @ApiProperty({ description: "Savol ID'si (mavjud savolni yangilash uchun)", required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ description: "Savol matni", required: false })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiProperty({ description: "Savol tartibi", required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: "Javob variantlari", required: false })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({ description: "To'g'ri javob indeksi", required: false })
  @IsOptional()
  @IsInt()
  correctOptionIndex?: number;
}

export class UpdateQuizDto {
  @ApiProperty({ description: "Test nomi", required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: "Test tavsifi", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Yangilangan savollar ro'yxati (to'liq qayta yoziladi)",
    type: [UpdateQuizQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuizQuestionDto)
  questions?: UpdateQuizQuestionDto[];
}

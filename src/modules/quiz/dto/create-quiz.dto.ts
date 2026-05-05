import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";

export class CreateQuizQuestionDto {
  @ApiProperty({ description: "Savol matni", example: "Arabchada 'Kitob' so'zi qanday yoziladi?" })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ description: "Savol tartibi", example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({
    description: "Javob variantlari",
    example: ["كتاب", "كلب", "قلم", "باب"],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: "To'g'ri javob indeksi (0 dan boshlanadi)", example: 0 })
  @IsInt()
  @Min(0)
  correctOptionIndex: number;
}

export class CreateQuizDto {
  @ApiProperty({ description: "Test nomi", example: "1-dars bo'yicha test" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Test tavsifi", example: "Alifbo darsidan so'ng test", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Dars ID'si", example: 1 })
  @IsInt()
  lessonId: number;

  @ApiProperty({
    description: "Savollar ro'yxati",
    type: [CreateQuizQuestionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}

import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  ArrayMinSize,
  ValidateNested,
  Min,
} from "class-validator";

export class SubmitAnswerDto {
  @ApiProperty({ description: "Savol ID'si", example: 1 })
  @IsInt()
  questionId: number;

  @ApiProperty({ description: "Tanlangan variant indeksi (0 dan boshlanadi)", example: 2 })
  @IsInt()
  @Min(0)
  selectedOptionIndex: number;
}

export class SubmitQuizDto {
  @ApiProperty({
    description: "Foydalanuvchi javoblari",
    type: [SubmitAnswerDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

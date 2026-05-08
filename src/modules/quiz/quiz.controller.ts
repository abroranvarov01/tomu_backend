import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Inject,
  Req,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Auth } from "src/common/decorator/auth.decorator";
import { RoleEnum } from "src/common/enums/enum";
import { ID } from "src/common/types/type";
import { ResData } from "src/lib/resData";
import { Quiz } from "./entities/quiz.entity";
import { QuizAttempt } from "./entities/quiz-attempt.entity";
import { IQuizService } from "./interfaces/quiz.service";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { SubmitQuizDto } from "./dto/submit-quiz.dto";
import { QuizService } from "./quiz.service";

// JWT dan foydalanuvchi ma'lumotlarini olish uchun interface
interface RequestWithUser extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags("quiz")
@Controller("quiz")
export class QuizController {
  constructor(
    @Inject("IQuizService")
    private readonly quizService: QuizService,
  ) {}

  // ==================== ADMIN API ====================

  @ApiOperation({ summary: "Yangi test yaratish (Admin)" })
  @Auth(RoleEnum.ADMIN, RoleEnum.DIRECTOR)
  @Post()
  async create(@Body() createQuizDto: CreateQuizDto): Promise<ResData<Quiz>> {
    return await this.quizService.create(createQuizDto);
  }

  @ApiOperation({ summary: "Barcha testlarni olish (Admin)" })
  @Auth(RoleEnum.ADMIN, RoleEnum.DIRECTOR)
  @Get()
  async findAll(): Promise<ResData<Quiz[]>> {
    return await this.quizService.findAll();
  }

  @ApiOperation({ summary: "Test ID bo'yicha olish (Admin - to'g'ri javoblar bilan)" })
  @Auth(RoleEnum.ADMIN, RoleEnum.DIRECTOR)
  @Get("admin/:id")
  async findOneAdmin(
    @Param("id", ParseIntPipe) id: ID,
  ): Promise<ResData<Quiz>> {
    return await this.quizService.findOneById(id);
  }

  @ApiOperation({ summary: "Testni yangilash (Admin)" })
  @Auth(RoleEnum.ADMIN, RoleEnum.DIRECTOR)
  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: ID,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<ResData<Quiz>> {
    return await this.quizService.update(id, updateQuizDto);
  }

  @ApiOperation({ summary: "Testni o'chirish (Admin)" })
  @Auth(RoleEnum.ADMIN, RoleEnum.DIRECTOR)
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: ID): Promise<ResData<Quiz>> {
    return await this.quizService.delete(id);
  }

  // ==================== STUDENT API ====================

  @ApiOperation({ summary: "Barcha testlarni Course > Block > Lesson > Quiz formatida olish" })
  @Auth(RoleEnum.DIRECTOR, RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  @Get("grouped")
  async getGroupedQuizzes(): Promise<ResData<any>> {
    return await this.quizService.getGroupedQuizzes();
  }

  @ApiOperation({ summary: "Dars ID bo'yicha testni olish (Student - javoblar yashirin)" })
  @Auth(RoleEnum.DIRECTOR, RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  @Get("by-lesson/:lessonId")
  async findByLessonId(
    @Param("lessonId", ParseIntPipe) lessonId: ID,
    @Req() req: RequestWithUser,
  ): Promise<ResData<any>> {
    const userId = req.user["id"];
    return await this.quizService.findByLessonIdForStudent(lessonId, userId);
  }

  @ApiOperation({ summary: "Testga javob berish" })
  @Auth(RoleEnum.DIRECTOR, RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  @Post(":quizId/submit")
  async submitQuiz(
    @Param("quizId", ParseIntPipe) quizId: ID,
    @Req() req: RequestWithUser,
    @Body() submitQuizDto: SubmitQuizDto,
  ): Promise<ResData<QuizAttempt>> {
    const userId = req.user["id"];
    return await this.quizService.submitQuiz(quizId, userId, submitQuizDto);
  }

  @ApiOperation({ summary: "Foydalanuvchining test statistikasi" })
  @Auth(RoleEnum.DIRECTOR, RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  @Get("my-stats")
  async getMyStats(@Req() req: RequestWithUser): Promise<ResData<any>> {
    const userId = req.user["id"];
    return await this.quizService.getUserStats(userId);
  }

  @ApiOperation({ summary: "Berilgan test bo'yicha foydalanuvchi natijalari" })
  @Auth(RoleEnum.DIRECTOR, RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.TEACHER)
  @Get(":quizId/my-attempts")
  async getMyAttempts(
    @Param("quizId", ParseIntPipe) quizId: ID,
    @Req() req: RequestWithUser,
  ): Promise<ResData<QuizAttempt[]>> {
    const userId = req.user["id"];
    return await this.quizService.getAttemptsByQuizAndUser(quizId, userId);
  }
}

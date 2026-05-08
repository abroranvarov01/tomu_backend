import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Quiz } from "./entities/quiz.entity";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { QuizAttempt } from "./entities/quiz-attempt.entity";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./quiz.repository";
import { SharedModule } from "../shared/shared.module";
import { LessonModule } from "../lesson/lesson.module";
import { LessonProgressModule } from "../lesson-progress/lesson-progress.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizAttempt]),
    SharedModule,
    LessonModule,
    LessonProgressModule,
  ],
  controllers: [QuizController],
  providers: [
    { provide: "IQuizService", useClass: QuizService },
    { provide: "IQuizRepository", useClass: QuizRepository },
  ],
  exports: [
    { provide: "IQuizService", useClass: QuizService },
    { provide: "IQuizRepository", useClass: QuizRepository },
  ],
})
export class QuizModule {}

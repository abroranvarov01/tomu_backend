import { ID } from "src/common/types/type";
import { ResData } from "src/lib/resData";
import { Quiz } from "../entities/quiz.entity";
import { QuizAttempt } from "../entities/quiz-attempt.entity";
import { CreateQuizDto } from "../dto/create-quiz.dto";
import { UpdateQuizDto } from "../dto/update-quiz.dto";
import { SubmitQuizDto } from "../dto/submit-quiz.dto";

export interface IQuizService {
  create(dto: CreateQuizDto): Promise<ResData<Quiz>>;
  findAll(): Promise<ResData<Quiz[]>>;
  findOneById(id: ID): Promise<ResData<Quiz>>;
  findByLessonId(lessonId: ID): Promise<ResData<Quiz>>;
  findByLessonIdForStudent(lessonId: ID, userId: ID): Promise<ResData<any>>;
  findBySectionIdForStudent(sectionId: ID, userId: ID): Promise<ResData<any>>;
  getGroupedQuizzes(): Promise<ResData<any>>;
  update(id: ID, dto: UpdateQuizDto): Promise<ResData<Quiz>>;
  delete(id: ID): Promise<ResData<Quiz>>;
  submitQuiz(quizId: ID, userId: ID, dto: SubmitQuizDto): Promise<ResData<QuizAttempt>>;
  getUserStats(userId: ID): Promise<ResData<any>>;
  getAttemptsByQuizAndUser(quizId: ID, userId: ID): Promise<ResData<QuizAttempt[]>>;
}

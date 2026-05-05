import { ID } from "src/common/types/type";
import { Quiz } from "../entities/quiz.entity";

export interface IQuizRepository {
  create(entity: Quiz): Promise<Quiz>;
  findAll(): Promise<Quiz[]>;
  findById(id: ID): Promise<Quiz | null>;
  findByLessonId(lessonId: ID): Promise<Quiz | null>;
  update(entity: Quiz): Promise<Quiz>;
  delete(entity: Quiz): Promise<Quiz>;
}

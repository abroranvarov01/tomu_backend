import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Quiz } from "./entities/quiz.entity";
import { IQuizRepository } from "./interfaces/quiz.repository";
import { ID } from "src/common/types/type";

@Injectable()
export class QuizRepository implements IQuizRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
  ) {}

  async create(entity: Quiz): Promise<Quiz> {
    const newQuiz = this.quizRepo.create(entity);
    return await this.quizRepo.save(newQuiz);
  }

  async findAll(): Promise<Quiz[]> {
    return await this.quizRepo.find({
      relations: ["questions", "lesson"],
      order: { createdAt: "DESC" },
    });
  }

  async findAllWithRelations(): Promise<Quiz[]> {
    return await this.quizRepo.find({
      relations: ["lesson", "lesson.block", "lesson.course", "questions"],
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: ID): Promise<Quiz | null> {
    return await this.quizRepo.findOne({
      where: { id },
      relations: ["questions", "lesson"],
    });
  }

  async findByLessonId(lessonId: ID): Promise<Quiz | null> {
    return await this.quizRepo.findOne({
      where: { lessonId },
      relations: ["questions"],
    });
  }

  async findBySectionId(sectionId: ID): Promise<Quiz[]> {
    return await this.quizRepo.find({
      where: { sectionId },
      relations: ["questions"],
      order: { createdAt: "ASC" },
    });
  }

  async update(entity: Quiz): Promise<Quiz> {
    return await this.quizRepo.save(entity);
  }

  async delete(entity: Quiz): Promise<Quiz> {
    return await this.quizRepo.remove(entity);
  }
}

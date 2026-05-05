import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IQuizService } from "./interfaces/quiz.service";
import { IQuizRepository } from "./interfaces/quiz.repository";
import { Quiz } from "./entities/quiz.entity";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { QuizAttempt } from "./entities/quiz-attempt.entity";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { SubmitQuizDto } from "./dto/submit-quiz.dto";
import { ResData } from "src/lib/resData";
import { ID } from "src/common/types/type";
import {
  QuizNotFoundException,
  QuizAlreadyExistsForLessonException,
} from "./exception/quiz.exception";

@Injectable()
export class QuizService implements IQuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @Inject("IQuizRepository")
    private readonly quizRepository: IQuizRepository,

    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,

    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
  ) {}

  /**
   * Yangi test yaratish (Admin).
   * Har bir dars uchun faqat bitta test bo'lishi mumkin.
   */
  async create(dto: CreateQuizDto): Promise<ResData<Quiz>> {
    // Dars uchun test mavjudligini tekshirish
    const existing = await this.quizRepository.findByLessonId(dto.lessonId);
    if (existing) {
      throw new QuizAlreadyExistsForLessonException();
    }

    const quiz = new Quiz();
    quiz.title = dto.title;
    quiz.description = dto.description || null;
    quiz.lessonId = dto.lessonId;

    // Savollarni yaratish
    quiz.questions = dto.questions.map((q) => {
      const question = new QuizQuestion();
      question.questionText = q.questionText;
      question.order = q.order;
      question.options = q.options;
      question.correctOptionIndex = q.correctOptionIndex;
      return question;
    });

    const savedQuiz = await this.quizRepository.create(quiz);
    this.logger.log(`Test yaratildi: ID=${savedQuiz.id}, lessonId=${dto.lessonId}`);

    return new ResData<Quiz>("Test muvaffaqiyatli yaratildi", 201, savedQuiz);
  }

  /**
   * Barcha testlarni olish.
   */
  async findAll(): Promise<ResData<Quiz[]>> {
    const quizzes = await this.quizRepository.findAll();
    return new ResData<Quiz[]>("ok", 200, quizzes);
  }

  /**
   * Test ID bo'yicha topish.
   */
  async findOneById(id: ID): Promise<ResData<Quiz>> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new QuizNotFoundException();
    }
    return new ResData<Quiz>("ok", 200, quiz);
  }

  /**
   * Dars ID bo'yicha testni olish.
   * Savollardan to'g'ri javob indeksi olib tashlanadi (student uchun).
   */
  async findByLessonId(lessonId: ID): Promise<ResData<Quiz>> {
    const quiz = await this.quizRepository.findByLessonId(lessonId);
    if (!quiz) {
      throw new QuizNotFoundException();
    }
    return new ResData<Quiz>("ok", 200, quiz);
  }

  /**
   * Dars ID bo'yicha testni olish (student uchun — to'g'ri javoblar yashiriladi).
   */
  async findByLessonIdForStudent(lessonId: ID): Promise<ResData<any>> {
    const quiz = await this.quizRepository.findByLessonId(lessonId);
    if (!quiz) {
      throw new QuizNotFoundException();
    }

    // To'g'ri javob indeksini yashirish
    const sanitizedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      lessonId: quiz.lessonId,
      questions: quiz.questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          questionText: q.questionText,
          order: q.order,
          options: q.options,
          // correctOptionIndex yashirildi
        })),
      createdAt: quiz.createdAt,
    };

    return new ResData("ok", 200, sanitizedQuiz);
  }

  /**
   * Testni yangilash (Admin).
   */
  async update(id: ID, dto: UpdateQuizDto): Promise<ResData<Quiz>> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new QuizNotFoundException();
    }

    if (dto.title !== undefined) quiz.title = dto.title;
    if (dto.description !== undefined) quiz.description = dto.description;

    // Agar savollar berilgan bo'lsa, eski savollarni o'chirib yangisini qo'shish
    if (dto.questions !== undefined) {
      // Eski savollarni o'chirish
      await this.questionRepo.delete({ quizId: id });

      // Yangi savollarni yaratish
      quiz.questions = dto.questions.map((q) => {
        const question = new QuizQuestion();
        question.questionText = q.questionText;
        question.order = q.order;
        question.options = q.options;
        question.correctOptionIndex = q.correctOptionIndex;
        question.quizId = id;
        return question;
      });
    }

    const updatedQuiz = await this.quizRepository.update(quiz);
    this.logger.log(`Test yangilandi: ID=${id}`);

    return new ResData<Quiz>("Test muvaffaqiyatli yangilandi", 200, updatedQuiz);
  }

  /**
   * Testni o'chirish (Admin).
   */
  async delete(id: ID): Promise<ResData<Quiz>> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new QuizNotFoundException();
    }

    const deletedQuiz = await this.quizRepository.delete(quiz);
    this.logger.log(`Test o'chirildi: ID=${id}`);

    return new ResData<Quiz>("Test muvaffaqiyatli o'chirildi", 200, deletedQuiz);
  }

  /**
   * Testga javob berish (Student).
   * Javoblarni tekshiradi va natijani saqlaydi.
   */
  async submitQuiz(
    quizId: ID,
    userId: ID,
    dto: SubmitQuizDto,
  ): Promise<ResData<QuizAttempt>> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new QuizNotFoundException();
    }

    // Savollar map (tez qidirish uchun)
    const questionsMap = new Map(
      quiz.questions.map((q) => [q.id, q]),
    );

    let correctCount = 0;
    const processedAnswers: {
      questionId: number;
      selectedOptionIndex: number;
      isCorrect: boolean;
    }[] = [];

    for (const answer of dto.answers) {
      const question = questionsMap.get(answer.questionId);
      if (!question) continue; // Noma'lum savol — o'tkazib yuboriladi

      const isCorrect = question.correctOptionIndex === answer.selectedOptionIndex;
      if (isCorrect) correctCount++;

      processedAnswers.push({
        questionId: answer.questionId,
        selectedOptionIndex: answer.selectedOptionIndex,
        isCorrect,
      });
    }

    const totalCount = quiz.questions.length;
    const scorePercent = totalCount > 0
      ? Math.round((correctCount / totalCount) * 100)
      : 0;

    // QuizAttempt saqlash
    const attempt = this.attemptRepo.create({
      userId,
      quizId,
      correctCount,
      totalCount,
      scorePercent,
      answers: processedAnswers,
    });

    const savedAttempt = await this.attemptRepo.save(attempt);

    this.logger.log(
      `Test topshirildi: userId=${userId}, quizId=${quizId}, score=${scorePercent}% (${correctCount}/${totalCount})`,
    );

    return new ResData<QuizAttempt>(
      "Test natijalari saqlandi",
      201,
      savedAttempt,
    );
  }

  /**
   * Foydalanuvchining barcha test statistikasini olish.
   */
  async getUserStats(userId: ID): Promise<ResData<any>> {
    const attempts = await this.attemptRepo.find({
      where: { userId },
      relations: ["quiz", "quiz.lesson"],
      order: { createdAt: "DESC" },
    });

    const totalAttempts = attempts.length;
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctCount, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalCount, 0);
    const averageScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / totalAttempts)
      : 0;

    // Test bo'yicha guruhlangan natijalar
    const quizResults = attempts.map((attempt) => ({
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || null,
      lessonTitle: attempt.quiz?.lesson?.title || null,
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      scorePercent: attempt.scorePercent,
      answers: attempt.answers,
      completedAt: attempt.createdAt,
    }));

    const stats = {
      totalAttempts,
      totalCorrect,
      totalQuestions,
      averageScore,
      results: quizResults,
    };

    return new ResData("Foydalanuvchi test statistikasi", 200, stats);
  }

  /**
   * Berilgan test bo'yicha foydalanuvchi urinishlarini olish.
   */
  async getAttemptsByQuizAndUser(
    quizId: ID,
    userId: ID,
  ): Promise<ResData<QuizAttempt[]>> {
    const attempts = await this.attemptRepo.find({
      where: { quizId, userId },
      order: { createdAt: "DESC" },
    });

    return new ResData<QuizAttempt[]>(
      "Test natijalari",
      200,
      attempts,
    );
  }

  /**
   * Dars uchun test mavjudligini tekshirish (boolean).
   */
  async hasQuizForLesson(lessonId: ID): Promise<boolean> {
    const quiz = await this.quizRepository.findByLessonId(lessonId);
    return !!quiz;
  }
}

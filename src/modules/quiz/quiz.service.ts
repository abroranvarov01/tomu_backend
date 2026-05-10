import { Inject, Injectable, Logger, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IQuizService } from "./interfaces/quiz.service";
import { IQuizRepository } from "./interfaces/quiz.repository";
import { Quiz } from "./entities/quiz.entity";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { QuizAttempt } from "./entities/quiz-attempt.entity";
import { ILessonRepository } from "../lesson/interfaces/lesson.repository";
import { ILessonProgressRepository } from "../lesson-progress/interfaces/lesson-progress.repository";
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

    @Inject("ILessonRepository")
    private readonly lessonRepository: ILessonRepository,

    @Inject("ILessonProgressRepository")
    private readonly lessonProgressRepository: ILessonProgressRepository,

    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,

    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
  ) {}

  /**
   * Yangi test yaratish (Admin).
   * lessonId yoki sectionId dan kamida biri bo'lishi kerak.
   * Har bir dars uchun faqat bitta test bo'lishi mumkin.
   */
  async create(dto: CreateQuizDto): Promise<ResData<Quiz>> {
    // Kamida biri bo'lishi shart
    if (!dto.lessonId && !dto.sectionId) {
      throw new BadRequestException("lessonId yoki sectionId dan kamida biri bo'lishi shart");
    }

    const quiz = new Quiz();
    quiz.title = dto.title;
    quiz.description = dto.description || null;
    quiz.lessonId = dto.lessonId ?? null;
    quiz.sectionId = dto.sectionId ?? null;

    // Dars ID berilgan bo'lsa, dars mavjudligini tekshirish
    if (dto.lessonId) {
      const existing = await this.quizRepository.findByLessonId(dto.lessonId);
      if (existing) {
        throw new QuizAlreadyExistsForLessonException();
      }

      const lesson = await this.lessonRepository.findById(dto.lessonId);
      if (!lesson) {
        throw new BadRequestException("Bunday dars mavjud emas");
      }
    }

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
    this.logger.log(
      `Test yaratildi: ID=${savedQuiz.id}, lessonId=${dto.lessonId ?? "null"}, sectionId=${dto.sectionId ?? "null"}`,
    );

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
   * Dars videosi ko'rilmagan bo'lsa, testga ruxsat berilmaydi.
   */
  async findByLessonIdForStudent(lessonId: ID, userId: ID): Promise<ResData<any>> {
    // Dars videosi ko'rilganligini tekshirish
    const progress = await this.lessonProgressRepository.findOneByUserAndLesson(userId, lessonId);
    if (!progress || !progress.isWatched) {
      throw new ForbiddenException(
        "Video darsni to'liq ko'rmasdan turib testni ishlash mumkin emas",
      );
    }

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
   * Section (bo'lim) ID bo'yicha barcha testlarni olish (student uchun).
   * To'g'ri javoblar yashiriladi.
   * Bu funksiya student bo'limga tegishli barcha testlarni ketma-ket yechishi uchun.
   */
  async findBySectionIdForStudent(sectionId: ID, userId: ID): Promise<ResData<any>> {
    const quizzes = await this.quizRepository.findBySectionId(sectionId);

    if (!quizzes || quizzes.length === 0) {
      throw new QuizNotFoundException();
    }

    // Har bir testdan to'g'ri javob indeksini yashirish
    const sanitizedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      sectionId: quiz.sectionId,
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
    }));

    return new ResData("ok", 200, {
      sectionId,
      totalQuizzes: sanitizedQuizzes.length,
      quizzes: sanitizedQuizzes,
    });
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

  /**
   * Barcha testlarni Course > Block > Lesson > Quiz formatida guruhlash.
   */
  async getGroupedQuizzes(): Promise<ResData<any>> {
    const quizzes = await this.quizRepository.findAllWithRelations();

    // Course bo'yicha guruhlash
    const courseMap = new Map<number, any>();

    for (const quiz of quizzes) {
      const lesson = quiz.lesson;
      if (!lesson) continue;

      const block = (lesson as any).block;
      const course = (lesson as any).course;
      if (!course || !block) continue;

      // Course yaratish yoki topish
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          courseId: course.id,
          courseTitle: course.title || null,
          blocks: new Map<number, any>(),
        });
      }
      const courseEntry = courseMap.get(course.id);

      // Block yaratish yoki topish
      if (!courseEntry.blocks.has(block.id)) {
        courseEntry.blocks.set(block.id, {
          blockId: block.id,
          blockTitle: block.title || null,
          blockOrder: block.order || null,
          lessons: new Map<number, any>(),
        });
      }
      const blockEntry = courseEntry.blocks.get(block.id);

      // Lesson yaratish yoki topish
      if (!blockEntry.lessons.has(lesson.id)) {
        blockEntry.lessons.set(lesson.id, {
          lessonId: lesson.id,
          lessonTitle: lesson.title || null,
          lessonOrder: lesson.order || null,
          quizzes: [],
        });
      }
      const lessonEntry = blockEntry.lessons.get(lesson.id);

      // Quiz qo'shish
      lessonEntry.quizzes.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        description: quiz.description,
        questionCount: quiz.questions?.length || 0,
        createdAt: quiz.createdAt,
      });
    }

    // Map larni array ga aylantirish
    const result = Array.from(courseMap.values()).map((course) => ({
      ...course,
      blocks: Array.from(course.blocks.values())
        .map((block: any) => ({
          ...block,
          lessons: Array.from(block.lessons.values())
            .map((lesson: any) => ({
              ...lesson,
            }))
            .sort((a: any, b: any) => (a.lessonOrder || 0) - (b.lessonOrder || 0)),
        }))
        .sort((a: any, b: any) => (a.blockOrder || 0) - (b.blockOrder || 0)),
    }));

    return new ResData("Testlar guruhlangan holda", 200, result);
  }
}

import { BaseEntity } from "src/common/database/baseEntity";
import { Lesson } from "src/modules/lesson/entities/lesson.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { QuizQuestion } from "./quiz-question.entity";
import { QuizAttempt } from "./quiz-attempt.entity";

@Entity("quizzes")
export class Quiz extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * Darsga bog'liq test (ixtiyoriy).
   * lessonId yoki sectionId dan biri mavjud bo'lishi kerak.
   */
  @Column({ type: "int", name: "lesson_id", nullable: true })
  lessonId: number | null;

  @ManyToOne(() => Lesson, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "lesson_id" })
  lesson: Lesson | null;

  /**
   * Bo'lim (block/section) ga bog'liq test (ixtiyoriy).
   * Lesson bo'lmagan holda section uchun test yaratish mumkin.
   */
  @Column({ type: "int", name: "section_id", nullable: true })
  sectionId: number | null;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, {
    cascade: true,
    eager: false,
  })
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}

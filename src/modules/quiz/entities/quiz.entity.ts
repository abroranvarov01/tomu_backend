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

  @Column({ type: "int", name: "lesson_id" })
  lessonId: number;

  @ManyToOne(() => Lesson, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lesson_id" })
  lesson: Lesson;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, {
    cascade: true,
    eager: false,
  })
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}

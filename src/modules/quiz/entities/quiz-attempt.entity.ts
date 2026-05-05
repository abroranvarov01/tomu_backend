import { BaseEntity } from "src/common/database/baseEntity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Quiz } from "./quiz.entity";

@Entity("quiz_attempts")
export class QuizAttempt extends BaseEntity {
  @Column({ type: "int", name: "user_id" })
  userId: number;

  @Column({ type: "int", name: "quiz_id" })
  quizId: number;

  /**
   * To'g'ri javoblar soni.
   */
  @Column({ type: "int", name: "correct_count" })
  correctCount: number;

  /**
   * Jami savollar soni.
   */
  @Column({ type: "int", name: "total_count" })
  totalCount: number;

  /**
   * Foiz natijasi (0–100).
   */
  @Column({ type: "int", name: "score_percent" })
  scorePercent: number;

  /**
   * Foydalanuvchi javoblari (JSON formatda).
   * Har bir element: { questionId, selectedOptionIndex, isCorrect }
   */
  @Column({ type: "jsonb" })
  answers: { questionId: number; selectedOptionIndex: number; isCorrect: boolean }[];

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;
}

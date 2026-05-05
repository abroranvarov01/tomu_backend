import { BaseEntity } from "src/common/database/baseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Quiz } from "./quiz.entity";

@Entity("quiz_questions")
export class QuizQuestion extends BaseEntity {
  @Column({ type: "text", name: "question_text" })
  questionText: string;

  @Column({ type: "int" })
  order: number;

  /**
   * Variantlar ro'yxati (JSON massiv sifatida saqlanadi).
   * Masalan: ["Javob A", "Javob B", "Javob C", "Javob D"]
   */
  @Column({ type: "jsonb" })
  options: string[];

  /**
   * To'g'ri javob indeksi (0 dan boshlanadi).
   * Masalan: options = ["A", "B", "C", "D"], correctOptionIndex = 2 degani "C" to'g'ri javob.
   */
  @Column({ type: "int", name: "correct_option_index" })
  correctOptionIndex: number;

  @Column({ type: "int", name: "quiz_id" })
  quizId: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;
}

import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: quizzes jadvaliga section_id ustunini qo'shish
 * va lesson_id ustunini nullable qilish.
 *
 * Bu o'zgarish test (quiz) ni faqat darsga emas,
 * bo'lim (section/block) ga ham bog'lash imkonini beradi.
 */
export class AddSectionIdToQuizzes1746800000000 implements MigrationInterface {
  name = "AddSectionIdToQuizzes1746800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. lesson_id ustunini nullable qilish
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      ALTER COLUMN "lesson_id" DROP NOT NULL
    `);

    // 2. section_id ustunini qo'shish (nullable)
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      ADD COLUMN IF NOT EXISTS "section_id" integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // section_id ustunini o'chirish
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      DROP COLUMN IF EXISTS "section_id"
    `);

    // lesson_id ustunini yana NOT NULL qilish
    // (Agar NULL qiymatlar mavjud bo'lsa, avval ularni tozalash kerak)
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      ALTER COLUMN "lesson_id" SET NOT NULL
    `);
  }
}

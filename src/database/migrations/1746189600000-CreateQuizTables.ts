import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateQuizTables1746189600000 implements MigrationInterface {
  name = "CreateQuizTables1746189600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. quizzes jadvali
    await queryRunner.createTable(
      new Table({
        name: "quizzes",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "lesson_id",
            type: "int",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "last_update_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "quizzes",
      new TableForeignKey({
        columnNames: ["lesson_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "lessons",
        onDelete: "CASCADE",
      }),
    );

    // 2. quiz_questions jadvali
    await queryRunner.createTable(
      new Table({
        name: "quiz_questions",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "question_text",
            type: "text",
          },
          {
            name: "order",
            type: "int",
          },
          {
            name: "options",
            type: "jsonb",
          },
          {
            name: "correct_option_index",
            type: "int",
          },
          {
            name: "quiz_id",
            type: "int",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "last_update_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "quiz_questions",
      new TableForeignKey({
        columnNames: ["quiz_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "quizzes",
        onDelete: "CASCADE",
      }),
    );

    // 3. quiz_attempts jadvali
    await queryRunner.createTable(
      new Table({
        name: "quiz_attempts",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "user_id",
            type: "int",
          },
          {
            name: "quiz_id",
            type: "int",
          },
          {
            name: "correct_count",
            type: "int",
          },
          {
            name: "total_count",
            type: "int",
          },
          {
            name: "score_percent",
            type: "int",
          },
          {
            name: "answers",
            type: "jsonb",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "last_update_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "quiz_attempts",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "quiz_attempts",
      new TableForeignKey({
        columnNames: ["quiz_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "quizzes",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign keylarni oldin o'chirish
    const attemptsTable = await queryRunner.getTable("quiz_attempts");
    if (attemptsTable) {
      for (const fk of attemptsTable.foreignKeys) {
        await queryRunner.dropForeignKey("quiz_attempts", fk);
      }
    }

    const questionsTable = await queryRunner.getTable("quiz_questions");
    if (questionsTable) {
      for (const fk of questionsTable.foreignKeys) {
        await queryRunner.dropForeignKey("quiz_questions", fk);
      }
    }

    const quizzesTable = await queryRunner.getTable("quizzes");
    if (quizzesTable) {
      for (const fk of quizzesTable.foreignKeys) {
        await queryRunner.dropForeignKey("quizzes", fk);
      }
    }

    await queryRunner.dropTable("quiz_attempts", true);
    await queryRunner.dropTable("quiz_questions", true);
    await queryRunner.dropTable("quizzes", true);
  }
}

import { HttpException, HttpStatus } from "@nestjs/common";

export class QuizNotFoundException extends HttpException {
  constructor() {
    super("Test topilmadi", HttpStatus.NOT_FOUND);
  }
}

export class QuizAlreadyExistsForLessonException extends HttpException {
  constructor() {
    super("Bu dars uchun test allaqachon mavjud", HttpStatus.CONFLICT);
  }
}

export class QuizQuestionNotFoundException extends HttpException {
  constructor() {
    super("Savol topilmadi", HttpStatus.NOT_FOUND);
  }
}

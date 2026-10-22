import { NextFunction, Request, Response } from 'express';
import type { LessonLanguage } from '../models/Lesson';

/**
 * Pins the course language for a route group. The lesson controller reads
 * `res.locals.language` to scope every query, so the English (`/api/lessons`)
 * and Urdu (`/api/urdu-lessons`) courses stay completely independent even
 * though they share the same controller and models.
 */
export function pinLanguage(language: LessonLanguage) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.locals['language'] = language;
    next();
  };
}

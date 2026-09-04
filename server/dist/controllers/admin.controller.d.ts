import { Request, Response } from 'express';
export declare const testEmail: (req: Request, res: Response) => Promise<void>;
export declare const moveLesson: (req: Request, res: Response) => Promise<void>;
export declare const moveExercise: (req: Request, res: Response) => Promise<void>;
export declare function getAdminStats(_req: Request, res: Response): Promise<void>;
export declare function listUsers(req: Request, res: Response): Promise<void>;
export declare function getUser(req: Request, res: Response): Promise<void>;
export declare function setUserRole(req: Request, res: Response): Promise<void>;
export declare function listLessons(_req: Request, res: Response): Promise<void>;
export declare function createLesson(req: Request, res: Response): Promise<void>;
export declare function updateLesson(req: Request, res: Response): Promise<void>;
export declare function deleteLesson(req: Request, res: Response): Promise<void>;
export declare function reorderLessons(req: Request, res: Response): Promise<void>;
export declare function listExercises(req: Request, res: Response): Promise<void>;
export declare function createExercise(req: Request, res: Response): Promise<void>;
export declare function updateExercise(req: Request, res: Response): Promise<void>;
export declare function deleteExercise(req: Request, res: Response): Promise<void>;
export declare function reorderExercises(req: Request, res: Response): Promise<void>;
export declare function listAchievements(_req: Request, res: Response): Promise<void>;
export declare function createAchievement(req: Request, res: Response): Promise<void>;
export declare function updateAchievement(req: Request, res: Response): Promise<void>;
export declare function deleteAchievement(req: Request, res: Response): Promise<void>;
export declare const adminTestParagraphs: {
    list: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export declare const adminPracticeParagraphs: {
    list: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export declare const adminWords: {
    list: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export declare const adminSentences: {
    list: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    remove: (req: Request, res: Response) => Promise<void>;
};
export declare function getSettings(_req: Request, res: Response): Promise<void>;
export declare function updateSettings(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map
import { Types } from 'mongoose';
import { CertificateParagraphDifficulty } from '../models/CertificateParagraph';
import { IUser } from '../models/User';
export declare const CERT_DIFFICULTIES: CertificateParagraphDifficulty[];
/** How many recent paragraphs are kept per user (sliding window). */
export declare const HISTORY_LIMIT = 60;
export interface SelectedParagraph {
    _id: Types.ObjectId;
    content: string;
    difficulty: CertificateParagraphDifficulty;
}
interface SelectOptions {
    user?: IUser | null;
    difficulty: CertificateParagraphDifficulty;
    /** Extra ids the caller asks to skip (guests use their localStorage history). */
    exclude?: string[];
}
/**
 * Pick the next certificate-test paragraph for a difficulty.
 *
 * Rules (from the cert-content spec):
 *  1. Only active paragraphs are eligible.
 *  2. Exclude the user's recent history (server-side for signed-in users) and
 *     the caller's explicit `exclude` list (guests keep client-side history).
 *  3. Random pick from the remaining pool — never Math.random() over everything.
 *  4. When the pool is exhausted, reset the cycle but keep the most recently
 *     used paragraph excluded so the same text never appears twice in a row.
 *  5. Signed-in users persist their used ids (sliding window capped).
 */
export declare function selectCertificateParagraph(options: SelectOptions): Promise<SelectedParagraph | null>;
/** Resolve an optional `exclude=a,b,c` query into a clean id list. */
export declare function parseExcludeQuery(raw: unknown): string[];
export {};
//# sourceMappingURL=certificateParagraph.service.d.ts.map
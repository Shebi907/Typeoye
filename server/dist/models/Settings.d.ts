import mongoose, { Document } from 'mongoose';
export interface ISettings extends Document {
    userId: mongoose.Types.ObjectId;
    theme: 'light' | 'dark' | 'system';
    font: 'jetbrains' | 'fira' | 'cascadia';
    fontSize: number;
    soundEnabled: boolean;
    caretStyle: 'bar' | 'block' | 'underline';
    testDuration: 60 | 120 | 300 | 600 | 900;
    wordCount: number;
    includeNumbers: boolean;
    includePunctuation: boolean;
}
declare const _default: mongoose.Model<ISettings, {}, {}, {}, mongoose.Document<unknown, {}, ISettings, {}, {}> & ISettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Settings.d.ts.map
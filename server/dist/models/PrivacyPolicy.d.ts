import mongoose, { Document } from 'mongoose';
export interface IPrivacyPolicySection {
    _id?: mongoose.Types.ObjectId;
    title: string;
    content: string;
    order: number;
}
export interface IPrivacyPolicy extends Document {
    introduction: string;
    sections: IPrivacyPolicySection[];
    lastUpdated: Date;
}
declare const _default: mongoose.Model<IPrivacyPolicy, {}, {}, {}, mongoose.Document<unknown, {}, IPrivacyPolicy, {}, {}> & IPrivacyPolicy & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PrivacyPolicy.d.ts.map
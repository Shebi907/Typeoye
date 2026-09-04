import mongoose, { Document } from 'mongoose';
export interface IPlatformSetting extends Document {
    key: string;
    value: unknown;
    label?: string;
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IPlatformSetting, {}, {}, {}, mongoose.Document<unknown, {}, IPlatformSetting, {}, {}> & IPlatformSetting & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PlatformSetting.d.ts.map
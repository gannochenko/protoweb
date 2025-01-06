/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.19.4
 * source: google/rpc/status/status.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as dependency_1 from "./../../protobuf/any";
import * as pb_1 from "google-protobuf";
export namespace google.rpc {
    export class Status extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            code?: number;
            message?: string;
            details?: dependency_1.google.protobuf.Any[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [3], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("code" in data && data.code != undefined) {
                    this.code = data.code;
                }
                if ("message" in data && data.message != undefined) {
                    this.message = data.message;
                }
                if ("details" in data && data.details != undefined) {
                    this.details = data.details;
                }
            }
        }
        get code() {
            return pb_1.Message.getFieldWithDefault(this, 1, 0) as number;
        }
        set code(value: number) {
            pb_1.Message.setField(this, 1, value);
        }
        get message() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set message(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get details() {
            return pb_1.Message.getRepeatedWrapperField(this, dependency_1.google.protobuf.Any, 3) as dependency_1.google.protobuf.Any[];
        }
        set details(value: dependency_1.google.protobuf.Any[]) {
            pb_1.Message.setRepeatedWrapperField(this, 3, value);
        }
        static fromObject(data: {
            code?: number;
            message?: string;
            details?: ReturnType<typeof dependency_1.google.protobuf.Any.prototype.toObject>[];
        }): Status {
            const message = new Status({});
            if (data.code != null) {
                message.code = data.code;
            }
            if (data.message != null) {
                message.message = data.message;
            }
            if (data.details != null) {
                message.details = data.details.map(item => dependency_1.google.protobuf.Any.fromObject(item));
            }
            return message;
        }
        toObject() {
            const data: {
                code?: number;
                message?: string;
                details?: ReturnType<typeof dependency_1.google.protobuf.Any.prototype.toObject>[];
            } = {};
            if (this.code != null) {
                data.code = this.code;
            }
            if (this.message != null) {
                data.message = this.message;
            }
            if (this.details != null) {
                data.details = this.details.map((item: dependency_1.google.protobuf.Any) => item.toObject());
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.code != 0)
                writer.writeInt32(1, this.code);
            if (this.message.length)
                writer.writeString(2, this.message);
            if (this.details.length)
                writer.writeRepeatedMessage(3, this.details, (item: dependency_1.google.protobuf.Any) => item.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Status {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new Status();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.code = reader.readInt32();
                        break;
                    case 2:
                        message.message = reader.readString();
                        break;
                    case 3:
                        reader.readMessage(message.details, () => pb_1.Message.addToRepeatedWrapperField(message, 3, dependency_1.google.protobuf.Any.deserialize(reader), dependency_1.google.protobuf.Any));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): Status {
            return Status.deserialize(bytes);
        }
    }
}

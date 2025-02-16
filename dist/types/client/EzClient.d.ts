import { request } from "./Utils";
import Core from "../Core";
import { EzClientConfig, RunGqlInput, OperateInput, OperateResult, QueryInput, MutationInput, UploadInput, UploadResult, FileInput, FindInput, FindResult, Aggregate, QueryGetFirstOne, MutationGetFirstOne } from "../types/client";
export declare class EzClient extends Core {
    private endpoint_url;
    private headers;
    constructor(config: EzClientConfig);
    request: typeof request;
    setConfig: (config: EzClientConfig | {
        [key: string]: any;
    }, isOverride?: boolean) => void;
    getConfig: () => {
        endpoint_url: string;
        headers: Record<string, any>;
        project_id: string;
        project_type: string;
    };
    setHeaders: (headers: Record<string, any>, isOverride?: boolean) => void;
    getHeaders: () => Record<string, any>;
    runGql: (Input: RunGqlInput, config?: {
        endpoint_url: string;
        headers?: Record<string, any>;
    }) => Promise<any>;
    operate: (Input: OperateInput) => Promise<OperateResult>;
    query: (Input: QueryInput) => Promise<any>;
    mutation: (Input: MutationInput) => Promise<any>;
    queryGetFirstOne: (Input: QueryGetFirstOne) => Promise<any>;
    mutationGetFirstOne: (Input: MutationGetFirstOne) => Promise<any>;
    find: (Input: FindInput) => Promise<FindResult>;
    aggregate: (Input: Aggregate) => Promise<FindResult>;
    callActionflow: ({ versionId, actionFlowId, args, }: {
        versionId?: null | undefined;
        actionFlowId?: string | undefined;
        args?: {} | undefined;
    }) => Promise<any>;
    uploadImage: (file: FileInput, Input: UploadInput) => Promise<UploadResult>;
    uploadFile: (file: FileInput, Input: UploadInput) => Promise<UploadResult>;
    uploadVideo: (file: FileInput, Input: UploadInput) => Promise<UploadResult>;
    runActionflowCode: ({ jsCode, updateDb, args, }: {
        jsCode?: string | undefined;
        updateDb?: boolean | undefined;
        args?: {} | undefined;
    }) => Promise<any>;
}

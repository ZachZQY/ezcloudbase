import Core from "../Core";
import { EzServerConfig, RunGqlInput, OperateInput, OperateResult, QueryInput, MutationInput, FindInput, FindResult, Aggregate, QueryGetFirstOne, MutationGetFirstOne } from "../types/client";
export declare class EzServer extends Core {
    private endpoint_url;
    private headers;
    private af_id;
    private clientinfo;
    constructor(config: EzServerConfig);
    setConfig: (config: EzServerConfig | {
        [key: string]: any;
    }, isOverride?: boolean) => void;
    getConfig: () => {
        endpoint_url: string;
        headers: Record<string, any>;
        project_id: string;
        project_type: string;
        af_id: string;
        clientinfo: Record<string, any>;
    };
    setHeaders: (headers: Record<string, any>, isOverride?: boolean) => void;
    getHeaders: () => Record<string, any>;
    setClientinfo: (clientinfo: Record<string, any>, isOverride?: boolean) => void;
    getClientinfo: () => Record<string, any>;
    callScf: (Input: {
        scf_dir?: string;
        scf_name: string;
        payload?: Record<string, any>;
    }) => Promise<any>;
    runGql: (Input: RunGqlInput) => Promise<any>;
    operate: (Input: OperateInput) => Promise<OperateResult>;
    query: (Input: QueryInput) => Promise<any>;
    mutation: (Input: MutationInput) => Promise<any>;
    find: (Input: FindInput) => Promise<FindResult>;
    aggregate: (Input: Aggregate) => Promise<FindResult>;
    queryGetFirstOne: (Input: QueryGetFirstOne) => Promise<FindResult>;
    mutationGetFirstOne: (Input: MutationGetFirstOne) => Promise<FindResult>;
    fetchApi: (Input: {
        url: string;
        method?: string;
        data?: Record<string, any>;
        headers?: Record<string, any>;
    }) => Promise<any>;
    runActionflowCode: ({ jsCode, updateDb, args, }: {
        jsCode?: string | undefined;
        updateDb?: boolean | undefined;
        args?: {} | undefined;
    }) => Promise<any>;
    callActionflow: ({ versionId, actionFlowId, args, }: {
        versionId?: null | undefined;
        actionFlowId?: string | undefined;
        args?: {} | undefined;
    }) => Promise<any>;
    runScfCode: ({ scf_code, payload }: {
        scf_code?: string | undefined;
        payload?: {} | undefined;
    }) => Promise<any>;
    pushScf: (Input: {
        scf_dir: string;
        isOverwrite?: boolean;
        scfs: {
            scf_name: string;
            scf_code: string;
            parameters: Record<string, any>;
            returns: Record<string, any>;
            description: string;
        };
    }) => Promise<any>;
    pullScf: (Input: {
        scf_dir: string;
        scfs?: {
            scf_name: string;
        };
    }) => Promise<any>;
    removeScf: (Input: {
        scf_dir: string;
        scfs?: {
            scf_name: string;
        };
    }) => Promise<any>;
    developerLogin: (Input: {
        username?: string;
        password?: string;
    }) => Promise<any>;
}

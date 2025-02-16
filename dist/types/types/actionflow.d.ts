export * from "./common";
import { RunGqlInput, FindInput, FindResult, OperateInput, OperateResult, QueryInput, QueryGetFirstOne, MutationInput, MutationGetFirstOne, Aggregate } from "./common";
/**
 * The request interface for cloud function execution environment
 * @public
 */
export type Request = {
    scf_name: string;
    scf_dir?: string;
    payload?: any;
    clientinfo?: any;
    callback_body?: any;
    callback_input?: any;
};
/**
 * The system interface for cloud function execution environment
 * @public
 */
export type System = {
    name: string;
    is_logs: boolean;
    is_developer_auth: boolean;
    pre_middelware_code: string;
    post_middelware_code: string;
    global_config: any;
    thirdapi_id: string;
    af_id: string;
};
/**
 * The scf interface for cloud function execution environment
 * @public
 */
export type Scf = {
    scf_config: any;
    scf_dir: string;
    scf_name: string;
    scf_code: string;
    scf_fn: any;
    parameters: any;
    returns: any;
    description: any;
};
/**
 * The getRequestResult interface for cloud function execution environment
 * @public
 */
export type GetRequestResult = Request;
/**
 * The getSystemResult interface for cloud function execution environment
 * @public
 */
export type GetSystemResult = System;
/**
 * The getScfResult interface for cloud function execution environment
 * @public
 */
export type GetScfResult = Scf;
/**
 * The ezcloud interface provides cloud development related utilities
 * @public
 */
export interface ezcloud {
    /**
     * The getRequest function for cloud function execution environment
     * @public
     */
    getRequest: () => GetRequestResult;
    /**
     * The clog function for cloud function execution environment
     * @public
     */
    clog: (data: any) => void;
    /**
     * The getResponse function for cloud function execution environment
     * @public
     */
    getResponse: () => any;
    /**
     * The getScf function for cloud function execution environment
     * @public
     */
    getScf: () => GetScfResult;
    /**
     * The getSystem function for cloud function execution environment
     * @public
     */
    getSystem: () => GetSystemResult;
    /**
     * The getPayload function for cloud function execution environment
     * @public
     */
    getPayload: () => any;
    /**
     * The getClientinfo function for cloud function execution environment
     * @public
     */
    getClientinfo: () => any;
    /**
     * The getCallbackBody function for cloud function execution environment
     * @public
     */
    getCallbackBody: () => any;
    /**
     * The getCallbackInput function for cloud function execution environment
     * @public
     */
    getCallbackInput: () => any;
    /**
     * The find function for cloud function execution environment
     * @public
     */
    find: (inputs: FindInput) => FindResult;
    /**
     * The operate function for cloud function execution environment
     * @public
     */
    operate: (inputs: OperateInput) => OperateResult;
    /**
     * The query function for cloud function execution environment
     * @public
     */
    query: (inputs: QueryInput) => Array<any>;
    mutation: (inputs: MutationInput) => {
        [key: string]: any;
    };
    aggregate: (inputs: Aggregate) => {
        min: any;
        avg: any;
        max: any;
        sum: any;
        count: string;
        [key: string]: any;
    };
    /**
     * The queryGetFirstOne function for cloud function execution environment
     * @public
     */
    queryGetFirstOne: (inputs: QueryGetFirstOne) => {
        [key: string]: any;
    };
    /**
     * The mutationGetFirstOne function for cloud function execution environment
     * @public
     */
    mutationGetFirstOne: (inputs: MutationGetFirstOne) => any;
    /**
     * The genJwtToken function for cloud function execution environment
     * @public
     */
    genJwtToken: (data?: {
        expires_in?: number;
        [key: string]: any;
    }, secret?: string) => string;
    /**
     * The parseJwtToken function for cloud function execution environment
     * @public
     */
    parseJwtToken: (token?: string, secret?: string) => {
        expires_in: number;
        [key: string]: any;
    };
    /**
     * The md5 function for cloud function execution environment
     * @public
     */
    md5: (str?: any, bit?: string) => string;
    /**
     * The callActionflow function for cloud function execution environment
     * @public
     */
    callActionflow: ({ actionFlowId, versionId, args, }: {
        actionFlowId: string;
        versionId: number | null;
        args: any;
    }) => any;
    /**
     * The callScf function for cloud function execution environment
     * @public
     */
    callScf: ({ scf_name, payload, scf_dir, }: {
        scf_name?: string | undefined;
        payload?: {} | undefined;
        scf_dir?: string | undefined;
    }) => {
        code: number;
        msg: string;
        data: any;
        [key: string]: any;
    };
    /**
     * The fetchApi function for cloud function execution environment
     * @public
     */
    fetchApi: ({ url, method, headers, data, }: {
        url?: string | undefined;
        method?: string | undefined;
        headers?: null | undefined;
        data?: {} | undefined;
    }) => any;
    /**
     * The uploadMedia function for cloud function execution environment
     * @public
     */
    uploadMedia: ({ url }: {
        url?: string | undefined;
    }) => any;
    /**
     * The callThirdapi function for cloud function execution environment
     * @public
     */
    callThirdapi: (thirdapi_name?: string, data?: any, headers?: any) => any;
    /**
     * The runGql function for cloud function execution environment
     * @public
     */
    runGql: (Input: RunGqlInput) => any;
    /**
     * The success function for cloud function execution environment
     * @public
     */
    success: (data?: any, msg?: string) => void;
    /**
     * The fail function for cloud function execution environment
     * @public
     */
    fail: (data?: any, msg?: string, code?: number) => void;
}
/**
 * The context interface for cloud function execution environment
 * @public
 */
export interface context {
    /**
     * The getArg function for cloud function execution environment
     * @public
     */
    getArg: (inputArgName: string | "fz_callback_body" | "fz_payment_callback_input") => any;
    /**
     * The setReturn function for cloud function execution environment
     * @public
     */
    setReturn: (outputArgName: any, value: any) => any;
    /**
     * The uploadMedia function for cloud function execution environment
     * @public
     */
    uploadMedia: (url: string, headers?: any) => any;
    /**
     * The runGql function for cloud function execution environment
     * @public
     */
    runGql: (operationName: string | null | undefined, gql: string, variables: object, permission: {
        role: string | "admin";
    }) => any;
    /**
     * The callThirdPartyApi function for cloud function execution environment
     * @public
     */
    callThirdPartyApi: (operationId: string, args: object) => any;
    /**
     * The callActionFlow function for cloud function execution environment
     * @public
     */
    callActionFlow: (actionFlowId: string, versionId: number | null, args: any) => any;
    /**
     * The getSeqNextValue function for cloud function execution environment
     * @public
     */
    getSeqNextValue: (seqName: string, createIfNotExists?: boolean) => any;
    /**
     * The resetSeqValue function for cloud function execution environment
     * @public
     */
    resetSeqValue: (seqName: string, value: number) => any;
    /**
     * The getWechatMiniAppAccessToken function for cloud function execution environment
     * @public
     */
    getWechatMiniAppAccessToken: () => string;
    /**
     * The sendEmail function for cloud function execution environment
     * @public
     */
    sendEmail: (toAddress: string, subject: string, fromAlias: string, textBody: string, htmlBody: string) => any;
    log: (msg: string, isError: boolean) => any;
    error: (msg: string, isError: boolean) => any;
    throwException: (errorType: string, errorMsg: string) => any;
    countTokens: (model: string, content: string) => any;
    chatCompletion: (prompt: string) => string;
    uploadMediaDirectly: (url: string) => any;
    getSsoAccountId: () => null | number;
    getSsoUserInfo: () => any;
    generateRSASignature: (privateKey: string, data: any, signatureType: string | "SHA256withRSA") => string;
    validateRSASignature: (publicKey: string, data: any, sign: string, signatureType: string | "SHA256withRSA") => any;
}

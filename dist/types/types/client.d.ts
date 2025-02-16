export * from "./common";
/** @public */
export type FileInput = File & {
    name?: string;
    path?: string;
};
/** @public */
export type UploadInput = {
    onReady?: (result: Record<string, any>) => void;
    onProgress?: (loaded: number, total: number) => void;
};
/** @public */
export type UploadResult = {
    uploadUrl: string;
    uploadHeaders: Record<string, any>;
    downloadUrl: string;
    contentType: string;
    imageId?: any;
    fileId?: any;
    videoId?: any;
    [key: string]: any;
};
/** @public */
export type EzClientConfig = {
    endpoint_url: string;
    headers?: Record<string, any>;
};
/** @public */
export type EzServerConfig = EzClientConfig & {
    af_id: string;
    clientinfo?: Record<string, any>;
};

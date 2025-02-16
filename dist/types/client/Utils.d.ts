import { FileInput } from "../types/client";
export declare function getWxFileSystemManager(file: FileInput, deal_name: "readFile" | "getFileInfo"): Promise<any | ({
    data?: any;
} & {
    digest?: any;
})>;
export declare function getWebFileReader(file: FileInput, deal_name: "readAsArrayBuffer" | "readAsDataURL" | "readAsText" | "readAsBinaryString" | "readAsDataURL"): Promise<any | {
    result?: any;
}>;
export declare function getMediaInfo(file: FileInput): Promise<any & {
    md5Base64?: string;
    mediaSuffix?: string;
    data?: any;
}>;
export declare function request({ url, method, headers, data, body, }: {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH";
    headers?: {
        "Content-Type"?: string;
    } | {
        Authorization?: string;
    } | {
        [key: string]: any;
    };
    data?: any;
    body?: any;
}): Promise<any>;

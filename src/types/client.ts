export * from "./common";

/** @public */
export type FileInput = File & { name?: string; path?: string };

/** @public */
export type UploadInput = {
  onReady?: (result: Record<string, any>) => void; // 上传准备就绪
  onProgress?: (loaded: number, total: number) => void; // 上传进度
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

// EzClient配置文件
/** @public */
export type EzClientConfig = {
  endpoint_url: string;
  headers?: Record<string, any>;
};

// EzServer配置文件
/** @public */
export type EzServerConfig = EzClientConfig & {
  af_id: string;
  clientinfo?: Record<string, any>;
};

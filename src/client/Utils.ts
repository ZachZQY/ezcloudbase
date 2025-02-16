declare const wx: any;
import { FileInput } from "../types/client";
import * as CryptoJS from "crypto-js";

const MediaFormat = [
  "CSS",
  "CSV",
  "DOC",
  "DOCX",
  "GIF",
  "HTML",
  "ICO",
  "JPEG",
  "JPG",
  "JSON",
  "MOV",
  "MP3",
  "MP4",
  "OTHER",
  "PDF",
  "PNG",
  "PPT",
  "PPTX",
  "TXT",
  "WAV",
  "WEBP",
  "XLS",
  "XLSX",
  "XML",
];
function getEnv(): "WX" | "WEB" | "NODE" {
  if (
    typeof wx !== "undefined" &&
    typeof global !== "undefined" &&
    typeof window == "undefined" &&
    typeof process == "undefined"
  ) {
    return "WX";
  } else if (
    typeof global !== "undefined" &&
    typeof process !== "undefined" &&
    typeof window == "undefined" &&
    typeof wx == "undefined"
  ) {
    return "NODE";
  } else if (typeof window !== "undefined") {
    return "WEB";
  } else {
    throw new Error("Unknown environment");
  }
}

function hexToArrayBuffer(hexString: string) {
  // 将16进制字符串转成字节数组
  const byteArray = new Uint8Array(
    hexString?.match(/[\da-f]{2}/gi)?.map((h) => parseInt(h, 16)) || []
  );

  // 将字节数组转成ArrayBuffer
  return byteArray.buffer;
}

export function getWxFileSystemManager(
  file: FileInput,
  deal_name: "readFile" | "getFileInfo"
): Promise<any | ({ data?: any } & { digest?: any })> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager()[deal_name]({
      filePath: file.path,
      encoding: undefined,
      success: (res: any) => {
        resolve({
          data: res.data,
          digest: res?.digest,
        });
      },
      fail: (err: any) => {
        reject(err);
      },
    });
  });
}

export function getWebFileReader(
  file: FileInput,
  deal_name:
    | "readAsArrayBuffer"
    | "readAsDataURL"
    | "readAsText"
    | "readAsBinaryString"
    | "readAsDataURL"
): Promise<any | { result?: any }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      resolve({ result: event.target?.result });
    };
    reader.onerror = function (event) {
      reject(event);
    };
    reader[deal_name](file);
  });
}

export function getMediaInfo(
  file: FileInput
): Promise<any & { md5Base64?: string; mediaSuffix?: string; data?: any }> {
  // TODO: getMediaInfo
  const env = getEnv();
  return new Promise(async (resolve, reject) => {
    if (env == "WX") {
      if (!file?.path) {
        reject("file.path is required");
      }
      // 获取文件
      const { data } = await getWxFileSystemManager(file, "readFile");
      // 获取文件信息
      const { digest } = await getWxFileSystemManager(file, "getFileInfo");

      const digest_ArrayBuffer = hexToArrayBuffer(digest);
      const md5Base64 = wx.arrayBufferToBase64(digest_ArrayBuffer);
      const filePath = file.path || "";
      const suffix = filePath
        .slice(filePath.lastIndexOf(".") + 1)
        .toUpperCase();
      const mediaName = filePath.slice(filePath.lastIndexOf("/") + 1);
      const mediaSuffix = MediaFormat.includes(suffix) ? suffix : "OTHER";
      resolve({
        md5Base64,
        mediaSuffix,
        mediaData: data,
        mediaName,
      });
    } else if (env == "WEB") {
      const { result } = await getWebFileReader(file, "readAsArrayBuffer");
      const wordArray = CryptoJS.lib.WordArray.create(result);
      const md5Base64 = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(wordArray));
      const mediaName = file.name || "";
      const suffix = mediaName
        .slice(mediaName.lastIndexOf(".") + 1)
        .toUpperCase();
      const mediaSuffix = MediaFormat.includes(suffix) ? suffix : "OTHER";
      resolve({
        md5Base64,
        mediaSuffix,
        mediaData: file,
        mediaName,
      });
    } else if (env == "NODE") {
      reject("getMediaInfo is not supported in this environment：NODE");
    } else {
      reject(`getMediaInfo is not supported in this environment:${env}`);
    }
  });
}

export function request({
  url = "",
  method = "GET",
  headers = {},
  data,
  body,
}: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH";
  headers?:
    | { "Content-Type"?: string }
    | {
        Authorization?: string;
      }
    | { [key: string]: any };
  data?: any;
  body?: any;
}): Promise<any> {
  // TODO: 实现request方法
  const env = getEnv();
  return new Promise((resolve, reject) => {
    if (env == "WX") {
      wx.request({
        url,
        method,
        data: data || body,
        header: headers,
        success: (res: any) => {
          resolve(res?.data);
        },
        fail: (e: any) => {
          reject(e);
        },
      });
    } else if (env == "NODE" || env == "WEB") {
      fetch(url, {
        method,
        body: body || JSON.stringify(data),
        headers,
      })
        .then((response) => {
          if (!response.ok) {
            reject({
              message: `HTTP error! status: ${response.status} ${response.statusText}`,
              response,
            });
            return;
          }
          const contentType = response.headers.get("Content-Type");
          if (contentType && contentType.includes("application/json")) {
            resolve(response.json());
          } else {
            resolve(response.body);
          }
        })
        .catch((e) => {
          reject(e);
        });
    }
  });
}

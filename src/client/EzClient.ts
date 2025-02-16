import { request, getMediaInfo } from "./Utils";
import Core from "../Core";
import {
  EzClientConfig,
  RunGqlInput,
  OperateInput,
  OperateResult,
  QueryInput,
  MutationInput,
  UploadInput,
  UploadResult,
  FileInput,
  FindInput,
  FindResult,
  Aggregate,
  QueryGetFirstOne,
  MutationGetFirstOne,
} from "../types/client";
export class EzClient extends Core {
  private endpoint_url: string = "";
  private headers: Record<string, any> = {};
  constructor(config: EzClientConfig) {
    super();
    this.setConfig(config, true);
  }
  public request = request;
  public setConfig = (
    config: EzClientConfig | { [key: string]: any },
    isOverride: boolean = false
  ): void => {
    if (isOverride) {
      this.endpoint_url = config?.endpoint_url;
      this.headers = config?.headers || {};
    } else {
      if (config?.endpoint_url) {
        this.endpoint_url = config?.endpoint_url;
      }
      this.setHeaders(config?.headers || {}, isOverride);
    }
  };
  public getConfig = (): {
    endpoint_url: string;
    headers: Record<string, any>;
    project_id: string;
    project_type: string;
  } => {
    const match = this.endpoint_url.match(/zero\/([^/]+)\/api\/graphql-v2/);
    const projectId = match ? match[1] : "";
    const projectType = this.endpoint_url.includes("momen")
      ? "MOMEN"
      : "FUNCTORZ";
    return {
      project_id: projectId,
      project_type: projectType,
      endpoint_url: this.endpoint_url,
      headers: this.headers,
    };
  };
  public setHeaders = (
    headers: Record<string, any>,
    isOverride: boolean = false
  ): void => {
    if (isOverride) {
      this.headers = headers;
    } else {
      this.headers = { ...this.headers, ...headers };
    }
  };

  public getHeaders = (): Record<string, any> => {
    return this.headers;
  };

  // 运行gql
  public runGql = async (
    Input: RunGqlInput,
    config?: { endpoint_url: string; headers?: Record<string, any> }
  ): Promise<any> => {
    const { gql, variables, onMessage } = Input;
    const payloadBody = {
      query: gql,
      variables,
    };
    return request({
      url: config?.endpoint_url || this.endpoint_url,
      method: "POST",
      headers: {
        ...(config?.headers || this.headers),
        "Content-Type": "application/json",
      },
      data: payloadBody,
      body: JSON.stringify(payloadBody),
    }).then((res) => {
      if (res.errors) {
        return Promise.reject({
          message: res.errors?.[0]?.message,
          info: {
            locations: res.errors?.[0]?.locations,
            errors: res.errors,
            gql,
            variables,
          },
        });
      }
      return res?.data;
    });
  };

  // 操作
  public operate = async (Input: OperateInput): Promise<OperateResult> => {
    const { gql, variables } = this.genGql({
      ...Input,
      opMethod: Input?.opMethod || "query",
      opName: Input?.opName || "Operate",
    });
    Input?.onInited && Input?.onInited({ gql, variables });
    return this.runGql({ gql, variables }).then((response: any) => {
      return { gql, variables, response };
    });
  };

  // 查询
  public query = async (Input: QueryInput): Promise<any> => {
    const { opName, name, args, directives, fields } = Input;
    return this.operate({
      ...Input,
      opMethod: "query",
      opName: opName || name || "Query",
      opFields: {
        alias: "response",
        name: name || "__typename",
        args,
        directives,
        fields: fields === undefined ? "__typename" : fields,
      },
    }).then((result) => result?.response?.response);
  };

  // 变更
  public mutation = async (Input: MutationInput): Promise<any> => {
    const { opName, name, args, directives, fields } = Input;
    return this.operate({
      ...Input,
      opMethod: "mutation",
      opName: opName || name || "Mutation",
      opFields: {
        alias: "response",
        name: name || "__typename",
        args,
        directives,
        fields: fields === undefined ? "__typename" : fields,
      },
    }).then((result) => result?.response?.response);
  };

  // 查询
  public queryGetFirstOne = async (Input: QueryGetFirstOne): Promise<any> => {
    const { opName, name, args, directives, fields } = Input;
    return this.operate({
      ...Input,
      opMethod: "query",
      opName: opName || name || "QueryGetFirstOne",
      opFields: {
        alias: "response",
        name: name || "__typename",
        args: {
          ...args,
          limit: 1,
        },
        directives,
        fields: fields === undefined ? "__typename" : fields,
      },
    }).then((result) => result?.response?.response?.[0]);
  };

  // 变更
  public mutationGetFirstOne = async (
    Input: MutationGetFirstOne
  ): Promise<any> => {
    const { opName, name, args, directives, returning_fields } = Input;
    return this.operate({
      ...Input,
      opMethod: "mutation",
      opName: opName || name || "MutationGetFirstOne",
      opFields: {
        alias: "response",
        name: name || "__typename",
        args,
        directives,
        fields: {
          name: "returning",
          fields:
            returning_fields === undefined ? "__typename" : returning_fields,
        },
      },
    }).then((result) => result?.response?.response?.returning?.[0]);
  };
  // 查询
  public find = async (Input: FindInput): Promise<FindResult> => {
    const {
      opName,
      name = "account",
      page_number = 1,
      page_size = 20,
      args = {},
      fields = "id",
      aggregate_fields = "count",
    } = Input || {};
    return this.operate({
      ...Input,
      opMethod: "query",
      opName: opName || "Find",
      opFields: [
        {
          alias: "datas",
          name,
          args: {
            ...args,
            limit: page_size,
            offset: (page_number - 1) * page_size,
          },
          fields,
        },
        {
          alias: "datas_aggregate",
          name: `${name}_aggregate`,
          args: {
            ...args,
            limit: null,
            offset: null,
          },
          fields: [
            {
              name: "aggregate",
              fields: aggregate_fields,
            },
          ],
        },
      ],
    }).then((result) => {
      return {
        datas: result?.response?.datas,
        aggregate: result?.response?.datas_aggregate?.aggregate,
      };
    });
  };

  // 查询
  public aggregate = async (Input: Aggregate): Promise<FindResult> => {
    const {
      opName,
      name = "account",
      args = {},
      aggregate_fields = "count",
    } = Input || {};
    return this.operate({
      ...Input,
      opMethod: "query",
      opName: opName || "Aggregate",
      opFields: {
        alias: "datas_aggregate",
        name: `${name}_aggregate`,
        args,
        fields: [
          {
            name: "aggregate",
            fields: aggregate_fields,
          },
        ],
      },
    }).then((result) => {
      return result?.response?.datas_aggregate?.aggregate;
    });
  };

  // 调行为流
  public callActionflow = async ({
    versionId = null,
    actionFlowId = "",
    args = {},
  }): Promise<any> => {
    return this.mutation({
      name: "fz_invoke_action_flow_default_by_latest_version",
      args: {
        actionFlowId: () => "$actionFlowId",
        versionId: () => "$versionId",
        args: () => "$args",
      },
      fields: "",
      opArgs: {
        $actionFlowId: "String!",
        $versionId: "Int",
        $args: "Json!",
      },
      variables: {
        versionId: versionId,
        actionFlowId: actionFlowId,
        args: args || {},
      },
    });
  };

  // 上传图片
  public uploadImage = async (
    file: FileInput,
    Input: UploadInput
  ): Promise<UploadResult> => {
    const { onReady } = Input || {};
    const { md5Base64, mediaSuffix, mediaData } = await getMediaInfo(file);
    const presignedResult: UploadResult = await this.query({
      name: "imagePresignedUrlV2",
      args: {
        imgMd5Base64: () => "$imgMd5Base64",
        imageSuffix: () => "$imageSuffix",
      },
      fields: "uploadUrl uploadHeaders downloadUrl contentType imageId",
      opArgs: {
        $imgMd5Base64: "String!",
        $imageSuffix: "MediaFormat!",
      },
      variables: {
        imgMd5Base64: md5Base64,
        imageSuffix: mediaSuffix,
      },
    });
    if (!presignedResult?.uploadUrl) {
      throw new Error("uploadUrl is empty");
    }
    onReady && onReady(presignedResult);

    const uploadRes = request({
      url: presignedResult.uploadUrl,
      method: "PUT",
      body: mediaData,
      data: mediaData,
      headers: presignedResult.uploadHeaders,
    });

    return { ...uploadRes, ...presignedResult };
  };

  // 上传文件
  public uploadFile = async (
    file: FileInput,
    Input: UploadInput
  ): Promise<UploadResult> => {
    const { onReady } = Input || {};
    const { md5Base64, mediaSuffix, mediaName, mediaData } = await getMediaInfo(
      file
    );
    const presignedResult: UploadResult = await this.query({
      name: "filePresignedUrlV2", // filePresignedUrlV2
      args: {
        md5Base64: () => "$md5Base64",
        name: () => "$name",
        format: () => "$format",
      },
      fields: "uploadUrl uploadHeaders downloadUrl contentType fileId",
      opArgs: {
        $md5Base64: "String!",
        $name: "String",
        $format: "MediaFormat!",
      },
      variables: {
        md5Base64: md5Base64,
        name: mediaName,
        format: mediaSuffix,
      },
    });
    if (!presignedResult?.uploadUrl) {
      throw new Error("uploadUrl is empty");
    }

    onReady && onReady(presignedResult);

    const uploadRes = request({
      url: presignedResult.uploadUrl,
      method: "PUT",
      body: mediaData,
      data: mediaData,
      headers: presignedResult.uploadHeaders,
    });
    return { ...uploadRes, ...presignedResult };
  };

  // 上传视频
  public uploadVideo = async (
    file: FileInput,
    Input: UploadInput
  ): Promise<UploadResult> => {
    const { onReady } = Input || {};
    const { md5Base64, mediaSuffix, mediaData } = await getMediaInfo(file);
    const presignedResult: UploadResult = await this.query({
      name: "videoPresignedUrlV2", // videoPresignedUrlV2
      args: {
        videoMd5Base64: () => "$videoMd5Base64",
        videoFormat: () => "$videoFormat",
      },
      fields: "uploadUrl uploadHeaders downloadUrl contentType videoId",
      opArgs: {
        $videoMd5Base64: "String!",
        $videoFormat: "MediaFormat!",
      },
      variables: {
        videoMd5Base64: md5Base64,
        videoFormat: mediaSuffix,
      },
    });
    if (!presignedResult?.uploadUrl) {
      throw new Error("uploadUrl is empty");
    }
    onReady && onReady(presignedResult);

    const uploadRes = request({
      url: presignedResult.uploadUrl,
      method: "PUT",
      body: mediaData,
      data: mediaData,
      headers: presignedResult.uploadHeaders,
    });
    return { ...uploadRes, ...presignedResult };
  };

  // 执行行为流代码-需要管理员token-开发中使用
  public runActionflowCode = async ({
    jsCode = "",
    updateDb = false,
    args = {},
  }): Promise<any> => {
    return this.mutation({
      name: "fz_debug_action_code",
      args: {
        jsCode: () => "$jsCode",
        updateDb: () => "$updateDb",
        args: () => "$args",
      },
      fields: "",
      opArgs: {
        $jsCode: "String!",
        $updateDb: "Boolean!",
        $args: "JsonObject",
      },
      variables: {
        jsCode: jsCode,
        updateDb: updateDb || true,
        args: args || {},
      },
    });
  };
}

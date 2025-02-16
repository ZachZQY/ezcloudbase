import { request } from "./Utils";
import Core from "../Core";
import {
  EzServerConfig,
  RunGqlInput,
  OperateInput,
  OperateResult,
  QueryInput,
  MutationInput,
  FindInput,
  FindResult,
  Aggregate,
  QueryGetFirstOne,
  MutationGetFirstOne,
} from "../types/client";
export class EzServer extends Core {
  private endpoint_url: string = "";
  private headers: Record<string, any> = {};
  private af_id: string = "";
  private clientinfo: Record<string, any> = {};
  constructor(config: EzServerConfig) {
    super();
    this.setConfig(config, true);
  }
  public setConfig = (
    config: EzServerConfig | { [key: string]: any },
    isOverride: boolean = false
  ): void => {
    if (isOverride) {
      this.endpoint_url = config?.endpoint_url;
      this.headers = config?.headers || {};
      this.af_id = config?.af_id || "";
      this.clientinfo = config?.clientinfo || {};
    } else {
      if (config?.endpoint_url) {
        this.endpoint_url = config?.endpoint_url;
      }
      if (config?.af_id) {
        this.af_id = config?.af_id;
      }
      this.setClientinfo(config?.clientinfo || {}, isOverride);
      this.setHeaders(config?.headers || {}, isOverride);
    }
  };

  public getConfig = (): {
    endpoint_url: string;
    headers: Record<string, any>;
    project_id: string;
    project_type: string;
    af_id: string;
    clientinfo: Record<string, any>;
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
      af_id: this.af_id,
      clientinfo: this.clientinfo,
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

  public setClientinfo = (
    clientinfo: Record<string, any>,
    isOverride: boolean = false
  ): void => {
    if (isOverride) {
      this.clientinfo = clientinfo;
    } else {
      this.clientinfo = {
        ...this.clientinfo,
        ...clientinfo,
      };
    }
  };

  public getClientinfo = (): Record<string, any> => {
    return this.clientinfo;
  };

  // 调用scf
  public callScf = async (Input: {
    scf_dir?: string;
    scf_name: string;
    payload?: Record<string, any>;
  }): Promise<any> => {
    const data = {
      query: `
  mutation fz_invoke_action_flow_default_by_latest_version(
    $actionFlowId:String!
    $versionId:Int
    $args: Json!
  ){
    response: fz_invoke_action_flow_default_by_latest_version(
      actionFlowId: $actionFlowId
      versionId: $versionId
      args: $args
    )
  }
  `,
      variables: {
        versionId: null,
        actionFlowId: this.af_id,
        args: {
          scf_dir: Input?.scf_dir,
          scf_name: Input?.scf_name,
          payload: Input?.payload,
          clientinfo: this.clientinfo,
        },
      },
    };
    return request({
      data,
      body: JSON.stringify(data),
      url: this?.endpoint_url,
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.errors) {
          return Promise.reject({
            message: res.errors?.[0]?.message,
            info: {
              locations: res.errors?.[0]?.locations,
              errors: res.errors,
              data,
              res,
            },
          });
        }
        return res?.data?.response;
      })
      .then((res) => {
        if (res.code !== 0) {
          return Promise.reject({
            message: res.msg,
            info: {
              ...res,
            },
          });
        }
        return res?.data;
      });
  };

  // 执行gql
  public runGql = async (Input: RunGqlInput): Promise<any> => {
    const { gql, variables = {}, onMessage } = Input;
    return this.callScf({
      scf_name: "runGql",
      payload: {
        gql,
        variables,
      },
    });
  };

  // 执行操作
  public operate = async (Input: OperateInput): Promise<OperateResult> => {
    return this.callScf({
      scf_name: "operate",
      payload: Input,
    });
  };
  // 执行查询
  public query = async (Input: QueryInput): Promise<any> => {
    return this.callScf({
      scf_name: "query",
      payload: Input,
    });
  };
  // 执行mutation
  public mutation = async (Input: MutationInput): Promise<any> => {
    return this.callScf({
      scf_name: "mutation",
      payload: Input,
    });
  };
  // 执行find
  public find = async (Input: FindInput): Promise<FindResult> => {
    return this.callScf({
      scf_name: "find",
      payload: Input,
    });
  };
  public aggregate = async (Input: Aggregate): Promise<FindResult> => {
    return this.callScf({
      scf_name: "aggregate",
      payload: Input,
    });
  };
  public queryGetFirstOne = async (
    Input: QueryGetFirstOne
  ): Promise<FindResult> => {
    return this.callScf({
      scf_name: "queryGetFirstOne",
      payload: Input,
    });
  };
  public mutationGetFirstOne = async (
    Input: MutationGetFirstOne
  ): Promise<FindResult> => {
    return this.callScf({
      scf_name: "mutationGetFirstOne",
      payload: Input,
    });
  };

  // API代理请求
  public fetchApi = async (Input: {
    url: string;
    method?: string;
    data?: Record<string, any>;
    headers?: Record<string, any>;
  }): Promise<any> => {
    return this.callScf({
      scf_name: "fetchApi",
      payload: Input,
    });
  };

  // 执行actionflow代码-开发中使用（不建议用，建议用ezclient）
  public runActionflowCode = async ({
    jsCode = "",
    updateDb = false,
    args = {},
  }): Promise<any> => {
    return this.callScf({
      scf_name: "runActionflowCode",
      payload: {
        jsCode: jsCode,
        updateDb: updateDb || true,
        args: args || {},
      },
    });
  };
  // 调行为流
  public callActionflow = async ({
    versionId = null,
    actionFlowId = "",
    args = {},
  }): Promise<any> => {
    return this.callScf({
      scf_name: "callActionflow",
      payload: {
        actionFlowId: actionFlowId,
        versionId: versionId,
        args: args || {},
      },
    });
  };

  // 执行scf代码-开发中使用
  public runScfCode = async ({ scf_code = "", payload = {} }): Promise<any> => {
    return this.callScf({
      scf_name: "runScfCode",
      payload: { scf_code: scf_code || "", payload: payload || {} },
    });
  };
  // 推送scf-开发中使用
  public pushScf = async (Input: {
    scf_dir: string;
    isOverwrite?: boolean;
    scfs: {
      scf_name: string;
      scf_code: string;
      parameters: Record<string, any>;
      returns: Record<string, any>;
      description: string;
    };
  }): Promise<any> => {
    return this.callScf({
      scf_name: "pushScf",
      payload: Input,
    });
  };
  // 拉取scf-开发中使用
  public pullScf = async (Input: {
    scf_dir: string;
    scfs?: {
      scf_name: string;
    };
  }): Promise<any> => {
    return this.callScf({
      scf_name: "pullScf",
      payload: Input,
    });
  };
  // 删除scf-开发中使用
  public removeScf = async (Input: {
    scf_dir: string;
    scfs?: {
      scf_name: string;
    };
  }): Promise<any> => {
    return this.callScf({
      scf_name: "removeScf",
      payload: Input,
    });
  };

  // 开发者登录-开发中使用
  public developerLogin = async (Input: {
    username?: string;
    password?: string;
  }): Promise<any> => {
    return this.callScf({
      scf_name: "developerLogin",
      payload: Input,
    }).then((res) => {
      // 设置当前开发者token信息
      this.setClientinfo({
        developer_token: res?.developer_token, // 设置token
        developer_token_expires_in: res?.expires_in || -1, // 设置token过期时间
      });
      return res;
    });
  };
}

import Core from "../Core";
import { EzcloudEndError } from "./Utils";
import * as CryptoJS from "crypto-js";

// 声明全局变量 context
declare const context: any;

export default class EzCloud extends Core {
  private isStarted: boolean = false; // 是否已经启动
  private LogsId: number | undefined; // 当前请求日志id
  private parentLogsId: number | undefined; // 父请求日志id
  private errors: Array<any> = [];
  private response: any = {
    code: 0,
    msg: "success",
    data: null,
  };

  private request: any = {
    scf_name: "",
    scf_dir: "",
    payload: {},
    clientinfo: {},
  };

  private system: any = {
    name: "",
    is_logs: false,
    pre_middelware_code: "",
    post_middelware_code: "",
    global_config: {},
  };

  private scf: any = {
    scf_config: {},
    scf_dir: "",
    scf_name: "",
    scf_code: "",
    parameters: "",
    returns: "",
    description: "",
  };

  constructor() {
    super();
  }

  // 执行环境代码
  public async runScfCode(jsCode: string = "") {
    // 使用 new Function() 创建一个新的函数对象，并执行它
    const envCode = "return (async()=>{\n" + jsCode + "\n})();";
    const fn = new Function("ezcloud", "context", "CryptoJS", envCode);
    return fn(this, context, CryptoJS)
      .then((response: any) => ({ data: response, code: 0, msg: "success" }))
      .catch((error: any) => {
        if (
          error?.name == "EzcloudEndError" &&
          error?.message == "EzcloudEndError" &&
          error?.isEzCloudEnd
        ) {
          return error?.response;
        }
        // 其他错误
        return {
          code: -1,
          msg: error?.message || JSON.stringify(error?.message),
          data: {
            message: error?.message || JSON.stringify(error?.message),
            name: error?.name,
            stack: error?.stack,
          },
        };
      });
  }

  // 获取请求参数
  public getArgs(key: string): any {
    let val;
    try {
      val = context?.getArgs(key);
      this.request[key] = val;
    } catch (error) {}
    return this.request?.[key];
  }

  // 设置返回值
  public setReturn(response: any) {
    if (typeof context?.setReturn === "undefined") {
      console.log(response);
    }
    Object.entries(response).forEach(([key, value]) => {
      try {
        context?.setReturn(key, value);
        this.response[key] = value;
      } catch (error: any) {}
    });
    return this.response;
  }

  // 获取系统信息
  private async getSysteminfo() {
    return this.query({
      name: "ez_system",
      args: {
        order_by: {
          idx: () => "desc_nulls_last",
        },
        limit: 1,
      },
      fields: `id idx name is_logs pre_middelware_code post_middelware_code global_config`,
    })
      .then((datas) => {
        const data = datas?.[0] || this.system;
        this.system = data;
        return data;
      })
      .catch((error) => {
        this.errors.push(error);
        return this.system;
      });
  }

  // 获取云函数
  private async getScf(scf_name: string, scf_dir?: string) {
    return this.query({
      name: "ez_scf",
      args: {
        where: {
          scf_name: {
            _eq: scf_name || "",
          },
          scf_dir: {
            _eq: scf_dir || ".",
          },
        },
        limit: 1,
      },
      fields: `id scf_dir scf_name description scf_code parameters returns `,
    })
      .then((datas) => {
        const data = datas?.[0] || this.scf;
        this.scf = data;
        return data;
      })
      .catch((error) => {
        this.errors.push(error);
        return this.scf;
      });
  }

  // 执行Graphql
  public async runGql(Input: {
    gql: string;
    variables?: { [key: string]: any };
    onMessage?: (message: any, error: any) => void;
  }): Promise<any> {
    const { gql, variables, onMessage } = Input;
    // TODO: 实现runGql方法
    return new Promise((resolve, reject) => {
      try {
        const response = context.runGql(undefined, gql, variables, {
          role: "admin",
        });
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 执行成功
  public success(data: any, msg: string = "success") {
    if (!this.isStarted) {
      return; // 未启动框架，则直接返回
    }
    throw new EzcloudEndError({
      code: 0,
      msg,
      data,
    });
  }

  // 执行失败
  public fail(msg: string = "fail", code: number = -1, data: any) {
    if (!this.isStarted) {
      return; // 未启动框架，则直接返回
    }
    if (code == 0) {
      throw new Error(
        `The 'code' should not be set to 0 in the 'error' method.`
      );
    }
    throw new EzcloudEndError({
      code,
      msg,
      data,
    });
  }

  // 框架启动
  public async start() {
    if (this.isStarted) {
      return; // 只能启动一次
    }
    this.isStarted = true;

    // 获取请求参数;自动处理request
    this.getArgs("scf_name");
    this.getArgs("scf_dir");
    this.getArgs("payload");
    this.getArgs("clientinfo");

    // 获取系统信息;自动处理system、scf
    await this.getSysteminfo();
    await this.getScf(this.request?.scf_name, this.request?.scf_dir);

    // 日志记录请求
    if (this.system?.is_logs) {
      await this.mutation({
        name: "insert_ez_logs_one",
        args: {
          object: {
            ez_logs_parent_ez_logs: this.parentLogsId,
            scf_name: this?.request?.scf_name,
            scf_dir: this?.request?.scf_dir,
            payload: () => "$payload",
            clientinfo: () => "$clientinfo",
          },
        },
        fields: [`id`],
        opArgs: {
          $payload: "jsonb",
          $clientinfo: "jsonb",
        },
        variables: {
          payload: this.request.payload,
          clientinfo: this.request.clientinfo,
        },
      })
        .then((data) => {
          this.LogsId = data?.id;
        })
        .catch((error) => {
          this.errors.push(error);
        });
    }

    let response = this.response;
    // 前置钩子
    if (this.system?.pre_middelware_code && response?.code === 0) {
      response = await this.runScfCode(this.system?.pre_middelware_code);
    }

    // 执行云函数
    if (this.scf?.scf_code && response?.code === 0) {
      response = await this.runScfCode(this.scf?.scf_code);
    }

    // 后置钩子
    if (this.system?.post_middelware_code && response?.code === 0) {
      response = await this.runScfCode(this.system?.post_middelware_code);
    }
    this.response = response;

    // 响应;自动处理response
    this.setReturn(response);

    // 日志记录响应
    if (this.system?.is_logs && !!this.LogsId) {
      this.mutation({
        name: "update_ez_logs_by_pk",
        args: {
          pk_columns: {
            id: this.LogsId,
          },
          _set: {
            code: this.response?.code,
            msg: this.response?.msg,
            data: () => "$data",
            errors: () => "$errors",
          },
        },
        fields: [`id`],
        opArgs: {
          $data: "jsonb",
          $errors: "jsonb",
        },
        variables: {
          data: this.response?.data,
          errors: this.errors,
        },
      })
        .then((data) => {
          this.LogsId = data?.id;
        })
        .catch((error) => {
          this.errors.push(error);
        });
    }
  }
}

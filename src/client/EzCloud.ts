import Core from "../Core";
type config = {
  endpoint_url?: string;
  headers?: object;
  callback_url?: string;
  clientinfo?: object;
};
export default class EzCloud extends Core {
  private clientinfo: any;
  private callback_url: any;
  constructor(config: config) {
    super();
    this.clientinfo = config?.clientinfo;
    this.callback_url = config?.callback_url;
  }
  public async runGql(Input: {
    gql: string;
    variables?: { [key: string]: any };
    onMessage?: (message: any, error: any) => void;
  }): Promise<any> {
    const { gql, variables, onMessage } = Input;
    // TODO: 实现runGql方法
    const url = this.config?.callback_url || "";
    const response = fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: gql,
        variables,
      }),
    });

    return Promise.resolve(response);
    //return Promise.reject("EzCloud.runGql is not implemented");
  }
}

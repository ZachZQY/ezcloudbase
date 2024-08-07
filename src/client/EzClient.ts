import Core from "../Core";
type config = {
  project_id?: string;
  project_type?: "functorz" | "momen";
  endpoint_url?: string;
  headers?: object;
  callback_url?: string;
  clientinfo?: object;
};
export default class EzClient extends Core {
  private endpoint_url: string;
  private headers: object = {};
  constructor(config: config) {
    super();
    this.endpoint_url = config?.endpoint_url
      ? config?.endpoint_url
      : config?.project_id
      ? `https://${
          config?.project_type == "momen"
            ? "villa.momen.app"
            : "zion-app.functorz.com"
        }/zero/${config?.project_id}/api/graphql-v2`
      : "";
    this.headers = config?.headers || {};
  }
  public async runGql(Input: {
    gql: string;
    variables?: { [key: string]: any };
    onMessage?: (message: any, error: any) => void;
  }): Promise<any> {
    const { gql, variables, onMessage } = Input;
    // TODO: 实现runGql方法
    return fetch(this.endpoint_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify({
        query: gql,
        variables,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return Promise.reject({
            message: "Network response was not ok",
            info: response,
          });
        }
        return response.json();
      })
      .then((res) => {
        if (res.errors) {
          return Promise.reject({
            message: res.errors?.[0]?.message,
            info: res?.errors,
            stack: res?.errors?.[0]?.locations,
          });
        }
        return res?.data;
      });
  }
}

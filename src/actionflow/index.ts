import EzCloud from "./EzCloud";

declare var global: any;
declare const context: any;
const contextMock = {
  runGql: (
    operationName: any,
    gql: string,
    variables: any,
    role: { role: string }
  ) => {
    const url = "https://zion-app.functorz.com/zero/4GBJjlEqVBm/api/graphql-v2";
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: gql,
        variables,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((res) => {
        if (res.errors) {
          throw new Error(res.errors[0].message);
        }
        return res?.data;
      });
  },
};

if (typeof context === "undefined") {
  global.context = contextMock;
}
export default class EzCloudBase {
  public ezcloud: EzCloud;
  constructor() {
    this.ezcloud = new EzCloud();
  }
}
const { ezcloud } = new EzCloudBase();
ezcloud.start();

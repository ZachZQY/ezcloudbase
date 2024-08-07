import EzCloud from "./EzCloud";
import EzClient from "./EzClient";
type config = {
  endpoint_url?: string;
  headers?: object;
  callback_url?: string;
  clientinfo?: object;
};
export default class EzCloudBase {
  public ezcloud: EzCloud;
  public ezclient: EzClient;
  constructor(config: config) {
    this.ezcloud = new EzCloud(config);
    this.ezclient = new EzClient(config);
  }
}

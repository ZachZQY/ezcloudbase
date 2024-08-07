export class EzcloudEndError extends Error {
  public isEzCloudEnd: boolean = true;
  public response: any;
  constructor(response: any) {
    super(`EzcloudEndError`);
    this.name = "EzcloudEndError";
    this.isEzCloudEnd = true;
    this.response = response;
  }
}

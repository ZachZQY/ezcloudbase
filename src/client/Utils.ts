export class EzcloudEndError extends Error {
  public isEzCloudEnd: boolean = true;
  constructor(message: any) {
    super(message);
    this.name = "EzcloudEndError";
    this.isEzCloudEnd = true;
  }
}

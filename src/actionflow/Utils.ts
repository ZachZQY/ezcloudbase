export class EzcloudError extends Error {
  public info: any = null;
  constructor(input: any, message: string = "EzcloudError") {
    super(message || "EzcloudError");
    this.name = "EzcloudError";
    this.info = input;
  }
}

export class EzcloudFail extends Error {
  public response: any = null;
  constructor(input: any, message: string = "EzcloudFail") {
    super(message || "EzcloudFail");
    this.name = "EzcloudFail";
    this.response = input;
  }
}

export class EzcloudSuccess extends Error {
  public response: any = null;
  constructor(input: any, message: string = "EzcloudSuccess") {
    super(message || "EzcloudSuccess");
    this.name = "EzcloudSuccess";
    this.response = input;
  }
}

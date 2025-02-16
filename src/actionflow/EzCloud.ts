import Core from "../Core";
import { EzcloudError, EzcloudFail, EzcloudSuccess } from "./Utils";
import * as CryptoJS from "crypto-js";
import {
	context as Context,
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
	Request,
	System,
	Scf,
	GetRequestResult,
	GetSystemResult,
	GetScfResult,
} from "../types/actionflow";

function cleanStackTrace(error: Error, source_path: string): string {
	if (!error.stack) {
		return "";
	}

	const stackLines = error.stack.split("\n");
	const cleanedStack = stackLines
		.filter((line) => !line.includes("__ezcloud__")) // Remove lines containing '__ezcloud__'
		.map((line) => {
			const match = line.match(/(.*):(\d+):(\d+)/);
			if (match && line.includes(source_path)) {
				const lineNumber = parseInt(match[2], 10) - 3; // Subtract 3 from the line number
				return line.replace(/:(\d+):(\d+)/, `:${lineNumber}:${match[3]}`);
			}
			return line;
		});

	return cleanedStack.join("\n");
}

// 声明全局变量 context
export declare const context: Context;

export default class EzCloud extends Core {
	private isStarted: boolean = false; // 是否已经启动
	private LogsId: number | undefined; // 当前请求日志id
	private parentLogsId: number | undefined; // 父请求日志id
	private _errors: Array<any> = [];
	private _clogs: Array<any> = [];
	private response: Record<string, any> = {
		code: 0,
		msg: "success",
		data: null,
	};

	private request: Request = {
		scf_name: "",
		scf_dir: "",
		payload: {},
		clientinfo: {},
		callback_body: null,
		callback_input: null,
	};

	private system: System = {
		name: "",
		is_logs: false,
		is_developer_auth: false,
		pre_middelware_code: "",
		post_middelware_code: "",
		global_config: {},
		thirdapi_id: "",
		af_id: "",
	};

	private scf: Scf = {
		scf_config: {},
		scf_dir: "",
		scf_name: "",
		scf_code: "",
		scf_fn: null,
		parameters: {},
		returns: {},
		description: "",
	};

	constructor() {
		super();
	}

	public getRequest = (): GetRequestResult => {
		return this.request;
	};
	public clog = (data: any): void => {
		const error = new Error();
		const stack = error.stack;
		// 获取当前执行的文件路径
		const line = stack?.split("\n")[2];
		let clogLine = "";
		const match = line?.match(/at (.+) \((.+):(\d+):(\d+)\)/);
		if (match) {
			const lineNumber = parseInt(match[3], 10);
			const columnNumber = parseInt(match[4], 10);
			// 假设整体偏移3行
			const adjustedLineNumber = Math.max(lineNumber - 3, 0);
			clogLine = match?.[2] + ":" + adjustedLineNumber + ":" + columnNumber;
		}
		const sourcePath =
			(this.getRequest().scf_dir || ".") + this.getRequest().scf_name;

		this._clogs.unshift({
			sourcePath,
			clogLine,
			data,
			_stack: cleanStackTrace(error, sourcePath),
		});
	};

	public getResponse = (): any => {
		return this.response;
	};

	public getScf = (): GetScfResult => {
		return this.scf;
	};

	public getSystem = (): GetSystemResult => {
		return this.system;
	};

	public getPayload = (): any => {
		return this.request.payload;
	};

	public getClientinfo = (): any => {
		return this.request.clientinfo;
	};

	public getCallbackBody = (): any => {
		return this.request.callback_body;
	};

	public getCallbackInput = (): any => {
		return this.request.callback_input;
	};

	public find = (inputs: FindInput): FindResult => {
		const {
			opName,
			name = "account",
			page_number = 1,
			page_size = 20,
			args = {},
			fields = "id",
			aggregate_fields = "count",
		} = inputs || {};
		const result = this.operate({
			...inputs,
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
		});

		return {
			datas: result?.response?.datas,
			aggregate: result?.response?.datas_aggregate?.aggregate,
		};
	};

	// 操作
	public operate = (inputs: OperateInput): OperateResult => {
		const { gql, variables } = this.genGql({
			...inputs,
			opMethod: inputs?.opMethod || "query",
			opName: inputs?.opName || "Operate",
		});
		inputs?.onInited && inputs?.onInited({ gql, variables });
		const response = this.runGql({ gql, variables });
		return { gql, variables, response };
	};

	// 查询
	public query = (inputs: QueryInput): Array<any> => {
		const { opName, name, args, directives, fields } = inputs || {};
		const res = this.operate({
			...inputs,
			opMethod: "query",
			opName: opName || name || "Query",
			opFields: {
				alias: "response",
				name: name || "__typename",
				args,
				directives,
				fields: fields === undefined ? "__typename" : fields,
			},
		});
		return res?.response?.response;
	};

	// 变更
	public mutation = (inputs: MutationInput): { [key: string]: any } => {
		const { opName, name, args, directives, fields } = inputs || {};
		const res = this.operate({
			...inputs,
			opMethod: "mutation",
			opName: opName || name || "Mutation",
			opFields: {
				alias: "response",
				name: name || "__typename",
				args,
				directives,
				fields: fields === undefined ? "__typename" : fields,
			},
		});
		return res?.response?.response;
	};

	public aggregate = (
		inputs: Aggregate
	): {
		min: any;
		avg: any;
		max: any;
		sum: any;
		count: string;
		[key: string]: any;
	} => {
		const {
			opName,
			name = "account",
			args = {},
			aggregate_fields = "count",
		} = inputs || {};
		const result = this.operate({
			...inputs,
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
		});
		return result?.response?.datas_aggregate?.aggregate;
	};

	// 查询
	public queryGetFirstOne = (
		inputs: QueryGetFirstOne
	): { [key: string]: any } => {
		const { opName, name, args, directives, fields } = inputs || {};
		const res = this.operate({
			...inputs,
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
		});
		return res?.response?.response?.[0];
	};

	// 变更
	public mutationGetFirstOne = (inputs: MutationGetFirstOne) => {
		const { opName, name, args, directives, returning_fields } = inputs || {};
		const res = this.operate({
			...inputs,
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
		});
		return res?.response?.response?.returning?.[0];
	};

	public genJwtToken = (
		data: { expires_in?: number;[key: string]: any } = {},
		secret = ""
	): string => {
		const expires_in = new Date().getTime() + 1000 * 60 * 60 * 24 * 30;
		if (!data?.expires_in) {
			data.expires_in = expires_in;
		}
		return generateJWT(data, secret, {
			alg: "HS256",
			typ: "JWT",
		});

		// 生成jwt token
		function generateJWT(jwt_payload: any, secret = "", header: any = {}) {
			if (typeof CryptoJS == "undefined") {
				throw new Error("CryptoJS is not configured");
			}
			if (!jwt_payload) {
				throw new Error("jwt_payload is required");
			}
			if (typeof header !== "object") {
				throw new Error("header must be an object");
			}
			if (header?.alg && header?.alg !== "HS256") {
				throw new Error("header.alg must be HS256");
			} else {
				header.alg = "HS256";
			}
			const encodedHeader = CryptoJS.enc.Base64.stringify(
				CryptoJS.enc.Utf8.parse(JSON.stringify(header))
			);
			const encodedPayload = CryptoJS.enc.Base64.stringify(
				CryptoJS.enc.Utf8.parse(JSON.stringify(jwt_payload))
			);
			const signature = CryptoJS.HmacSHA256(
				`${encodedHeader}.${encodedPayload}`,
				secret
			).toString(CryptoJS.enc.Base64);
			let token = `${encodedHeader}.${encodedPayload}.${signature}`;
			return token;
		}
	};

	public parseJwtToken = (
		token: string = "",
		secret = ""
	): { expires_in: number;[key: string]: any } => {
		const data = verifyJWT(token, secret);
		const now_time = new Date().getTime();
		if (now_time >= data?.expires_in) {
			throw new Error("Your token has expired. Please log in again.");
		}
		return data;

		// 验证jwt token
		function verifyJWT(token: string, secret = "") {
			if (typeof CryptoJS == "undefined") {
				throw new Error("CryptoJS is not configured");
			}
			if (!token || typeof token !== "string") {
				throw new Error("token is required");
			}
			const [encodedHeader, encodedPayload, signature] = token.split(".");
			const header = JSON.parse(
				CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encodedHeader))
			);
			const jwt_payload = JSON.parse(
				CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encodedPayload))
			);

			if (header.alg !== "HS256") {
				throw new Error("Invalid JWT algorithm");
			}
			const isValidSignature =
				signature ===
				CryptoJS.HmacSHA256(
					`${encodedHeader}.${encodedPayload}`,
					secret
				).toString(CryptoJS.enc.Base64);
			if (!isValidSignature) {
				throw new Error("Invalid JWT signature");
			}
			return jwt_payload;
		}
	};

	public md5 = (str: any = "", bit = "32a"): string => {
		if (typeof CryptoJS == "undefined") {
			throw new Error("CryptoJS is not configured");
		}

		function md_32a() {
			return CryptoJS.MD5(str).toString().toLowerCase();
		}

		function md_16a() {
			return CryptoJS.MD5(str).toString().toLowerCase().substring(8, 16);
		}
		if (bit == "32" || bit == "32a") {
			return md_32a();
		}
		if (bit == "16" || bit == "16a") {
			return md_16a();
		}
		if (bit == "32A") {
			return md_32a().toUpperCase();
		}
		if (bit == "16A") {
			return md_16a().toUpperCase();
		}
		return md_32a();
	};

	private runActionflowCode({ jsCode = "", updateDb = false, args = {} }) {
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
	}
	public callActionflow({ versionId = null, actionFlowId = "", args = {} }) {
		try {
			return context.callActionFlow(actionFlowId, versionId || null, args);
		} catch (error: any) {
			throw new EzcloudError(
				{ versionId, actionFlowId, args },
				error?.message ||
				`callActionflow=>【actionFlowId:${actionFlowId}】`
			);
		}
		// return this.mutation({
		// 	name: "fz_invoke_action_flow_default_by_latest_version",
		// 	args: {
		// 		actionFlowId: () => "$actionFlowId",
		// 		versionId: () => "$versionId",
		// 		args: () => "$args",
		// 	},
		// 	fields: "",
		// 	opArgs: {
		// 		$actionFlowId: "String!",
		// 		$versionId: "Int",
		// 		$args: "Json!",
		// 	},
		// 	variables: {
		// 		versionId: versionId,
		// 		actionFlowId: actionFlowId,
		// 		args: args || {},
		// 	},
		// });
	}

	public callScf = ({
		scf_name = "",
		payload = {},
		scf_dir = "",
	}): { code: number; msg: string; data: any;[key: string]: any } => {
		try {
			const result = context.callActionFlow(this.system?.af_id, null, {
				scf_dir,
				scf_name,
				payload,
				clientinfo: {
					...this.request.clientinfo,
					LogsId: this.LogsId,
				},
			});
			if (
				Array.isArray(result?.data?._clogs) &&
				result?.data?._clogs.length > 0
			) {
				this._clogs.push(result?.data?._clogs);
			}
			return result;
		} catch (error: any) {
			throw new EzcloudError(
				{ scf_dir, scf_name, payload, af_id: this.system?.af_id },
				error?.message || `callScf =>【af_id:${this.system?.af_id}】`
			);
		}
	};

	// 执行环境代码
	private runScfCode({ scf_code = "", payload = null }) {
		// 如果传入payload，说明希望变更payload
		if (payload) {
			this.request.payload = payload;
		}

		const sourcePath =
			(this.getRequest().scf_dir || ".") + this.getRequest().scf_name;
		const sourceURL = "//# sourceURL=" + sourcePath;
		// 使用 new Function() 创建一个新的函数对象，并执行它
		try {
			const fn = new Function(
				"ezcloud",
				"context",
				"CryptoJS",
				sourceURL + "\n" + scf_code
			);
			const result = fn(this, context, CryptoJS);
			return { data: result, code: 0, message: "success" };
		} catch (error: any) {
			const _stack = cleanStackTrace(error, sourcePath);
			if (error?.name == "EzcloudFail") {
				// 代码块执行要求结束
				if (typeof error?.response?.data === "object") {
					error.response.data._stack = _stack;
				}
				return error?.response;
			} else if (error?.name == "EzcloudSuccess") {
				return error?.response;
			} else if (error?.name == "EzcloudError") {
				// 框架代码抛出错误
				return {
					code: -2,
					msg: error?.message,
					data: {
						info: {
							...error?.info,
							_stack,
						},
					},
				};
			} else {
				// 用户代码抛出错误
				return {
					code: -1,
					msg: error?.message || `Error：run`,
					data: {
						info: {
							...error?.info,
							_stack,
						},
					},
				};
			}
		}
	}

	// 获取请求参数
	private getArg(key: string, alias = "", defaultValue?: any): any {
		try {
			// @ts-ignore
			this.request[alias || key] = context?.getArg(key) || defaultValue;
		} catch (error) {
			this._errors.unshift(error);
		}
		// @ts-ignore
		return this.request?.[alias || key];
	}

	// 设置返回值
	private setReturn(response: Record<string, any>) {
		Object.entries(response).forEach(([key, value]) => {
			try {
				context?.setReturn(key, value);

				this.response[key] = value;
			} catch (error: any) {
				this._errors.unshift(error);
			}
		});
	}

	// 获取系统信息
	private getSystemInit() {
		try {
			const [system] = this.query({
				name: "ez_system",
				args: {
					order_by: {
						idx: () => "desc_nulls_last",
					},
					limit: 1,
				},
				fields: `id idx name af_id thirdapi_id is_logs is_developer_auth pre_middelware_code post_middelware_code global_config`,
			});
			if (system) {
				this.system = system;
			}
		} catch (error) {
			this._errors.unshift(error);
		}
	}

	public fetchApi = ({
		url = "",
		method = "POST",
		headers = null,
		data = {},
	}): any => {
		return context.callThirdPartyApi(this.system?.thirdapi_id, {
			fz_body: {
				url,
				method: method || "POST",
				_headers: headers ? JSON.stringify(headers) : null,
				body: JSON.stringify(data),
			},
		});
	};

	public uploadMedia = ({ url = "" }): any => {
		if (!url?.startsWith("http")) {
			throw new Error("url must be a valid url");
		}
		return context.uploadMedia(url, {});
	};

	public callThirdapi = (
		thirdapi_name = "",
		data?: any,
		headers?: any
	): any => {
		const [thirdapi] = this.query({
			name: "ez_thirdapi",
			args: {
				where: {
					name: {
						_eq: thirdapi_name || "",
					},
				},
				limit: 1,
			},
			fields: `id thirdapi_name url method`,
		});
		if (thirdapi.url?.startsWith("http")) {
			return this.fetchApi({
				url: thirdapi?.url,
				method: thirdapi?.method,
				headers,
				data,
			});
		}
		return context.callThirdPartyApi(thirdapi?.url, data);
	};

	public pushScf = ({ scf_dir = "/", scfs = [], isOverwrite = false }): any => {
		const scfs_exists = this.pullScf({ scf_dir });
		const scfs_new = scfs.filter(
			(item: any) =>
				!scfs_exists?.find(
					(item2: any) => item?.scf_name && item2?.scf_name == item?.scf_name
				)
		);

		const scfs_update = scfs.filter(
			(item: any) =>
				item?.scf_name &&
				scfs_exists?.find((item2: any) => item2?.scf_name == item?.scf_name)
		);

		const fields = [
			`affected_rows`,
			{
				name: "returning",
				fields: `id scf_name scf_dir scf_code parameters returns description`,
			},
		];

		const insert_fields_objects = scfs_new?.map((item: any) => {
			return {
				scf_dir: scf_dir || "/",
				scf_name: item?.scf_name,
				scf_code: item?.scf_code,
				parameters: item?.parameters,
				returns: item?.returns,
				description: item?.description,
			};
		});

		const insert_fields =
			insert_fields_objects.length > 0
				? [
					{
						name: "insert_ez_scf",
						args: {
							objects: insert_fields_objects,
						},
						fields,
					},
				]
				: [];

		const update_fields = isOverwrite
			? scfs_update.map((item: any, index: number) => {
				return {
					alias: `update_ez_scf_${index}`,
					name: "update_ez_scf",
					args: {
						where: {
							scf_dir: {
								_eq: scf_dir,
							},
							scf_name: {
								_eq: item?.scf_name,
							},
						},
						_set: {
							scf_code: item?.scf_code,
							parameters: item?.parameters,
							returns: item?.returns,
							description: item?.description,
						},
					},
					fields,
				};
			})
			: [];

		const opFields = [...insert_fields, ...update_fields];
		if (opFields.length == 0) {
			throw new Error(`There are no scf that require changes.`);
		}

		return this.operate({
			opMethod: "mutation",
			opName: "pushScf",
			opFields,
		})?.response;
	};
	public pullScf = ({ scf_dir = "/", scfs = [] }): any => {
		return this.query({
			name: "ez_scf",
			args: {
				where: {
					scf_dir: {
						_like: `${scf_dir || "/"}%`,
					},
					...(scfs.length
						? {
							scf_name: {
								_in: scfs.map((item: any) => item?.scf_name),
							},
						}
						: {}),
				},
			},
			fields: `id scf_name scf_dir scf_code parameters returns description`,
		});
	};
	public removeScf = ({ scf_dir = "/", scfs = [] }): any => {
		return this.mutation({
			name: "delete_ez_scf",
			args: {
				where: {
					scf_dir: {
						_like: `${scf_dir || "/"}%`,
					},
					...(scfs.length
						? {
							scf_name: {
								_in: scfs.map((item: any) => item?.scf_name),
							},
						}
						: {}),
				},
			},
			fields: [
				"affected_rows",
				{
					name: "returning",
					fields: `id scf_name scf_dir scf_code parameters returns description`,
				},
			],
		});
	};

	public developerLogin = ({ username = "", password = "" }): any => {
		const [developer] = this.query({
			name: "developer",
			args: {
				where: {
					username: {
						_eq: username || "",
					},
					password: {
						_eq: this.md5(password || ""),
					},
				},
				limit: 1,
			},
			fields: `id username permission`,
		});
		if (!developer) {
			throw new Error("No developer found.");
		}
		const expires_in = new Date().getTime() + 1000 * 60 * 60 * 24 * 30;
		return {
			username: developer.username,
			developer_token: this.genJwtToken({
				id: developer.id,
				expires_in,
			}),
			expires_in,
		};
	};

	private developerAuth(developer_token: string, scfName: string) {
		if (!developer_token) {
			return false;
		}
		// 查询开发者信息
		const developerPk = this.parseJwtToken(developer_token)?.id;
		if (!developerPk) {
			return false;
		}

		// 查询开发者权限
		const [developer] = this.query({
			name: "developer",
			args: {
				where: {
					id: {
						_eq: developerPk,
					},
				},
				limit: 1,
			},
			fields: `id permission`,
		});
		if (
			Array.isArray(developer?.permission?.forbidden) &&
			developer?.permission?.forbidden?.length > 0 &&
			developer?.permission?.forbidden?.includes(scfName)
		) {
			return false;
		}
		if (
			Array.isArray(developer?.permission?.allowed) &&
			(developer?.permission?.allowed?.includes("*") || developer?.permission?.allowed?.includes(scfName))
		) {
			return true;
		}
		if (
			Array.isArray(developer?.permission?.allowed) &&
			!developer?.permission?.allowed?.includes(scfName)
		) {
			return false;
		}
		return true;
	}

	// 获取云函数
	private getScfInit(scf_name?: string, scf_dir?: string) {
		const scfName = scf_name || "";
		const scfDir = scf_dir || ".";

		this.parentLogsId = this.request?.clientinfo?.LogsId || null;

		// 如果scfName正好是系统预设的scf_name，则直接返回固定的scf
		if (
			[
				"runGql",
				"operate",
				"query",
				"mutation",
				"callActionflow",
				"runActionflowCode",
				"runScfCode",
				"pushScf",
				"pullScf",
				"removeScf",
				"developerLogin",
				"fetchApi",
				"uploadMedia",
				"find",
				"aggregate",
				"queryGetFirstOne",
				"mutationGetFirstOne",
			].includes(scfName) &&
			scfDir === "."
		) {
			this.scf.scf_name = scfName;
			this.scf.scf_dir = scfDir;
			this.scf.description = `system scf ${scfName}`;
			this.scf.scf_fn = () => {
				try {
					// 如果没有开发者权限，则直接返回错误
					if (
						scfName != "developerLogin" &&
						this.system?.is_developer_auth &&
						!this.developerAuth(
							this.request?.clientinfo?.developer_token,
							scfName
						)
					) {
						throw new Error("No permission to execute this scf.");
					}

					if (scfName == "runScfCode") {
						this.response = this[scfName](this.request?.payload);
					} else if (
						scfName == "operate" ||
						scfName == "query" ||
						scfName == "mutation" ||
						scfName == "runGql" ||
						scfName == "pushScf" ||
						scfName == "pullScf" ||
						scfName == "removeScf" ||
						scfName == "callActionflow" ||
						scfName == "runActionflowCode" ||
						scfName == "developerLogin" ||
						scfName == "fetchApi" ||
						scfName == "uploadMedia" ||
						scfName == "find" ||
						scfName == "aggregate" ||
						scfName == "queryGetFirstOne" ||
						scfName == "mutationGetFirstOne"
					) {
						const data = this[scfName](this.request?.payload);
						this.response = {
							code: 0,
							msg: "success",
							data,
						};
					}
				} catch (error: any) {
					this.response = {
						code: -1,
						msg: error?.message || `ERROR:EXCUTE,【${scfDir}】【${scfName}】`,
						data: {
							info: { ...error?.info, _stack: error?.stack },
						},
					};
				}
				return this.response;
			};
			return this.scf;
		}

		try {
			// 从云端查询云函数
			const [scf] = this.query({
				name: "ez_scf",
				args: {
					where: {
						scf_name: {
							_eq: scfName,
						},
						scf_dir: {
							_eq: scfDir,
						},
					},
					limit: 1,
				},
				fields: `id scf_dir scf_name description scf_code parameters returns `,
			});
			this.scf = scf;
		} catch (error) {
			this._errors.unshift(error);
		}

		if (!this.scf?.scf_name) {
			this.response = {
				code: -1,
				msg: `【${scfDir}】【${scfName}】,scf not found`,
			};
		}
		return this.scf;
	}

	// 执行Graphql
	public runGql = (Input: RunGqlInput) => {
		const { gql, variables = {}, onMessage } = Input;
		try {
			return context.runGql(undefined, gql, variables, {
				role: "admin",
			});
		} catch (error: any) {
			throw new EzcloudError(
				{ gql, variables },
				error?.message || `graphql=>【${gql}】`
			);
		}
	};

	// 执行成功
	public success = (data: any = {}, msg: string = "success") => {
		if (!this.isStarted) {
			return; // 未启动框架，则直接返回
		}
		throw new EzcloudSuccess({
			code: 0,
			msg,
			data,
		});
	};

	// 执行失败
	public fail = (data: any = {}, msg: string = "fail", code: number = -1) => {
		if (!this.isStarted) {
			return; // 未启动框架，则直接返回
		}
		let _msg = msg || "fail";
		if (typeof msg != "string") {
			_msg = JSON.stringify(msg);
		}

		if (typeof code != "number") {
			throw new Error("The 'code' should be a number.");
		}

		if (code == 0) {
			throw new Error(
				`The 'code' should not be set to 0 in the 'fail' method.`
			);
		}
		throw new EzcloudFail({
			code,
			msg,
			data,
		});
	};

	// 框架启动
	public start = () => {
		if (this.isStarted) {
			return; // 只能启动一次
		}
		this.isStarted = true;

		// 获取请求参数;自动处理request
		this.getArg("scf_name");
		this.getArg("scf_dir");
		this.getArg("payload", "payload", {});
		this.getArg("clientinfo", "clientinfo", {});
		this.getArg("fz_callback_body", "callback_body");
		this.getArg("fz_payment_callback_input", "callback_input");

		// 获取系统信息;自动处理system、scf
		this.getSystemInit();
		this.getScfInit(this.request?.scf_name, this.request?.scf_dir);

		// 日志记录请求-记录输入
		if (this.system?.is_logs) {
			try {
				const data = this.mutation({
					name: "insert_ez_logs_one",
					args: {
						object: {
							scf_name: this?.request?.scf_name,
							scf_dir: this?.request?.scf_dir,
							payload: () => "$payload",
							clientinfo: () => "$clientinfo",
							callback_body: () => "$callback_body",
							callback_input: () => "$callback_input",
						},
					},
					fields: [`id`],
					opArgs: {
						$payload: "jsonb",
						$clientinfo: "jsonb",
						$callback_body: "jsonb",
						$callback_input: "jsonb",
					},
					variables: {
						payload: this.request.payload || null,
						clientinfo: this.request.clientinfo || null,
						callback_body: this.request.callback_body || null,
						callback_input: this.request.callback_input || null,
					},
				});
				this.LogsId = data?.id;
			} catch (error) {
				this._errors.unshift(error);
			}
		}

		let response = this.response;
		if (typeof this?.scf?.scf_fn == "function") {
			response = this.scf?.scf_fn();
		} else {
			// 前置钩子
			if (this.system?.pre_middelware_code && response?.code === 0) {
				response = this.runScfCode({
					scf_code: this.system?.pre_middelware_code,
				});
			}

			// 执行云函数
			if (this.scf?.scf_code && response?.code === 0) {
				response = this.runScfCode({ scf_code: this.scf?.scf_code });
			}

			// 后置钩子
			if (this.system?.post_middelware_code && response?.code === 0) {
				response = this.runScfCode({
					scf_code: this.system?.post_middelware_code,
				});
			}
		}
		this.response = response;

		// 日志记录请求-更新响应
		if (this.system?.is_logs) {
			try {
				this.mutation({
					name: "update_ez_logs_by_pk",
					args: {
						pk_columns: {
							id: this.LogsId,
						},
						_set: {
							ez_logs_parent_ez_logs: this.parentLogsId,
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
						data:
							typeof this.response?.data == "object"
								? this.response?.data
								: { _data: this.response?.data },
						errors: this._errors,
					},
				});
			} catch (error) {
				this._errors.unshift(error);
			}
		}

		if (this._errors.length > 0) {
			if (!this.response.data) {
				this.response.data = {};
			}
			if (typeof this.response.data == "object") {
				this.response.data._errors = this._errors;
			}
		}
		if (this._clogs.length > 0) {
			if (!this.response.data) {
				this.response.data = {};
			}

			if (typeof this.response.data == "object") {
				this.response.data._clogs = this._clogs;
			}
		}

		// 响应;自动处理response
		this.setReturn(response);
	};
}
/** @public */
export type Directive = {
	name : string;
	args ?: Record<string, any>;
};

/** @public */
export type Field = {
	alias ?: string;
	name : string;
	args ?: Record<string, any>;
	directives ?: Array<Directive>;
	fields ?: Fields;
};

/** @public */
export type Fields = string | Field | Array<Fields>;

/** @public */
export type OperateInput = {
	opMethod ?: "query" | "mutation" | "subscription"; // 1.query 2.mutation 3.subscription
	opName ?: string; // clientQuery_1234546646
	opArgs ?: { [key : string] : any };
	opFields ?: Fields;
	variables ?: { [key : string] : any };
	onInited ?: (data : any) => void;
	onMessage ?: (message : any, error : any) => void;
};

/** @public */
export type OperateResult = {
	gql : string;
	variables : { [key : string] : any };
	response ?: any;
};

/** @public */
export type FindInput = OperateInput & {
	name : string;
	args ?: Record<string, any>;
	page_number ?: number;
	page_size ?: number;
	fields ?: Fields;
	aggregate_fields ?: Fields;
};

/** @public */
export type FindResult = {
	datas : Array<any>;
	aggregate : Record<string, any>;
};

/** @public */
export type RunGqlInput = {
	gql : string;
	variables ?: { [key : string] : any };
	onMessage ?: (message : any, error ?: any) => void;
};

/** @public */
export type QueryInput = OperateInput & {
	name : string;
	args ?: Record<string, any>;
	directives ?: Array<Directive>;
	fields ?: Fields;
};

/** @public */
export type MutationInput = OperateInput & {
	name : string;
	args ?: Record<string, any>;
	directives ?: Array<Directive>;
	fields ?: Fields;
};

/** @public */
export type Aggregate = OperateInput & {
	name : string;
	args ?: Record<string, any>;
	aggregate_fields ?: Fields | "count" | {
		name : "avg";
		fields : Fields
	} | {
		name : "sum";
		fields : Fields
	} | {
		name : "max";
		fields : Fields
	} | {
		name : "min";
		fields : Fields
	} | {
		name : "count";
		args ?: {
			columns : any;
			distinct ?: boolean;
		},
		fields : Fields
	};
};

/** @public */
export type QueryGetFirstOne = QueryInput;

/** @public */
export type MutationGetFirstOne = OperateInput & {
	name : string;
	args ?: Record<string, any>;
	directives ?: Array<Directive>;
	returning_fields ?: Fields;
};
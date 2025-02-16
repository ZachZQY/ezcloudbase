import { RunGqlInput, Fields, OperateResult, OperateInput } from "./types/common";
export default abstract class Core {
    constructor();
    abstract runGql(Input: RunGqlInput): any;
    /**
     * Generates GraphQL fields
     */
    protected genGqlFields(fields: Fields, indent?: string): string;
    /**
     * Generates GraphQL operations
     */
    protected genGql(input: OperateInput): OperateResult;
}

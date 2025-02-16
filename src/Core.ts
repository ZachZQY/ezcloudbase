import {
  RunGqlInput,
  Fields,
  OperateResult,
  OperateInput,
} from "./types/common";

export default abstract class Core {
  constructor() {}
  abstract runGql(Input: RunGqlInput): any;

  /**
   * Generates GraphQL fields
   */
  protected genGqlFields(fields: Fields, indent: string = ""): string {
    if (typeof fields === "undefined" || fields === null) {
      return "";
    } else if (typeof fields === "string") {
      return fields;
    } else if (Array.isArray(fields)) {
      return fields
        .map((field) => this.genGqlFields(field, indent).trim())
        .join("\n" + indent);
    } else if (typeof fields === "object") {
      let fieldString: string = "";
      if (fields.alias) {
        fieldString = `${fields.alias}: ${fields.name}`;
      } else {
        fieldString = `${fields.name}`;
      }

      // 处理args.value
      const dealValues = (value: any, isQuotOff?: boolean): string => {
        if (typeof value === "undefined" || value === null) {
          return JSON.stringify(null);
        } else if (typeof value === "string") {
          // TODO: Implement
          return isQuotOff && !/[":{}]/.test(value)
            ? value.toString()
            : JSON.stringify(value);
        } else if (typeof value === "boolean") {
          return value.toString();
        } else if (typeof value === "number") {
          return value.toString();
        } else if (Array.isArray(value)) {
          return `[${value
            .map((item) => dealValues(item, isQuotOff))
            .join(", ")}]`;
        } else if (typeof value === "function") {
          return dealValues(value(), true);
        } else if (typeof value === "object") {
          return `{${Object.entries(value)
            .map(([key, value]) =>
              isQuotOff
                ? `${key}: ${dealValues(value, isQuotOff)}`
                : dealKeyValues(key, value)
            )
            .join(", ")}}`;
        }
        return JSON.stringify(value);
      };

      // 处理args.key
      const dealKeyValues = (key: string, value: any): string => {
        if (key === "__QUOTOFF__" && typeof value === "object") {
          return Object.entries(value)
            .map(([_key, _value]) => `${_key}: ${dealValues(_value, true)}`)
            .join(", ");
        }
        return `${key}: ${dealValues(value)}`;
      };

      if (fields.args && Object.keys(fields.args).length > 0) {
        fieldString += `(${Object.entries(fields.args)
          .map(([key, value]) => dealKeyValues(key, value))
          .join(", ")})`;
      }

      if (fields.directives && fields.directives.length > 0) {
        fieldString += ` ${fields.directives
          .map(
            (directive) =>
              `@${directive.name}${
                directive.args && Object.keys(directive.args).length > 0
                  ? `(${Object.entries(directive.args)
                      .map(([key, value]) => dealKeyValues(key, value))
                      .join(", ")})`
                  : ""
              }`
          )
          .join(" ")}`;
      }

      if (fields.fields) {
        fieldString += ` {\n${indent + "  "}${this.genGqlFields(
          fields.fields,
          indent + "  "
        )}\n${indent}}`;
      }
      return fieldString;
    } else {
      throw new Error("Invalid fields");
    }
  }

  /**
   * Generates GraphQL operations
   */
  protected genGql(input: OperateInput): OperateResult {
    const {
      opMethod = "query",
      opName = "ClientGenGql",
      opArgs = {},
      opFields = "__typename",
      variables = {},
    } = input;

    const gql = `${opMethod} ${opName}${
      opArgs && Object.keys(opArgs).length > 0
        ? `(${Object.entries(opArgs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")})`
        : ""
    } {\n ${this.genGqlFields(opFields, "  ")}\n}`;

    const usedVariables: { [key: string]: any } = {};
    Object.entries(opArgs).forEach(([key, value]) => {
      if (!key.startsWith("$")) {
        throw new Error(`Invalid opArgs.${key}, should start with $`);
      }
      usedVariables[key.slice(1)] = variables[key.slice(1)];
    });

    return {
      gql,
      // 从variables中提取出opArgs使用过的变量
      variables: usedVariables,
    };
  }
}

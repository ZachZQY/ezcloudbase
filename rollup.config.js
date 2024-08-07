import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
export default [
  // 客户端打包
  {
    input: "src/client/index.ts",
    output: [
      {
        file: "dist/client/index.mjs",
        format: "es", // 输出的模块格式
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
      },
      {
        file: "dist/client/index.cjs",
        format: "cjs", // 输出的模块格式
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }), // 使用TypeScript插件
      //terser(),
    ],
    external: ["crypto-js", "node-fetch"],
  },

  // 行为流打包
  {
    input: "src/actionflow/index.ts",
    output: [
      {
        file: "dist/actionflow/EzCloudBase.umd.js",
        format: "umd", // 输出的模块格式
        name: "EzCloudBase", // UMD 模块的名称
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
        globals: {
          context: "context",
        },
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }), // 使用TypeScript插件
      //terser(),
    ],
    external: ["context"],
  },
];

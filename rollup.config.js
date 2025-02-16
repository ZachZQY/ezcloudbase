import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
export default [
  // 客户端ezcloudbase打包
  {
    input: "src/client/index.ts",
    output: [
      {
        file: "dist/ezcloudbase.mjs",
        format: "es", // 输出的模块格式
        exports: "named",
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
      },
      {
        file: "dist/ezcloudbase.cjs",
        format: "cjs", // 输出的模块格式
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
        exports: "named",
      },
      {
        file: "dist/ezcloudbase.umd.js",
        format: "umd", // 输出的模块格式
        name: "ezcloudbase",
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
        exports: "named",
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.client.json",
      }), // 使用TypeScript插件
      terser(),
    ],
  },

  // 行为流ezcloud打包
  {
    input: "src/actionflow/index.ts",
    output: [
      {
        file: "dist/ezcloud.umd.js",
        format: "umd", // 输出的模块格式
        name: "ezcloud", // UMD 模块的名称
        sourcemap: true, // 设置sourcemap为true以生成源映射文件
        banner: '//# sourceURL=__ezcloud__\n', // 在文件开头添加注释
        globals: {
          context: "context",
        },
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.actionflow.json",
      }), // 使用TypeScript插件
      terser({
        output: {
          comments: /^# sourceURL=__ezcloud__/, // Preserve comments that match this pattern
        },
      }),
    ],
    external: ["context"],
  },
];

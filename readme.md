## 开始使用

### 安装

```bash
npm i ezcloudbase
```

### 引入

```javascript
import EzCloudBase from "ezcloudbase";
const { ezclient } = new EzCloudBase({
  project_id: "4GBJjlEqVBm", //项目ID
  project_type: "functorz", //项目类型 1.functorz 2.momen
});
```

### 接口

- `ezclient.runGql` 执行 graphql
- `ezclient.operate` 操作 graphql 接口
- `ezclient.query` graphql 接口查询操作
- `ezclient.mutation` graphql 接口变更操作

### 示例

```javascript
// 执行graphql-查询id为1的用户信息
ezclient
  .runGql({
    gql: `
    query userQuery($id:bigint){
      userAlias:user(where:{id:{_eq:$id}}) {
        id
        name
      }
    }
    `,
    variables: {},
  })
  .then((res) => {
    console.log(res);
  });

// 操作graphql接口-查询id为1的用户信息
ezclient
  .operate({
    opMethod: "query",  // 操作方法 1.query 2.mutation 3.subscription
    opName: "userQuery", // 操作名称
    opArgs: {
      $id:"bigint"
    }, // 变量定义，key为变量名，value为变量类型
    opFields: { //查询哪些字段
      alias: "userAlias",//字段别名
      name:"user"，// 字段名
      directives: [],// 指令，如：[{ name: "include", args: { if: true } }]
      args: { 
        where:{ id:{_eq:()=>"$id"} }, // 过滤条件,去引号的方式：1.使用函数如：{id:()=>"$id"} 2.使用标记包裹如：{__QUOTOFF__:{id:"$id"}}__QUOTON__}
        order_by:

        order_by:
        order_by:{
          name:()=>"desc_nulls_last" //按名字倒叙排序
        },
        limit:10,//限制返回条数
        offset:0,//偏移量
      },//字段参数
      fields: ["id", "name"],//字段下级子字段
    },
    variables: {},// 变量数据
    onInited:({gql,viriables})=>{
      console.log(gql,viriables)//初始化后返回gql和变量数据
    }
  })
  .then((res) => {
    console.log(res);
  });

// 查询graphql接口-查询id为1的用户信息   1.${表名}   2.${表名}_by_pk  
ezclient
  .query({
    name:"user",
    args:{
      where:{id:{_eq:1}}
    },
    fields:["id","name"],
    onInited:({gql,viriables})=>{
      console.log(gql,viriables) //初始化后返回gql和变量数据
    }
  })
  .then((res) => {
    console.log(res);
  });

// 变更graphql接口-更新id为1的用户信息

// 新增用户：  1.insert_${表名}   2.insert_${表名}_one
ezclient
  .mutation({
    name:"insert_user",
    args:{
      objects:[{ name:"张三"},{name:"李四"}]//要新增的用户数据
    },
    fields:["id","name"],
    onInited:({gql,viriables})=>{
      console.log(gql,viriables) //初始化后返回gql和变量数据
    }
  })
  .then((res) => {
    console.log(res);
  });


// 修改用户：  1.update_${表名}  2.update__${表名}_by_pk
ezclient
  .mutation({
    name:"update_user",
    args:{
      // 过滤名字等于张三的数据
      where:{
        name:{
          _eq:"张三"
        }
      },

      // 更新名字为张三三
      _set:{
        name:"张三三"
      }
    },
    fields:["id","name"],// 返回要查询的字段信息
    onInited:({gql,viriables})=>{
      console.log(gql,viriables) //初始化后返回gql和变量数据
    }
  })
  .then((res) => {
    console.log(res);
  });


// 删除用户：  1.delete_${表名} 2.delete_${表名}_by_id
ezclient
  .mutation({
    name:"delete_user",
    args:{
      // 删除名字等于李四的数据
      where:{
        name:{
          _eq:"李四"
        }
      },
    },
    fields:["id","name"],// 返回要查询的字段信息
    onInited:({gql,viriables})=>{
      console.log(gql,viriables) //初始化后返回gql和变量数据
    }
  })
  .then((res) => {
    console.log(res);
  });
```

### API

#### `ezclient.runGql`
- `gql` graphql 查询语句
- `variables` 变量数据

#### `ezclient.operate`
- `opMethod` 操作方法 1.query 2.mutation 3.subscription
- `opName` 操作名称
- `opArgs` 变量定义，key为变量名，value为变量类型
- `opFields` 查询哪些字段
  - `alias` 字段别名
  - `name` 字段名
  - `directives` 指令，如：
  - `args` 字段参数
  - `fields` 字段下级子字段
- `variables` 变量数据
- `onInited` 初始化后回调函数

#### `ezclient.query`
- `opMethod` 操作方法固定为query
- `opName` 操作名称
- `opArgs` 变量定义，key为变量名，value为变量类型
- `variables` 变量数据
- `directives` 指令，如：[{ name: "include", args: { if: true } }]
- `name` 查询名称
- `args` 查询参数
- `fields` 查询字段
- `onInited` 初始化后回调函数

#### `ezclient.mutation`
- `opMethod` 操作方法固定为mutation
- `opName` 操作名称
- `opArgs` 变量定义，key为变量名，value为变量类型
- `variables` 变量数据
- `directives` 指令，如：[{ name: "include", args: { if: true } }]
- `name` 查询名称
- `args` 查询参数
- `fields` 查询字段
- `onInited` 初始化后回调函数


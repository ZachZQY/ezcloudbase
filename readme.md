# ezcloudbase 客户端使用文档

ezcloudbase 是一个基于函子后端的云开发框架,提供了完整的云开发接口。它提供了两种使用方式:

1. EzClient - 直接操作数据库,适用于:
   - 需要直接操作数据库的场景
   - 简单的CRUD操作
   - 文件上传等基础功能

2. EzServer - 调用云函数,适用于:
   - 需要复杂业务逻辑的场景
   - 需要权限控制的场景
   - 需要调用第三方服务的场景

## 1. 快速开始

### 1.1 安装

```bash
npm install ezcloudbase
```

### 1.2 使用 EzClient

```typescript
import { EzClient } from 'ezcloudbase';

// 1. 创建客户端实例
const client = new EzClient({
  endpoint_url: "https://zion-app.functorz.com/zero/{project_id}/api/graphql-v2"
});

// 2. 查询数据
async function getUsers() {
  const users = await client.query({
    name: "user",
    fields: ["id", "name", "age"]
  });
  console.log(users);
}

// 3. 新增数据
async function createUser() {
  const user = await client.mutation({
    name: "insert_user_one",
    args: {
      object: {
        name: "张三",
        age: 20
      }
    },
    fields: ["id", "name"]
  });
  console.log(user);
}

// 4. 文件上传
async function uploadImage(file: File) {
  const result = await client.uploadImage(file, {
    onReady: (info) => {
      console.log("准备上传:", info);
    }
  });
  console.log("下载地址:", result.downloadUrl);
}
```

### 1.3 使用 EzServer

```typescript
import { EzServer } from 'ezcloudbase';

// 1. 创建服务端实例
const server = new EzServer({
  endpoint_url: "https://zion-app.functorz.com/zero/{project_id}/api/graphql-v2",
  af_id: "your-action-flow-id"  // ezcloud框架ID
});

// 2. 设置客户端信息
server.setClientinfo({
  user_id: 1,
  token: "xxx"
});

// 3. 调用云函数
async function getUserInfo(userId: number) {
  const result = await server.callScf({
    scf_name: "getUserInfo",
    payload: {
      userId
    }
  });

  if (result.code === 0) {
    console.log(result.data);
  } else {
    console.error(result.msg);
  }
}

// 4. 开发环境 - 上传云函数
async function deployFunction() {
  const result = await server.pushScf({
    scf_dir: "/user",
    scfs: [{
      scf_name: "getUserInfo",
      scf_code: `
        const userId = ezcloud.getPayload().userId;
        const user = ezcloud.queryGetFirstOne({
          name: "user",
          args: { where: { id: { _eq: userId } } },
          fields: ["id", "name", "age"]
        });
        ezcloud.success(user);
      `,
      description: "获取用户信息"
    }]
  });
  console.log(result);
}
```

## 2. EzClient 使用

### 2.1 接口定义

```typescript
interface EzClientConfig {
  endpoint_url: string;      // GraphQL端点URL
  headers?: Record<string, any>;  // 请求头
}

class EzClient {
  // 配置相关
  setConfig(config: EzClientConfig, isOverride?: boolean): void;
  getConfig(): {
    endpoint_url: string;
    headers: Record<string, any>;
    project_id: string;
    project_type: string;
  };
  setHeaders(headers: Record<string, any>, isOverride?: boolean): void;
  getHeaders(): Record<string, any>;

  // 数据操作
  runGql(input: RunGqlInput): Promise<any>;
  operate(input: OperateInput): Promise<OperateResult>;
  query(input: QueryInput): Promise<any>;
  find(input: FindInput): Promise<FindResult>;
  mutation(input: MutationInput): Promise<any>;
  queryGetFirstOne(input: QueryGetFirstOne): Promise<any>;
  mutationGetFirstOne(input: MutationGetFirstOne): Promise<any>;

  // 文件上传
  uploadImage(file: FileInput, options?: UploadInput): Promise<UploadResult>;
  uploadFile(file: FileInput, options?: UploadInput): Promise<UploadResult>;
  uploadVideo(file: FileInput, options?: UploadInput): Promise<UploadResult>;
}
```

### 2.2 EzClient 使用案例

#### 2.2.1 基础查询操作

```typescript
// 1. 简单查询
const users = await client.query({
  name: "user",
  fields: ["id", "name", "age"]
});

// 2. 条件查询
const activeUsers = await client.query({
  name: "user",
  args: {
    where: {
      status: { _eq: "active" },
      age: { _gt: 18 }
    },
    order_by: {
      created_at: () => "desc"  // 使用函数去除引号
    },
    limit: 10
  },
  fields: ["id", "name", "age"]
});

// 3. 关联查询
const orders = await client.query({
  name: "order",
  args: {
    where: {
      status: { _eq: "paid" }
    }
  },
  fields: [
    "id", 
    "amount",
    {
      name: "user",  // 关联用户表
      fields: ["id", "name"]
    },
    {
      name: "order_items",  // 关联订单项表
      fields: [
        "quantity",
        {
          name: "product",  // 关联商品表
          fields: ["id", "name", "price"]
        }
      ]
    }
  ]
});

// 4. 分页查询
const { datas, aggregate } = await client.find({
  name: "user",
  page_number: 1,
  page_size: 10,
  args: {
    where: {
      status: { _eq: "active" }
    }
  },
  fields: ["id", "name"],
  aggregate_fields: [
    "count",
    {
      name: "sum",
      fields: ["balance"]
    },
    {
      name: "avg",
      fields: ["age"]
    }
  ]
});

console.log("总数:", aggregate.count);
console.log("余额总和:", aggregate.sum.balance);
console.log("平均年龄:", aggregate.avg.age);
```

#### 2.2.2 数据修改操作

```typescript
// 1. 新增单条数据
const newUser = await client.mutationGetFirstOne({
  name: "insert_user",
  args: {
    object: {
      name: "张三",
      age: 20,
      status: "active"
    }
  },
  returning_fields: ["id", "name"]
});

// 2. 批量新增数据
const result = await client.mutation({
  name: "insert_user",
  args: {
    objects: [
      { name: "张三", age: 20 },
      { name: "李四", age: 21 }
    ]
  },
  fields: [
    {
      name: "returning",
      fields: ["id", "name"]
    },
    "affected_rows"
  ]
});

// 3. 更新数据
const updated = await client.mutation({
  name: "update_user",
  args: {
    where: {
      age: { _lt: 18 }
    },
    _set: {
      status: "inactive"
    }
  },
  fields: ["affected_rows"]
});

// 4. 删除数据
const deleted = await client.mutation({
  name: "delete_user",
  args: {
    where: {
      status: { _eq: "inactive" }
    }
  },
  fields: ["affected_rows"]
});
```

#### 2.2.3 文件上传

```typescript
// 1. 上传图片
const imageResult = await client.uploadImage(imageFile, {
  onReady: (info) => {
    console.log("图片上传准备就绪:", info);
  }
});

// 2. 上传文件
const fileResult = await client.uploadFile(docFile, {
  onReady: (info) => {
    console.log("文件上传准备就绪:", info);
  }
});

// 3. 上传视频
const videoResult = await client.uploadVideo(videoFile, {
  onReady: (info) => {
    console.log("视频上传准备就绪:", info);
  }
});

// 4. 保存上传记录
await client.mutation({
  name: "insert_upload_log",
  args: {
    object: {
      file_name: imageResult.fileName,
      file_url: imageResult.downloadUrl,
      file_size: imageResult.fileSize,
      file_type: "image"
    }
  }
});
```

#### 2.2.4 高级用法

```typescript
// 1. 使用变量
const result = await client.query({
  name: "user",
  args: {
    where: {
      id: { _eq: () => "$id" }  // 使用函数声明变量
    }
  },
  opArgs: {
    $id: "Int!"  // 定义变量类型
  },
  variables: {
    id: 1  // 传入变量值
  },
  fields: ["id", "name"]
});

// 2. 使用指令
const result = await client.query({
  name: "user",
  directives: [
    {
      name: "include",
      args: {
        if: true
      }
    }
  ],
  fields: ["id", "name"]
});

// 3. 事务处理
const result = await client.operate({
  opMethod: "mutation",
  opFields: [
    {
      name: "update_user",
      args: {
        where: { id: { _eq: 1 } },
        _set: { balance: 0 }
      }
    },
    {
      name: "insert_transaction",
      args: {
        object: {
          user_id: 1,
          amount: -100,
          type: "withdraw"
        }
      }
    }
  ]
});

// 4. 自定义GraphQL查询
const result = await client.runGql({
  gql: `
    query getUser($id: Int!) {
      user_by_pk(id: $id) {
        id
        name
        orders_aggregate {
          aggregate {
            count
            sum {
              amount
            }
          }
        }
      }
    }
  `,
  variables: {
    id: 1
  }
});
```

## 3. EzServer 使用

### 3.1 接口定义

```typescript
interface EzServerConfig extends EzClientConfig {
  af_id: string;            // ezcloud框架ID
  clientinfo?: Record<string, any>;  // 客户端信息
}

class EzServer extends EzClient {
  // 配置相关
  setClientinfo(clientinfo: Record<string, any>, isOverride?: boolean): void;
  getClientinfo(): Record<string, any>;

  // 云函数调用
  callScf(input: {
    scf_dir?: string;
    scf_name: string;
    payload?: any;
  }): Promise<{
    code: number;
    msg: string;
    data: any;
  }>;

  // 开发相关
  developerLogin(input: {
    username: string;
    password: string;
  }): Promise<{
    username: string;
    developer_token: string;
    expires_in: number;
  }>;

  pushScf(input: {
    scf_dir: string;
    isOverwrite?: boolean;
    scfs: Array<{
      scf_name: string;
      scf_code: string;
      parameters?: Record<string, any>;
      returns?: Record<string, any>;
      description?: string;
    }>;
  }): Promise<any>;

  // 其他接口
  fetchApi(input: {
    url: string;
    method?: string;
    data?: any;
    headers?: Record<string, any>;
  }): Promise<any>;

  runActionflowCode(input: {
    jsCode: string;
    args?: any;
    updateDb?: boolean;
  }): Promise<any>;

  callActionflow(input: {
    actionFlowId: string;
    versionId?: number;
    args?: any;
  }): Promise<any>;
}
```

### 3.2 EzServer 使用案例

#### 3.2.1 基础云函数调用

```typescript
// 1. 初始化服务端实例
const server = new EzServer({
  endpoint_url: "https://zion-app.functorz.com/zero/{project_id}/api/graphql-v2",
  af_id: "your-action-flow-id"
});

// 2. 设置客户端信息(如token)
server.setClientinfo({
  user_id: 1,
  token: "your-jwt-token"
});

// 3. 调用根目录云函数
const result = await server.callScf({
  scf_dir: "/",  // 根目录使用单斜线
  scf_name: "getSystemInfo",
  payload: {
    type: "basic"
  }
});

// 4. 调用子目录云函数
const userResult = await server.callScf({
  scf_dir: "/user/",  // 子目录使用两个斜线
  scf_name: "getProfile",
  payload: {
    fields: ["basic", "extra"]
  }
});

// 5. 错误处理
try {
  const result = await server.callScf({
    scf_dir: "/order/",
    scf_name: "create",
    payload: {
      product_id: 1,
      quantity: 2
    }
  });

  if (result.code === 0) {
    return result.data;
  } else {
    throw new Error(result.msg);
  }
} catch (error) {
  console.error("调用失败:", error);
}
```

#### 3.2.2 用户认证示例

```typescript
// 登录流程
async function login(username: string, password: string) {
  const result = await server.callScf({
    scf_dir: "/auth/",
    scf_name: "login",
    payload: {
      username,
      password
    }
  });

  if (result.code === 0) {
    // 登录成功后设置token等信息
    server.setClientinfo({
      user_id: result.data.user_id,
      token: result.data.token,
      role: result.data.role
    });
    return result.data;
  }
  throw new Error(result.msg);
}

// 退出登录
async function logout() {
  const result = await server.callScf({
    scf_dir: "/auth/",
    scf_name: "logout"
  });
  
  if (result.code === 0) {
    // 清除客户端信息
    server.setClientinfo({}, true);
  }
  return result;
}
```

#### 3.2.3 开发环境使用

```typescript
// 1. 开发者登录
const loginResult = await server.developerLogin({
  username: "admin",
  password: "123456"
});

// 登录成功后自动设置了developer_token
console.log("Token过期时间:", loginResult.expires_in);

// 2. 上传云函数
const pushResult = await server.pushScf({
  scf_dir: "/user/",  // 注意目录格式
  isOverwrite: true,
  scfs: [
    {
      scf_name: "getProfile",
      scf_code: `
        const { user_id } = ezcloud.getClientinfo();
        
        const user = ezcloud.queryGetFirstOne({
          name: "user",
          args: { where: { id: { _eq: user_id } } },
          fields: ["id", "name", "age", "avatar"]
        });

        if (!user) {
          ezcloud.fail("用户不存在");
        }

        ezcloud.success(user);
      `,
      parameters: {
        type: "object",
        properties: {}  // 从clientinfo获取user_id，无需参数
      },
      returns: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          age: { type: "number" },
          avatar: { type: "string" }
        }
      },
      description: "获取当前用户信息"
    }
  ]
});

// 3. 拉取云函数
const pullResult = await server.pullScf({
  scf_dir: "/user/",
  scfs: [
    { scf_name: "getProfile" }
  ]
});

// 4. 删除云函数
const removeResult = await server.removeScf({
  scf_dir: "/user/",
  scfs: [
    { scf_name: "deprecatedFunction" }
  ]
});
```

#### 3.2.4 完整业务示例

```typescript
// 订单创建流程
class OrderService {
  private server: EzServer;

  constructor() {
    this.server = new EzServer({
      endpoint_url: "https://zion-app.functorz.com/zero/{project_id}/api/graphql-v2",
      af_id: "your-action-flow-id"
    });
  }

  // 设置用户认证信息
  setAuth(token: string, userId: number) {
    this.server.setClientinfo({
      token,
      user_id: userId
    });
  }

  // 创建订单
  async createOrder(productId: number, quantity: number) {
    const result = await this.server.callScf({
      scf_dir: "/order/",
      scf_name: "create",
      payload: {
        product_id: productId,
        quantity
      }
    });

    if (result.code === 0) {
      return result.data;
    }
    throw new Error(result.msg);
  }

  // 支付订单
  async payOrder(orderId: string, paymentMethod: string) {
    const result = await this.server.callScf({
      scf_dir: "/order/",
      scf_name: "pay",
      payload: {
        order_id: orderId,
        payment_method: paymentMethod
      }
    });

    if (result.code === 0) {
      return result.data;
    }
    throw new Error(result.msg);
  }
}

// 使用示例
const orderService = new OrderService();

// 设置认证信息
orderService.setAuth("user-token", 1);

// 创建并支付订单
async function purchaseProduct(productId: number, quantity: number) {
  // 1. 创建订单
  const order = await orderService.createOrder(productId, quantity);
  
  // 2. 支付订单
  const payment = await orderService.payOrder(order.id, "wechat");
  
  return payment;
}
```

## 4. ezcloud 行为流框架

ezcloud 是函子（原Zion）项目中的行为流框架，用于处理云函数的执行。EzServer 的所有云函数调用都是通过 ezcloud 行为流来处理的。

### 4.1 行为流配置流程

1. 登录函子平台，创建新的行为流
2. 行为流名称设置为 "ezcloud"
3. 配置入参节点：
```typescript
{
  scf_dir: string;    // 云函数目录
  scf_name: string;   // 云函数名称
  payload: JSONB;     // 函数参数
  clientinfo: JSONB;  // 客户端信息，JSONB类型
}
```

4. 配置出参节点：
```typescript
{
  code: Integer;      // 返回码，0表示成功
  msg: string;        // 返回信息
  data: JSONB;        // 返回数据
}
```

5. 添加代码块节点，将 `dist/ezcloud.umd.js` 的内容复制到代码块中

6. 配置数据模型：
```sql
-- 系统配置表
CREATE TABLE ez_system (
  id INT PRIMARY KEY,
  idx INT,                     -- 排序，最大值为默认配置
  name STRING,                 -- 系统名称
  is_logs BOOLEAN,            -- 是否启用日志
  is_developer_auth BOOLEAN,  -- 是否启用开发者鉴权
  pre_middelware_code TEXT,   -- 前置中间件代码
  post_middelware_code TEXT,  -- 后置中间件代码
  global_config JSONB,        -- 全局配置
  af_id STRING,               -- 行为流ID
  thirdapi_id STRING          -- 第三方API配置ID
);

-- 云函数表
CREATE TABLE ez_scf (
  id INT PRIMARY KEY,
  scf_dir STRING,      -- 云函数目录
  scf_name STRING,     -- 云函数名称
  description TEXT,    -- 功能描述
  scf_code TEXT,       -- 云函数代码
  parameters JSONB,    -- 入参定义
  returns JSONB        -- 返回值定义
);

-- 日志表
CREATE TABLE ez_logs (
  id INT PRIMARY KEY,
  ez_logs_parent_ez_logs INT,  -- 父日志ID
  scf_dir STRING,              -- 云函数目录
  scf_name STRING,             -- 云函数名称
  payload JSONB,               -- 入参
  clientinfo JSONB,            -- 客户端信息
  code INT,                    -- 状态码
  msg STRING,                  -- 提示信息
  data JSONB,                  -- 返回数据
  errors JSONB                 -- 错误记录
);

-- 开发者表
CREATE TABLE ez_developer (
  id INT PRIMARY KEY,
  username STRING,     -- 用户名
  password STRING,     -- 密码 MD5
  permission JSONB     -- 接口权限列表如:{forbidden:["runGql"],allowed:["query"]}
);

-- 第三方API配置表
CREATE TABLE ez_thirdapi (
  id INT PRIMARY KEY,
  thirdapi_name STRING,  -- 接口名称
  url STRING,           -- 接口 url，http 开头或者 thirdapi_id
  method STRING         -- 请求方法
);

-- 初始化系统配置
INSERT INTO ez_system (
  id,
  idx,
  name,
  is_logs,
  is_developer_auth,
  global_config,
  af_id
) VALUES (
  1,
  999,
  'default',
  true,
  true,
  '{"jwt_secret": "your-jwt-secret"}',
  'your-action-flow-id'
);

-- 初始化开发者账号
INSERT INTO ez_developer (
  id,
  username,
  password,
  permission
) VALUES (
  1,
  'admin',
  '21232f297a57a5a743894a0e4a801fc3',  -- 密码: admin
  '{"forbidden":[],"allowed":["*"]}'     -- 允许所有操作
);
```

### 4.2 示例配置

```javascript
// 入参示例
{
  "scf_dir": "/user",
  "scf_name": "getProfile",
  "payload": {
    "fields": ["basic", "extra"]
  },
  "clientinfo": {
    "user_id": 1,
    "token": "xxx",
    "role": "admin",
    "permissions": ["read", "write"],
    "meta": {
      "device": "ios",
      "version": "1.0.0"
    }
  }
}

// 出参示例
// 成功情况
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "张三",
    "age": 20
  }
}

// 失败情况
{
  "code": 1001,
  "msg": "用户未登录",
  "data": null
}
```

注意：clientinfo 为 JSONB 类型，可以存储任意合法的 JSON 数据，包括嵌套对象、数组等。

### 4.3 ezcloud 接口定义

```typescript
interface EzCloud {
  // 请求相关
  getRequest(): {
    scf_dir: string;     // 云函数目录
    scf_name: string;    // 云函数名称
    payload?: any;       // 函数参数
    clientinfo?: any;    // 客户端信息
  };
  getPayload(): any;     // 获取函数参数
  getClientinfo(): any;  // 获取客户端信息

  // 响应相关
  /**
   * 执行失败响应
   * @param data 返回数据
   * @param msg 错误信息,默认为"fail" 
   * @param code 错误码,不能为0,默认为-1
   */
  fail(data?: any, msg?: string, code?: number): void;

  /**
   * 执行成功响应
   * @param data 返回数据
   * @param msg 成功信息,默认为"success"
   */
  success(data?: any, msg?: string): void;

  // 数据库操作
  query<T = any>(input: {
    name: string;                // 表名
    args?: {                     // 查询参数
      where?: Record<string, any>;    // 条件
      order_by?: Record<string, any>; // 排序
      limit?: number;                 // 限制
      offset?: number;                // 偏移
    };
    fields: Array<string | {     // 查询字段
      name: string;
      fields: string[];
    }>;
  }): Promise<T[]>;

  queryGetFirstOne<T = any>(input: {
    name: string;
    args?: Record<string, any>;
    fields: string[];
  }): Promise<T>;

  mutation<T = any>(input: {
    name: string;                // 操作名称
    args: {                      // 操作参数
      where?: Record<string, any>;    // 条件
      _set?: Record<string, any>;     // 更新值
      object?: Record<string, any>;   // 插入对象
      objects?: Record<string, any>[]; // 批量插入
    };
    fields?: string[];          // 返回字段
  }): Promise<T>;

  mutationGetFirstOne<T = any>(input: {
    name: string;
    args: Record<string, any>;
    returning_fields?: string[];
  }): Promise<T>;

  // 工具函数
  md5(str: string): string;     // MD5加密
  clog(data: any): void;        // 日志记录
  genJwtToken(data: {           // 生成JWT
    user_id: number | string;
    expires_in?: number;
    [key: string]: any;
  }): string;
  parseJwtToken(token: string): {  // 解析JWT
    user_id: number | string;
    expires_in: number;
    [key: string]: any;
  };

  // 三方服务
  fetchApi(input: {             // HTTP请求
    url: string;
    method?: string;
    headers?: Record<string, any>;
    data?: any;
  }): Promise<any>;

  uploadMedia(input: {          // 上传媒体
    url: string;
  }): Promise<{
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  }>;

  callThirdapi(                 // 调用第三方API
    name: string,
    data?: any,
    headers?: Record<string, any>
  ): Promise<any>;
}
```

### 4.4 使用案例

#### 4.4.1 用户认证

```typescript
// /auth/login
const payload = ezcloud.getPayload();
const { username, password } = payload;

// 参数校验
if (!username || !password) {
  ezcloud.fail({ field: "username" }, "用户名和密码不能为空", 1001);
}

// 查询用户
const user = ezcloud.queryGetFirstOne({
  name: "user",
  args: {
    where: {
      username: { _eq: username },
      password: { _eq: ezcloud.md5(password) },
      status: { _eq: "active" }
    }
  },
  fields: ["id", "username", "role", "permissions"]
});

if (!user) {
  ezcloud.fail({ field: "password" }, "用户名或密码错误", 1001);
}

// 生成token
const token = ezcloud.genJwtToken({
  user_id: user.id,
  role: user.role,
  permissions: user.permissions,
  expires_in: Date.now() + 7 * 24 * 60 * 60 * 1000
});

// 记录登录日志
ezcloud.mutation({
  name: "insert_user_login_log",
  args: {
    object: {
      user_id: user.id,
      ip: ezcloud.getClientinfo().ip,
      device: ezcloud.getClientinfo().device
    }
  }
});

ezcloud.success({ token, user });
```

#### 4.4.2 订单处理

```typescript
// /order/create
const payload = ezcloud.getPayload();
const { product_id, quantity } = payload;
const { user_id } = ezcloud.getClientinfo();

// 查询商品
const product = ezcloud.queryGetFirstOne({
  name: "product",
  args: {
    where: { 
      id: { _eq: product_id },
      status: { _eq: "on_sale" }
    }
  },
  fields: ["id", "name", "price", "stock"]
});

if (!product) {
  ezcloud.fail({ product_id }, "商品不存在或已下架", 1001);
}

if (product.stock < quantity) {
  ezcloud.fail({ stock: product.stock }, "库存不足", 1002);
}

// 创建订单(使用事务)
const result = ezcloud.operate({
  opMethod: "mutation",
  opFields: [
    // 1. 创建订单
    {
      name: "insert_order_one",
      args: {
        object: {
          user_id,
          product_id,
          quantity,
          amount: product.price * quantity,
          status: "pending"
        }
      },
      fields: ["id", "amount"]
    },
    // 2. 扣减库存
    {
      name: "update_product",
      args: {
        where: { id: { _eq: product_id } },
        _set: {
          stock: product.stock - quantity
        }
      }
    }
  ]
});

// 调用支付服务
const paymentResult = ezcloud.callThirdapi(
  "payment_service",
  {
    order_id: result.id,
    amount: result.amount
  }
);

ezcloud.success({
  order_id: result.id,
  payment_url: paymentResult.url
});
```

#### 4.4.3 文件处理

```typescript
// /file/upload
const payload = ezcloud.getPayload();
const { file_url, file_type } = payload;
const { user_id } = ezcloud.getClientinfo();

// 上传文件
const uploadResult = ezcloud.uploadMedia({
  url: file_url
});

// 记录文件信息
const file = ezcloud.mutationGetFirstOne({
  name: "insert_file",
  args: {
    object: {
      url: uploadResult.downloadUrl,
      name: uploadResult.fileName,
      size: uploadResult.fileSize,
      type: file_type,
      user_id,
      status: "active",
      created_at: new Date().toISOString()
    }
  },
  returning_fields: ["id", "url", "name"]
});

ezcloud.success(file);
```

### 4.5 函子(Zion)原生接口

ezcloud 支持使用函子平台提供的原生 context 接口：

```typescript
interface context {
  /**
   * 获取输入参数
   * @param inputArgName 参数名称
   */
  getArg(inputArgName: string | "fz_callback_body" | "fz_payment_callback_input"): any;

  /**
   * 上传媒体文件
   * @param url 文件URL
   * @param headers 请求头
   */
  uploadMedia(url: string, headers?: any): any;

  /**
   * 执行 GraphQL 查询
   * @param operationName 操作名称
   * @param gql GraphQL查询语句
   * @param variables 变量
   * @param permission 权限配置
   */
  runGql(
    operationName: string | null | undefined,
    gql: string,
    variables: object,
    permission: { role: string | "admin" }
  ): any;

  /**
   * 调用第三方API
   * @param operationId API标识
   * @param args 请求参数
   */
  callThirdPartyApi(operationId: string, args: object): any;

  /**
   * 调用其他行为流
   * @param actionFlowId 行为流ID
   * @param versionId 版本ID
   * @param args 参数
   */
  callActionFlow(actionFlowId: string, versionId: number | null, args: any): any;

  /**
   * 获取序列下一个值
   * @param seqName 序列名称
   * @param createIfNotExists 不存在时是否创建
   */
  getSeqNextValue(seqName: string, createIfNotExists?: boolean): any;

  /**
   * 重置序列值
   * @param seqName 序列名称
   * @param value 重置的值
   */
  resetSeqValue(seqName: string, value: number): any;

  /**
   * 获取微信小程序访问令牌
   */
  getWechatMiniAppAccessToken(): string;

  /**
   * 发送邮件
   * @param toAddress 收件人
   * @param subject 主题
   * @param fromAlias 发件人别名
   * @param textBody 文本内容
   * @param htmlBody HTML内容
   */
  sendEmail(
    toAddress: string,
    subject: string,
    fromAlias: string,
    textBody: string,
    htmlBody: string
  ): any;

  /**
   * 记录日志
   * @param msg 日志内容
   * @param isError 是否错误日志
   */
  log(msg: string, isError: boolean): any;

  /**
   * 记录错误
   * @param msg 错误信息
   * @param isError 是否错误日志
   */
  error(msg: string, isError: boolean): any;

  /**
   * 抛出异常
   * @param errorType 错误类型
   * @param errorMsg 错误信息
   */
  throwException(errorType: string, errorMsg: string): any;

  /**
   * 计算Token数量
   * @param model 模型名称
   * @param content 内容
   */
  countTokens(model: string, content: string): any;

  /**
   * 聊天补全
   * @param prompt 提示词
   */
  chatCompletion(prompt: string): string;

  /**
   * 直接上传媒体文件
   * @param url 文件URL
   */
  uploadMediaDirectly(url: string): any;

  /**
   * 获取SSO账号ID
   */
  getSsoAccountId(): null | number;

  /**
   * 获取SSO用户信息
   */
  getSsoUserInfo(): any;

  /**
   * 生成RSA签名
   * @param privateKey 私钥
   * @param data 数据
   * @param signatureType 签名类型
   */
  generateRSASignature(
    privateKey: string,
    data: any,
    signatureType: string | "SHA256withRSA"
  ): string;

  /**
   * 验证RSA签名
   * @param publicKey 公钥
   * @param data 数据
   * @param sign 签名
   * @param signatureType 签名类型
   */
  validateRSASignature(
    publicKey: string,
    data: any,
    sign: string,
    signatureType: string | "SHA256withRSA"
  ): any;
}
```

注意事项：
1. context 接口由函子平台提供,可能随平台版本更新而变化
2. 建议优先使用 ezcloud 封装的方法,它们提供了更好的类型提示和错误处理
3. 不要使用 context.setReturn(),请使用 ezcloud.success() 和 ezcloud.fail() 返回结果
4. 所有 context 方法在云函数环境中都是同步的,无需使用 await 

### 4.6 内置工具库

ezcloud 云函数环境中已内置 CryptoJS 对象,可以直接使用：

```typescript
// MD5 加密
const md5Hash = CryptoJS.MD5('message').toString();

// SHA256 加密
const sha256Hash = CryptoJS.SHA256('message').toString();

// AES 加密
const key = CryptoJS.enc.Utf8.parse('encryption key');
const iv = CryptoJS.enc.Utf8.parse('initialization v');

// 加密
const encrypted = CryptoJS.AES.encrypt('message', key, {
  iv: iv,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
}).toString();

// 解密
const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
  iv: iv,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
}).toString(CryptoJS.enc.Utf8);

// Base64 编码/解码
const base64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse('message'));
const text = CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Utf8);

// 使用案例
const user = {
  username: 'admin',
  password: CryptoJS.MD5('admin123').toString()
};

// 加密数据传输
const sensitiveData = {
  cardNo: '6225xxxx',
  cvv: '123'
};

const encryptedData = CryptoJS.AES.encrypt(
  JSON.stringify(sensitiveData),
  key,
  { iv: iv }
).toString();
```

注意事项：
1. 云函数环境中已内置 CryptoJS、context、ezcloud 对象,可以直接使用,无需 import
2. 建议使用统一的加密配置,可以存储在系统配置中
3. 注意保管好加密密钥,不要泄露 
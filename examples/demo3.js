import EzCloudBase from "../dist/client/index.mjs";
const { ezclient } = new EzCloudBase({
  project_id: "4GBJjlEqVBm", //项目ID
  project_type: "functorz", //项目类型 1.functorz 2.momen
});

ezclient
  .operate({
    opMethod: "mutation",
    opName: "insert_ez_logs",
    opFields: {
      name: "insert_ez_logs",
      args: {
        objects: [
          {
            scf_name: "test1",
          },
          {
            scf_name: "test2",
          },
        ],
      },
      fields: [
        {
          name: "returning",
          fields: ["id", "scf_name"],
        },
      ],
    },
  })
  .then((res) => {
    console.log(res);
  });

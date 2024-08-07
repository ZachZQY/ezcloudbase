import EzCloudBase from "../dist/client/index.mjs";
const { ezclient } = new EzCloudBase({
  project_id: "4GBJjlEqVBm", //项目ID
  project_type: "functorz", //项目类型 1.functorz 2.momen
});

ezclient
  .query({
    name: "ez_logs",
    fields: ["id", "scf_name"],
  })
  .then((res) => {
    console.log(res);
  });
// [ { id: 53, scf_name: 'test' }, { id: 54, scf_name: '' } ]
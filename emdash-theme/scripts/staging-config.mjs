import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));

config.name = "joost-blog-emdash-staging";
config.d1_databases = [{ binding: "DB", database_name: "joost-blog-emdash-staging", database_id: "9e5f55cd-5d68-4165-9f72-d923da6181e4" }];
config.r2_buckets = [{ binding: "MEDIA", bucket_name: "joost-blog-media-staging" }];
config.kv_namespaces = [{ binding: "SESSION", id: "ea20d8ae2215446db0681cadb190b49f" }];

writeFileSync("dist/server/wrangler.staging.json", JSON.stringify(config));

// app/api/greeter/route.ts
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { NextRequest } from "next/server";

const PROTO_PATH = path.resolve(
  "/Users/enbraining/Projects/live-translation-service/public/hello_world.proto"
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const greeterPackage = grpcObject.helloworld as any;

const client = new greeterPackage.Greeter(
  process.env.GRPC_SERVER_URL || "localhost:50052",
  grpc.credentials.createInsecure()
);

export async function POST(request: NextRequest) {
  try {
    const buffer = await request.arrayBuffer();
    const audioData = new Uint8Array(buffer);

    const sayHello = (): Promise<{ korean: string; english: string }> =>
      new Promise((resolve, reject) => {
        client.SayHello(
          { audio_data: audioData },
          (err: Error | null, response: any) => {
            if (err) reject(err);
            else resolve(response);
          }
        );
      });

    const response = await sayHello();

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({}), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

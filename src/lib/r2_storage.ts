import { AwsClient } from "aws4fetch";
import { deflate } from "pako";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = "character-avatar"
const R2_URL = `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;


const getR2Client = () => {
  return new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  });
};

export default class FileStorage {
  static head(key: string) {
    return getR2Client().fetch(`${R2_URL}/${key}`, {
      method: "HEAD",
    });
  }

  static async exists(key: string): Promise<boolean> {
    const response = await this.head(key);
    return response.status !== 404;
  }

  static list() {
    return getR2Client().fetch(`${R2_URL}`, {
      method: "GET",
    });
  }


  static async get(key: string) {
    const url = new URL(R2_URL);

    // preserve the original path
    url.pathname = key;

    // Specify a custom expiry for the presigned URL, in seconds
    // 3600 is almost certainly overkill
    url.searchParams.set("X-Amz-Expires", "3600");

    const signed = await getR2Client().sign(
      new Request(url, {
        method: "GET",
        headers: {
          "Accept-Encoding": "deflate",
        },
      }),
      {
        aws: { signQuery: true },
      },
    );

    return fetch(signed.url, {
      method: "GET",
      headers: {
        "Accept-Encoding": "deflate",
      },
    });
  }

  static async put(key: string, data: Buffer | Uint8Array | string) {
    const url = new URL(R2_URL);
    url.pathname = key;

    // Specify a custom expiry for the presigned URL, in seconds
    // 3600 is almost certainly overkill
    url.searchParams.set("X-Amz-Expires", "3600");

    const signed = await getR2Client().sign(
      new Request(url, {
        method: "PUT",
        headers: {},
      }),
      {
        aws: { signQuery: true },
      },
    );

    let body;

    if (typeof data === "string") {
      const enc = new TextEncoder();
      body = deflate(enc.encode(data));
    } else if (data instanceof Uint8Array) {
      body = deflate(data);
    } else {
      body = data;
    }

    return fetch(signed.url, {
      method: "PUT",
      // eslint-disable-next-line
      // @ts-expect-error: Allow Buffer/Uint8Array as fetch body in Node runtime
      body,
      headers: {
        "Content-Encoding": "deflate",
      },
    });
  }
}

export async function uploadToR2(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array
    const uniqueFilename = `${Date.now()}-${file.name}`; // Generate a unique filename
    const res = await FileStorage.put(uniqueFilename, uint8Array); // Use Uint8Array with unique filename
    if (res.status === 200) {
      return `https://pub-ee9c36333afb4a8abe1e26dcc310f8ec.r2.dev/${uniqueFilename}`; // Return the file URL
    }
  } catch (e) {
    console.error(e);
    throw new Error(String(e));
  }
  return "";
}
import { Rettiwt } from "rettiwt-api";

interface Env {
  RETTIWT_API_KEY: string;
}

interface RequestBody {
  method: string;
  params: any[];
}

// Define a type for valid methods
type ValidMethods = keyof Rettiwt;

export const onRequest = async (
  context: EventContext<Env, string, unknown>
) => {
  const rettiwt = new Rettiwt({ apiKey: context.env.RETTIWT_API_KEY });

  try {
    const body: RequestBody = await context.request.json();
    const { method, params } = body;

    if (typeof rettiwt[method as ValidMethods] !== 'function') {
      return new Response(JSON.stringify({ error: 'Invalid method' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const methodKey = method as ValidMethods; // Cast method to ValidMethods
    const methodFunction = rettiwt[methodKey] as unknown; // Cast to unknown first
    const result = await (methodFunction as (...args: any[]) => Promise<any>)(...params); // Cast to callable function

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
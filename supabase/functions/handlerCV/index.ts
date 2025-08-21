import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const createResponse = (json: object, status: number) => {
  return new Response(JSON.stringify(json), {
    headers: { "Content-Type": "application/json" },
    status: status,
  });
};

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const event = await req.json();

    const bucket = event.bucket;
    const key = event.name;

    if (bucket === "CV" && key.endsWith(".pdf")) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(key, 3600);

      if (data) {
        return createResponse({ url: data.signedUrl }, 200);
      } else {
        throw new Error(error?.message || "Failed to create signed URL");
      }

      // // tutaj możesz np. wywołać AWS Lambda
      // await fetch("https://twoja-lambda-url.amazonaws.com", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fileUrl: publicUrl }),
      // });

      // let { data: users, error } = await supabase.from("users").select("*");
    }

    throw new Error("Invalid bucket or file type");
  } catch (error: any) {
    return createResponse({ error: error.message }, 400);
  }
});

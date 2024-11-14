import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

interface NextRequestWithImage extends NextRequest {
  imageUrl: string;
}

export async function POST(req: NextRequestWithImage, res: NextResponse) {
  const { imageUrl } = await req.json();

  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    return new NextResponse("Login in order to restore image", {
      status: 500,
    });
  }

  const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
  });

  try {
    const prediction = await replicate.predictions.create({
      version:
        "297a243ce8643961d52f745f9b6c8c1bd96850a51c92be5f43628a0d3e08321a",
      input: {
        img: imageUrl,
        version: "v1.4",
        scale: 2,
      },
    });

    let restoredImage: string | null = null;

    while (!restoredImage) {
      console.log("Pooling image from Replicate...");

      const updatedPrediction = await replicate.predictions.get(prediction.id);

      if (updatedPrediction.status === "succeeded") {
        restoredImage = updatedPrediction.output;
      } else if (updatedPrediction.status === "failed") {
        return new NextResponse("Failed to restore image.", { status: 500 });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ data: restoredImage }, { status: 200 });
  } catch (error) {
    console.error("Error during image restoration:", error);
    return new NextResponse("Error occurred while processing the image.", {
      status: 500,
    });
  }
}

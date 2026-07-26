import { createHash } from "node:crypto";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const allowedCategories = new Set([
  "Emlak",
  "Vasıta",
  "Motosiklet",
  "Yedek Parça",
  "İkinci El",
  "İş İlanları",
  "Hizmetler",
  "Hayvanlar",
]);

const generatedListingSchema = z.object({
  title: z.string().min(5).max(80),
  description: z.string().min(80).max(1500),
  suggestedPrice: z.number().nonnegative(),
  priceNote: z.string().min(5).max(240),
});

type RequestBody = {
  details?: unknown;
  category?: unknown;
  city?: unknown;
  district?: unknown;
  currentTitle?: unknown;
  currentPrice?: unknown;
};

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function cleanOptionalText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

export async function POST(request: Request) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!openaiApiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY ayarı bulunamadı." },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: "Supabase bağlantı ayarları bulunamadı." },
        { status: 500 }
      );
    }

    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return Response.json(
        { error: "Bu işlem için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return Response.json(
        { error: "Oturum doğrulanamadı. Lütfen yeniden giriş yapın." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const details = cleanOptionalText(body.details, 600);
    const category = cleanOptionalText(body.category, 40);
    const city = cleanOptionalText(body.city, 40);
    const district = cleanOptionalText(body.district, 60);
    const currentTitle = cleanOptionalText(body.currentTitle, 80);
    const currentPrice =
      typeof body.currentPrice === "number" &&
      Number.isFinite(body.currentPrice) &&
      body.currentPrice >= 0
        ? body.currentPrice
        : null;

    if (details.length < 10) {
      return Response.json(
        { error: "Lütfen en az 10 karakterlik kısa bilgi yazın." },
        { status: 400 }
      );
    }

    if (!allowedCategories.has(category)) {
      return Response.json(
        { error: "Lütfen geçerli bir kategori seçin." },
        { status: 400 }
      );
    }

    const safetyIdentifier = createHash("sha256")
      .update(`al-sat-ai:${user.id}`)
      .digest("hex");

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const response = await openai.responses.parse({
      model: "gpt-5.6-terra",
      reasoning: { effort: "low" },
      safety_identifier: safetyIdentifier,
      input: [
        {
          role: "system",
          content: [
            "Sen Türkiye'deki AL-SAT AI ilan platformunun ilan hazırlama asistanısın.",
            "Kullanıcının vermediği marka, model, kilometre, hasar, tapu, imar, oda sayısı veya başka bir özelliği kesinlikle uydurma.",
            "Başlığı doğal, dikkat çekici ve en fazla 80 karakter olacak şekilde Türkçe yaz.",
            "Açıklamayı sade, güven veren ve 2-4 kısa paragraf hâlinde Türkçe yaz.",
            "Kullanıcının verdiği mevcut fiyat varsa bunu dikkate al; yoksa yalnızca genel bir tahmini fiyat öner.",
            "Güvenilir fiyat tahmini için bilgi yetersizse suggestedPrice alanını 0 yap.",
            "Fiyatın kesin ekspertiz veya piyasa değeri olmadığını priceNote alanında açıkça belirt.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            category,
            details,
            location: {
              city: city || null,
              district: district || null,
            },
            currentTitle: currentTitle || null,
            currentPrice,
            currency: "TRY",
          }),
        },
      ],
      text: {
        format: zodTextFormat(generatedListingSchema, "generated_listing"),
      },
    });

    if (!response.output_parsed) {
      return Response.json(
        { error: "Yapay zekâ uygun bir ilan hazırlayamadı." },
        { status: 422 }
      );
    }

    return Response.json(response.output_parsed);
  } catch (error) {
    console.error("AI ilan oluşturma hatası:", error);

    return Response.json(
      { error: "Yapay zekâ hizmetine şu anda ulaşılamıyor." },
      { status: 500 }
    );
  }
}
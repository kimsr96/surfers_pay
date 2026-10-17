import { supabase } from "../../supabase";

const MODEL = "gemini-3.5-flash-lite";

const PROMPT = `영수증 이미지에서 다음을 읽어 JSON으로 답하라.
- amount: 고객이 실제로 결제한 최종 합계 금액(원, 정수). 부가세·공급가액·소계·할인 전 금액·받은 돈·거스름돈이 아니다. "합계", "결제금액", "카드승인금액", "받을 금액"에 해당하는 값을 쓴다.
- date: 결제 날짜(YYYY-MM-DD).
- place: 상호(사용처) 이름.
확실하지 않거나 보이지 않는 항목은 추측하지 말고 null로 둔다.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    amount: { type: "INTEGER", nullable: true },
    date: { type: "STRING", nullable: true },
    place: { type: "STRING", nullable: true },
  },
  required: ["amount", "date", "place"],
};

export async function POST(req) {
  const { pin, image, mime } = await req.json();

  const { data: ok } = await supabase.rpc("check_pin", { p_pin: pin ?? "" });
  if (!ok) return Response.json({ error: "PIN이 올바르지 않습니다." }, { status: 401 });
  if (!image) return Response.json({ error: "이미지가 없습니다." }, { status: 400 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime || "image/jpeg", data: image } }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
      }),
    }
  );
  if (!res.ok) return Response.json({ error: `Gemini 오류 (${res.status})` }, { status: 502 });

  let r = {};
  try {
    const json = await res.json();
    r = JSON.parse(json.candidates[0].content.parts[0].text);
  } catch {
    // 응답을 해석하지 못하면 모든 항목을 비워서 돌려준다.
  }

  return Response.json({
    amount: Number.isInteger(r.amount) && r.amount > 0 ? r.amount : null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? "") ? r.date : null,
    place: typeof r.place === "string" && r.place.trim() ? r.place.trim() : null,
  });
}

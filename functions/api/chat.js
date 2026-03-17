const HF_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/Llama-3.1-8B-Instruct:cerebras";

const STORE_FACTS = [
    "Store name: GOODS | PANDA.",
    "Visible categories: Watch, Bag, Shoes.",
    "Hero product: Mi LED TV 4A PRO 32 priced at $1289.",
    "Shoes on the page: Reebok Dart Men's Shoes ($1289), Reebok Pump ($799), Reebok All Terrain ($699).",
    "Backpacks on the page: Ison Backpack ($1289), Biaowang Backpack ($799), Dxyizu WS54 Smart ($699).",
    "If delivery, return, warranty, or payment details are requested, explain that the current page does not show those policies yet.",
    "If watch product details are requested, explain that the Watch category is visible but no individual watch products are listed.",
    "Reply in the same language as the customer when possible.",
    "Keep answers concise and do not invent stock, discounts, or store policies."
].join("\n");

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter((message) => {
            return message
                && (message.role === "user" || message.role === "assistant")
                && typeof message.content === "string"
                && message.content.trim();
        })
        .slice(-6)
        .map((message) => ({
            role: message.role,
            content: message.content.trim()
        }));
}

function extractReplyText(responseData) {
    const content = responseData?.choices?.[0]?.message?.content;

    if (typeof content === "string") {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === "string") {
                    return part;
                }

                return part?.text || "";
            })
            .join(" ")
            .trim();
    }

    return "";
}

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.HF_API_KEY) {
        return json({ error: "HF_API_KEY is not configured." }, 503);
    }

    let payload;

    try {
        payload = await request.json();
    } catch (error) {
        return json({ error: "Invalid JSON body." }, 400);
    }

    const messages = sanitizeMessages(payload?.messages);

    if (!messages.length) {
        return json({ error: "At least one chat message is required." }, 400);
    }

    const model = typeof payload?.model === "string" && payload.model.trim() ? payload.model.trim() : DEFAULT_MODEL;

    const upstreamResponse = await fetch(HF_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.HF_API_KEY}`
        },
        body: JSON.stringify({
            model,
            temperature: 0.35,
            max_tokens: 220,
            messages: [
                {
                    role: "system",
                    content: `You are Panda Support for GOODS | PANDA.\n${STORE_FACTS}`
                },
                ...messages
            ]
        })
    });

    if (!upstreamResponse.ok) {
        const details = await upstreamResponse.text();

        return json(
            {
                error: "Upstream model request failed.",
                details: details.slice(0, 400)
            },
            upstreamResponse.status
        );
    }

    const responseData = await upstreamResponse.json();
    const reply = extractReplyText(responseData);

    if (!reply) {
        return json({ error: "Model returned an empty reply." }, 502);
    }

    return json({ reply });
}

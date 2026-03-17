const chatbotConfig = window.GOODS_PANDA_CHATBOT || {};

const apiConfig = {
    endpoint: chatbotConfig.endpoint || "https://router.huggingface.co/v1/chat/completions",
    model: chatbotConfig.model || "meta-llama/Llama-3.1-8B-Instruct:cerebras",
    apiKey: chatbotConfig.apiKey || window.localStorage.getItem("goodsPandaHfToken") || ""
};

const productCatalog = [
    {
        name: "Mi LED TV 4A PRO 32",
        category: "TV",
        price: 1289,
        details: "Featured in the hero section as the headline product."
    },
    {
        name: "Reebok Dart Men's Shoes",
        category: "Shoes",
        price: 1289,
        details: "Highest-priced shoe shown on the page."
    },
    {
        name: "Reebok Pump",
        category: "Shoes",
        price: 799,
        details: "Mid-priced shoe option."
    },
    {
        name: "Reebok All Terrain",
        category: "Shoes",
        price: 699,
        details: "Most budget-friendly shoe currently listed."
    },
    {
        name: "Ison Backpack",
        category: "Backpack",
        price: 1289,
        details: "Highest-priced backpack shown on the page."
    },
    {
        name: "Biaowang Backpack",
        category: "Backpack",
        price: 799,
        details: "Mid-priced backpack option."
    },
    {
        name: "Dxyizu WS54 Smart",
        category: "Backpack",
        price: 699,
        details: "Most budget-friendly backpack shown on the page."
    }
];

const visibleCategories = ["Watch", "Bag", "Shoes"];

const storeFacts = [
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

const conversationHistory = [];

const supportSection = document.getElementById("support");
const launcherButton = document.getElementById("chatbot-launcher");
const statusText = document.getElementById("chatbot-status");
const statusPill = document.querySelector(".chatbot-pill");
const messagesContainer = document.getElementById("chatbot-messages");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");
const sendButton = document.getElementById("chatbot-send");
const suggestionButtons = document.querySelectorAll(".chatbot-chip");

function formatPrice(price) {
    return `$${price}`;
}

function getProductsByCategory(category) {
    return productCatalog.filter((product) => product.category === category);
}

function listProducts(products) {
    return products.map((product) => `${product.name} (${formatPrice(product.price)})`).join(", ");
}

function includesAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
}

function setStatus(text, mode) {
    statusText.textContent = text;
    statusPill.textContent = mode === "live" ? "Live AI" : "Catalog";
}

function scrollMessagesToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(role, text, extraClass) {
    const message = document.createElement("div");
    const roleClass = role === "assistant" ? "bot-message" : "user-message";

    message.className = `chatbot-message ${roleClass}${extraClass ? ` ${extraClass}` : ""}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    scrollMessagesToBottom();

    return message;
}

function autoResizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

function buildCategoryComparison(products, categoryLabel) {
    const sortedProducts = [...products].sort((first, second) => first.price - second.price);
    const cheapestProduct = sortedProducts[0];
    const premiumProduct = sortedProducts[sortedProducts.length - 1];

    return `${categoryLabel} on the page, from lowest to highest price, are ${listProducts(sortedProducts)}. ${cheapestProduct.name} is the most budget-friendly choice, while ${premiumProduct.name} is the premium-priced option.`;
}

function getLocalCatalogReply(messageText) {
    const text = messageText.toLowerCase();
    const shoes = getProductsByCategory("Shoes");
    const backpacks = getProductsByCategory("Backpack");

    if (includesAny(text, ["hello", "hi", "hey", "assalamu alaikum"])) {
        return "Hi, I can help with product prices, category browsing, and quick comparisons from the items shown on this page.";
    }

    if (includesAny(text, ["category", "categories", "available", "what do you sell"])) {
        return `This page highlights ${visibleCategories.join(", ")}. The detailed product sections currently shown are Shoes and Backpack, plus the featured Mi LED TV 4A PRO 32 in the hero banner.`;
    }

    if (includesAny(text, ["compare", "difference"]) && includesAny(text, ["bag", "bags", "backpack", "backpacks"])) {
        return buildCategoryComparison(backpacks, "Backpacks");
    }

    if (includesAny(text, ["compare", "difference"]) && includesAny(text, ["shoe", "shoes"])) {
        return buildCategoryComparison(shoes, "Shoes");
    }

    if (includesAny(text, ["cheap", "cheapest", "lowest", "budget", "under"]) && includesAny(text, ["shoe", "shoes"])) {
        const budgetShoes = shoes.filter((product) => product.price < 800);

        return `The best budget shoe options currently shown are ${listProducts(budgetShoes)}. Reebok All Terrain at ${formatPrice(699)} is the lowest-priced shoe on the page.`;
    }

    if (includesAny(text, ["cheap", "cheapest", "lowest", "budget", "under"]) && includesAny(text, ["bag", "bags", "backpack", "backpacks"])) {
        const budgetBackpacks = backpacks.filter((product) => product.price < 800);

        return `The most budget-friendly backpack on this page is Dxyizu WS54 Smart at ${formatPrice(699)}. Budget-friendly options under ${formatPrice(800)} are ${listProducts(budgetBackpacks)}.`;
    }

    if (includesAny(text, ["shoe", "shoes", "sneaker", "sneakers"])) {
        return `The Shoes section currently includes ${listProducts(shoes)}. Reebok All Terrain is the most affordable shoe, while Reebok Dart Men's Shoes is the top-priced shoe shown here.`;
    }

    if (includesAny(text, ["bag", "bags", "backpack", "backpacks"])) {
        return `The Backpack section currently includes ${listProducts(backpacks)}. Dxyizu WS54 Smart is the most budget-friendly backpack on the page.`;
    }

    if (includesAny(text, ["tv", "television"])) {
        return "The featured TV is Mi LED TV 4A PRO 32, priced at $1289. It is the headline product in the hero section.";
    }

    if (includesAny(text, ["watch", "watches"])) {
        return "The Watch category is visible on the page, but individual watch products are not listed yet.";
    }

    if (includesAny(text, ["recommend", "suggest", "best"]) && includesAny(text, ["travel", "trip", "daily use"])) {
        return "For a budget travel pick, Dxyizu WS54 Smart at $699 is the lowest-priced backpack on the page. For shoes, Reebok All Terrain at $699 is the most budget-friendly option.";
    }

    if (includesAny(text, ["price", "cost", "range"])) {
        return "The visible product prices on this page range from $699 to $1289. The lowest-priced items shown are Reebok All Terrain and Dxyizu WS54 Smart, both at $699.";
    }

    if (includesAny(text, ["delivery", "shipping", "return", "refund", "warranty", "payment", "cash on delivery", "cod"])) {
        return "The current page does not show delivery, payment, return, or warranty policy details yet. Those should be added to the site or shared through the contact section for exact support.";
    }

    return "I can help with product prices, category browsing, and comparisons from the catalog shown on this page. Ask me about shoes, backpacks, the featured TV, or visible categories.";
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

async function requestOpenSourceReply() {
    if (!apiConfig.apiKey) {
        return "";
    }

    const response = await fetch(apiConfig.endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
            model: apiConfig.model,
            temperature: 0.35,
            max_tokens: 220,
            messages: [
                {
                    role: "system",
                    content: `You are Panda Support for GOODS | PANDA.\n${storeFacts}`
                },
                ...conversationHistory.slice(-6)
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`Model request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    return extractReplyText(responseData);
}

function setBusyState(isBusy) {
    sendButton.disabled = isBusy;
    input.disabled = isBusy;
    input.placeholder = isBusy ? "Thinking..." : "Ask about price, products, or categories...";
}

async function handleSubmit(event) {
    event.preventDefault();

    const userMessage = input.value.trim();

    if (!userMessage) {
        return;
    }

    appendMessage("user", userMessage);
    conversationHistory.push({
        role: "user",
        content: userMessage
    });

    input.value = "";
    autoResizeInput();
    setBusyState(true);
    setStatus(apiConfig.apiKey ? "Generating a live answer..." : "Catalog assistant active", apiConfig.apiKey ? "live" : "catalog");

    const typingMessage = appendMessage("assistant", "Typing...", "typing-message");

    try {
        let reply = await requestOpenSourceReply();

        if (!reply) {
            reply = getLocalCatalogReply(userMessage);
        }

        typingMessage.remove();
        appendMessage("assistant", reply);
        conversationHistory.push({
            role: "assistant",
            content: reply
        });
        setStatus(apiConfig.apiKey ? "Open-source AI connected" : "Catalog assistant active", apiConfig.apiKey ? "live" : "catalog");
    } catch (error) {
        const fallbackReply = getLocalCatalogReply(userMessage);

        typingMessage.remove();
        appendMessage("assistant", `Live AI is unavailable right now. ${fallbackReply}`);
        conversationHistory.push({
            role: "assistant",
            content: fallbackReply
        });
        setStatus("Catalog assistant active", "catalog");
        console.error(error);
    } finally {
        setBusyState(false);
        input.focus();
    }
}

function useSuggestedPrompt(prompt) {
    input.value = prompt;
    autoResizeInput();
    input.focus();
    form.requestSubmit();
}

form.addEventListener("submit", handleSubmit);

input.addEventListener("input", autoResizeInput);
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

suggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        useSuggestedPrompt(button.dataset.prompt || "");
    });
});

launcherButton.addEventListener("click", () => {
    supportSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    window.setTimeout(() => input.focus(), 350);
});

setStatus(apiConfig.apiKey ? "Open-source AI ready" : "Catalog assistant active", apiConfig.apiKey ? "live" : "catalog");
autoResizeInput();

import axios from "axios";
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function makeChatAPICall(
  inputContext: string,
  systemContext: string,
  llmModel: string | undefined,
  apiKey: string | undefined
) {
  const API_KEY = apiKey as string;
  if (llmModel?.startsWith("gemini")) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: llmModel });
    const result = await model.generateContent(inputContext);
    const response = await result.response;
    const text: String = response.text();

    return text;
  } else {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: `${llmModel}`,
        messages: [
          { role: "system", content: systemContext },
          {
            role: "user",
            content: inputContext,
          },
        ],
        max_tokens: 1024,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    let result: String = res.data.choices[0].message.content;
    return result;
  }
}

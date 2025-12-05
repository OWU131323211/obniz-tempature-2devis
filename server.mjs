import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

const GEMINI_API_KEY = "AIzaSyBsaqotW3PsfSfEy2TryVewpWkjh-Y5i_k";

// ---------------------------------------------------------------
app.post("/analyze", async (req, res) => {
  const { temperatureA, humidityA, temperatureB, humidityB } = req.body;

  console.log("受信データ:", req.body);

  if (
    temperatureA === undefined ||
    humidityA === undefined ||
    temperatureB === undefined ||
    humidityB === undefined
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const promptText = `
あなたは室内環境の専門AIです。
以下の2つのセンサー値は、同じ部屋に設置されています。

・部屋内の温度ムラ（何℃差か）
・湿度ムラ（何％差か）
・ムラが生じる原因の推定
・注意点
・改善案（空調・換気・加湿など）

▼センサーA
温度: ${temperatureA}℃
湿度: ${humidityA}%

▼センサーB
温度: ${temperatureB}℃
湿度: ${humidityB}%
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini API 応答:", data);

    const resultText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "解析失敗：AIから返信がありません";

    res.json({ analysis: resultText });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res
      .status(500)
      .json({ error: "Gemini API Error", detail: err.message });
  }
});


app.listen(3000, () => {
  console.log("MCP server running on port 3000");
});

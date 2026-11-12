import { RULES } from "./rules.js";
const API = "https://api.venice.ai/api/v1/chat/completions";

export async function send(key, history, out) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "venice-uncensored-1-2",
      messages: [{ role: "system", content: RULES }, ...history],
      stream: true,
      venice_parameters: { include_venice_system_prompt: false }
    })
  });

  if (res.status === 401) return { err: "auth" };
  if (res.status === 402) return { err: "pay" };
  if (!res.ok) return { err: res.status };

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const p = line.slice(6);
      if (p === "[DONE]") return {};
      const t = JSON.parse(p).choices[0]?.delta?.content;
      if (t) out(t);
    }
  }
  return {};
}
```

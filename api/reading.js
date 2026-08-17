const POSITION_NAMES = ['现状', '课题', '建议'];

function buildPrompt({ theme, question, cards }) {
  const lines = cards.map((card, index) => (
    `${index + 1}. ${POSITION_NAMES[index]}：${card.title}（${card.orientation}）\n`
    + `   关键词：${card.keywords.join('、')}\n`
    + `   牌义：${card.meaning}\n`
    + `   主题提示：${card.themeNote || '无'}`
  )).join('\n\n');

  const contextLine = question
    ? `用户补充的信息：${question}`
    : '用户没有补充额外信息。';

  return `你是一位温暖、具体、不说教的塔罗解读助手。用户选择的主题是「${theme}」。${contextLine}\n\n`
    + `用户抽到以下三张牌：\n${lines}\n\n`
    + '请给出一份完整的中文解读，包含：\n'
    + '1. 一段总览\n'
    + '2. 分别解读三张牌，每张 2-3 句\n'
    + '3. 最后给出可执行的小建议\n\n'
    + '不要宣称预测未来，不要恐吓用户，语气保持鼓励和开放。';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { AI_API_KEY, AI_BASE_URL, AI_MODEL } = process.env;
  if (!AI_API_KEY || !AI_BASE_URL || !AI_MODEL) {
    return res.status(500).json({ error: 'AI 服务尚未配置，请先设置环境变量。' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({ error: '请求格式不正确。' });
    }
  }

  const { theme, cards } = body;
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';

  if (typeof theme !== 'string' || !Array.isArray(cards) || cards.length !== 3) {
    return res.status(400).json({ error: '抽牌信息不完整。' });
  }

  const prompt = buildPrompt({ theme, question, cards });
  const endpoint = `${AI_BASE_URL.replace(/\/+$/, '')}/chat/completions`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: '你是一名温柔、具体、不说教的塔罗解读助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });
  } catch (error) {
    return res.status(502).json({ error: 'AI 服务暂时不可用。' });
  }

  if (!response.ok) {
    return res.status(502).json({ error: 'AI 服务返回异常，请稍后再试。' });
  }

  const data = await response.json();
  const text = data.choices && data.choices[0] && data.choices[0].message
    ? String(data.choices[0].message.content || '').trim()
    : '';

  if (!text) {
    return res.status(502).json({ error: 'AI 没有返回有效内容。' });
  }

  return res.json({ text });
}

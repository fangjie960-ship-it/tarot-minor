const POSITION_NAMES = ['现状', '课题', '建议'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

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
    + '请输出一份排版干净的中文解读，使用 3-4 个自然段落，段落之间最多空一行。\n'
    + '不要使用 Markdown，不要使用 #、**、-、--- 或数字编号，不要使用任何列表和符号。\n'
    + '内容尽量简洁，总长度控制在 350 字以内。\n'
    + '结构建议：先一句话总览，再简短带过三张牌各自含义，最后给一个具体的小建议。\n'
    + '语气积极、温暖、偏鼓励，不要宣称预测未来，不要恐吓用户。';
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { AI_API_KEY, AI_BASE_URL, AI_MODEL } = env;

  if (!AI_API_KEY || !AI_BASE_URL || !AI_MODEL) {
    return jsonResponse({ error: 'AI 服务尚未配置，请先设置环境变量。' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: '请求格式不正确。' }, 400);
  }

  const { theme, cards } = body;
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';

  if (typeof theme !== 'string' || !Array.isArray(cards) || cards.length !== 3) {
    return jsonResponse({ error: '抽牌信息不完整。' }, 400);
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
    return jsonResponse({ error: 'AI 服务暂时不可用。' }, 502);
  }

  if (!response.ok) {
    return jsonResponse({ error: 'AI 服务返回异常，请稍后再试。' }, 502);
  }

  const data = await response.json();
  const text = data.choices && data.choices[0] && data.choices[0].message
    ? String(data.choices[0].message.content || '').trim()
    : '';

  if (!text) {
    return jsonResponse({ error: 'AI 没有返回有效内容。' }, 502);
  }

  return jsonResponse({ text });
}

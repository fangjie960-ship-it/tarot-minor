const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  theme TEXT NOT NULL,
  card1 TEXT NOT NULL,
  card1_reversed INTEGER NOT NULL DEFAULT 0,
  card2 TEXT NOT NULL,
  card2_reversed INTEGER NOT NULL DEFAULT 0,
  card3 TEXT NOT NULL,
  card3_reversed INTEGER NOT NULL DEFAULT 0,
  question TEXT,
  used_ai INTEGER NOT NULL DEFAULT 0
);
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) {
    return jsonResponse({ error: 'D1 未配置' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: '请求格式不正确。' }, 400);
  }

  if (body && body.id) {
    const usedAi = body.used_ai === true ? 1 : 0;
    try {
      await env.DB.prepare('UPDATE readings SET used_ai = ? WHERE id = ?').bind(usedAi, body.id).run();
    } catch (error) {
      return jsonResponse({ error: '更新记录失败。' }, 500);
    }
    return jsonResponse({ ok: true });
  }

  const { theme, cards, question, used_ai } = body;
  if (typeof theme !== 'string' || !Array.isArray(cards) || cards.length !== 3) {
    return jsonResponse({ error: '抽牌信息不完整。' }, 400);
  }

  try {
    await env.DB.prepare(CREATE_TABLE_SQL).run();

    const createdAt = new Date().toISOString();
    const cleanQuestion = typeof question === 'string' ? question.trim().slice(0, 500) : null;
    const result = await env.DB.prepare(
      'INSERT INTO readings (created_at, theme, card1, card1_reversed, card2, card2_reversed, card3, card3_reversed, question, used_ai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      createdAt,
      theme,
      cards[0].title,
      cards[0].reversed ? 1 : 0,
      cards[1].title,
      cards[1].reversed ? 1 : 0,
      cards[2].title,
      cards[2].reversed ? 1 : 0,
      cleanQuestion,
      used_ai === true ? 1 : 0
    ).run();

    return jsonResponse({ ok: true, id: result.meta && result.meta.last_row_id });
  } catch (error) {
    return jsonResponse({ error: '写入统计失败。' }, 500);
  }
}

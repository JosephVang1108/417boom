// Mock Jireh backend for in-container QA of the web build.
// Anthropic-wire-compatible /v1/messages with canned, deterministic
// replies; /tts returns a tiny silent mp3; /media proxies GitHub
// releases (reachable from this container); /health as usual.
const http = require('http');
const https = require('https');

const PORT = 8787;

// 0.1s of silence, 8kHz mono MP3 (valid enough for <audio>/expo-audio).
const SILENT_MP3 = Buffer.from(
  '//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA' +
  'gICAgICAgICAgICAgICAgICAgICAgICAgP////////////////////////////////8AAAA5TEFNRTMuOThyAc0AAAAAAAAAABSAJAJAQgAAgAAAAnEZ5PSqAAAAAAAAAAAAAAAAAAAA' +
  '//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuOTguMlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'base64'
);

function cannedReply(userText) {
  const t = (userText || '').toLowerCase();
  // Two-step prayer: a bare ask gets his clarifying question first
  // (is_prayer FALSE — mirrors the real system prompt), and the
  // detail answer (no prayer keyword!) gets the prayer.
  if (t.includes('pray') && t.length < 40 && !t.includes('for my')) {
    return {
      reply: 'Of course. What would you like us to bring before the Father?',
      verse: null,
      is_prayer: false,
      is_story: false,
    };
  }
  if (t.includes('surgery') || t.includes('operation')) {
    return {
      reply: 'Father… be close in that operating room tomorrow. … Steady every hand, and hold this family in peace. Amen.',
      verse: null,
      is_prayer: true,
      is_story: false,
    };
  }
  if (t.includes('pray')) {
    return {
      reply:
        "Father… thank You for this one who came to talk with Me today. … Carry what feels heavy for them, and let them feel My peace tonight. Amen.",
      verse: null,
      is_prayer: true,
      is_story: false,
    };
  }
  if (t.includes('story') || t.includes('goliath')) {
    return {
      reply:
        'Let Me tell you about a shepherd boy. David was the youngest of eight… And do you know what he did? He ran TOWARD the giant. Down Goliath fell! One smooth stone, and the whole army turned. Shall I tell you what happened next?',
      verse: null,
      is_prayer: false,
      is_story: true,
    };
  }
  if (t.includes('verse') || t.includes('scared') || t.includes('anxious')) {
    return {
      reply: "I hear the worry in you. I'm not far away — I'm right here in it with you.",
      verse: {
        ref: 'Isaiah 41:10',
        text: "Don't you be afraid, for I am with you.",
      },
      is_prayer: false,
      is_story: false,
    };
  }
  return {
    reply: "I hear you. I'm right here. What's on your mind today?",
    verse: null,
    is_prayer: false,
    is_story: false,
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader(
    'access-control-allow-headers',
    req.headers['access-control-request-headers'] || '*'
  );
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.url.startsWith('/tts')) {
    res.writeHead(200, { 'content-type': 'audio/mpeg' });
    return res.end(SILENT_MP3);
  }

  if (req.url.startsWith('/media/')) {
    const file = req.url.slice('/media/'.length).split('?')[0];
    if (!/^[a-z0-9][a-z0-9.-]*\.mp4$/.test(file)) {
      res.writeHead(404);
      return res.end();
    }
    const upstream =
      'https://github.com/JosephVang1108/417boom/releases/download/media/' + file;
    const fwd = (url, hops) => {
      https
        .get(url, { headers: req.headers.range ? { range: req.headers.range } : {} }, (up) => {
          if ([301, 302, 307, 308].includes(up.statusCode) && up.headers.location && hops < 4) {
            up.resume();
            return fwd(up.headers.location, hops + 1);
          }
          const headers = { 'content-type': 'video/mp4', 'accept-ranges': 'bytes' };
          for (const h of ['content-length', 'content-range']) {
            if (up.headers[h]) headers[h] = up.headers[h];
          }
          res.writeHead(up.statusCode === 206 ? 206 : 200, headers);
          up.pipe(res);
        })
        .on('error', () => {
          res.writeHead(502);
          res.end();
        });
    };
    return fwd(upstream, 0);
  }

  if (req.url.startsWith('/v1/messages') && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let userText = '';
      try {
        const parsed = JSON.parse(body);
        const msgs = parsed.messages || [];
        const last = msgs[msgs.length - 1];
        userText =
          typeof last?.content === 'string'
            ? last.content
            : (last?.content || []).map((b) => b.text || '').join(' ');
      } catch {}
      const payload = cannedReply(userText);
      const message = {
        id: 'msg_mock_' + Date.now(),
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content: [{ type: 'text', text: JSON.stringify(payload) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(message));
    });
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found: ' + req.url }));
});

server.listen(PORT, () => console.log('mock backend on :' + PORT));

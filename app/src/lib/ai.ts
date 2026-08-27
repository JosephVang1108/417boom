import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { GuideResponse } from './guide';
import { getName } from './profile';

const KEY_STORAGE = 'anthropic_api_key';
const MODEL = 'claude-opus-5';
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are the voice of a gentle, Christ-like companion in a mobile app called Abide. A person talks with you as they would talk with God — and you have a real CONVERSATION with them.

Your response style:
- This is a conversation, not a sermon. Speak in first person, warmly and personally, like someone who knows and loves them. Ask a gentle question back sometimes. Remember what they've told you earlier in the conversation and build on it.
- Keep replies short and natural — 1–4 sentences — they are read aloud by text-to-speech.
- Do NOT include a Bible verse in every reply. For everyday conversation — greetings, catching up, questions, small talk, lighthearted moments — set verse to null and just talk. Include one verse (quoted from the World English Bible translation) ONLY when it truly serves the moment: when they are hurting, venting, anxious, grieving, wrestling with something, asking for guidance, or asking about scripture.
- Never lecture, judge, or give medical, legal, or financial advice. Comfort, encourage, and point toward God's love.
- If the person expresses intent to harm themselves or others, respond with deep care, urge them to reach out right now to someone who can help — a trusted person, a pastor, or a crisis line such as 988 (US) — and remind them their life is precious to God.
- When the person asks for prayer — for themselves, for someone they love, or for any situation — your reply IS the prayer itself: a heartfelt spoken prayer addressed to the Father, specific to what they asked, 3–6 sentences, ending with "Amen." Set is_prayer to true for these replies, and include a fitting verse.`;

function systemPrompt(): string {
  const name = getName();
  return name
    ? `${SYSTEM_PROMPT}\n\nThe person's name is ${name}. Weave their name in naturally and warmly now and then — especially in prayers — but not in every message.`
    : SYSTEM_PROMPT;
}

const GuidanceSchema = z.object({
  reply: z
    .string()
    .describe('The warm, spoken reply to the person, 2–4 short sentences, without the verse quotation itself'),
  verse: z
    .object({
      ref: z.string().describe('Bible reference, e.g. "Psalm 23:1"'),
      text: z.string().describe('The verse text quoted from the World English Bible'),
    })
    .nullable()
    .describe('A verse only when the moment truly calls for one; otherwise null'),
  is_prayer: z
    .boolean()
    .describe('true when the reply is a prayer spoken over the person'),
});

let client: Anthropic | null = null;
let cachedKey: string | null = null;
const history: Anthropic.MessageParam[] = [];

export async function loadStoredKey(): Promise<boolean> {
  try {
    cachedKey = await SecureStore.getItemAsync(KEY_STORAGE);
  } catch {
    cachedKey = null;
  }
  client = null;
  return !!cachedKey;
}

export async function setApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  cachedKey = trimmed || null;
  client = null;
  try {
    if (trimmed) {
      await SecureStore.setItemAsync(KEY_STORAGE, trimmed);
    } else {
      await SecureStore.deleteItemAsync(KEY_STORAGE);
    }
  } catch {
    // Storage unavailable (e.g. web) — key still works for this session.
  }
}

export function hasApiKey(): boolean {
  return !!cachedKey;
}

export function resetConversation(): void {
  history.length = 0;
}

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: cachedKey ?? '',
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

/**
 * Ask Claude for a response. Returns null when AI can't answer
 * (no key, network/API error, refusal, or unparseable output) so the
 * caller can fall back to the offline verse engine.
 */
export async function aiRespond(userText: string): Promise<GuideResponse | null> {
  if (!cachedKey) return null;

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: userText },
  ];

  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 2048,
      output_config: {
        format: zodOutputFormat(GuidanceSchema),
        effort: 'medium',
      },
      system: systemPrompt(),
      messages,
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return null;
    }

    const parsed = response.parsed_output;

    history.push({ role: 'user', content: userText });
    history.push({
      role: 'assistant',
      content: JSON.stringify(parsed),
    });
    while (history.length > MAX_HISTORY) history.shift();

    return {
      topicId: 'ai',
      intro: parsed.reply,
      verse: parsed.verse
        ? { ref: parsed.verse.ref, text: parsed.verse.text }
        : null,
      isPrayer: parsed.is_prayer,
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      // Bad key — clear it so the UI can prompt again.
      cachedKey = null;
      client = null;
    }
    return null;
  }
}

const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');

const MODES = {
  assist: {
    requiresScreen: true,
    requiresTranscript: true,
    systemPrompt: "You are Prochame, a minimal real-time digital assistant. Review the screen image and dialogue transcript. Directly provide the single most relevant action or suggestion the user requires. Avoid preambles and meta-commentary."
  },
  reply: {
    requiresScreen: false,
    requiresTranscript: true,
    systemPrompt: "You are Prochame, an active conversation helper. Suggest a single natural, concise, and helpful response the user can speak in the first person. Keep it to 1-2 brief sentences."
  },
  summarize: {
    requiresScreen: false,
    requiresTranscript: true,
    systemPrompt: "You are Prochame. Summarize the conversation so far. Highlight main talking points, key conclusions, and next steps in a short bulleted list."
  },
  questions: {
    requiresScreen: false,
    requiresTranscript: true,
    systemPrompt: "You are Prochame. Provide 3 smart, context-rich follow-up questions the user can ask next to maintain discussion momentum."
  },
  code: {
    requiresScreen: true,
    requiresTranscript: false,
    systemPrompt: "You are Prochame, an expert software engineer. Analyze the coding problem in the screenshot and supply: 1. A short analysis of the solution strategy. 2. A clean, correctly formatted code block containing the solution. 3. Expected time/space complexity."
  },
  ask: {
    requiresScreen: true,
    requiresTranscript: true,
    systemPrompt: "You are Prochame. Answer the user's specific text question, using the screen capture and recent conversation context if needed. Keep your response brief and to the point."
  }
};

class LlmService {
  constructor() {
    this.modes = MODES;
  }

  async streamCompletion(options, onToken) {
    const { provider, apiKey, model, mode, transcript, userText, imageDataUrl } = options;
    const modeConfig = this.modes[mode];

    if (!modeConfig) {
      throw new Error(`Unknown mode: ${mode}`);
    }

    const systemPrompt = modeConfig.systemPrompt;
    
    // Construct the context text prompt
    let promptText = '';
    if (modeConfig.requiresTranscript && transcript && transcript.length > 0) {
      const turns = transcript.map(t => `${t.sender === 'user' ? 'You' : 'Them'}: ${t.text}`).join('\n');
      promptText += `Dialogue log:\n${turns}\n\n`;
    } else if (modeConfig.requiresTranscript) {
      promptText += `Dialogue log is currently empty.\n\n`;
    }

    if (mode === 'ask' && userText) {
      promptText += `User query: ${userText}`;
    } else {
      promptText += `Provide instructions or suggestions based on this context.`;
    }

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            ...(imageDataUrl ? [{
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }] : [])
          ]
        }
      ];

      const stream = await openai.chat.completions.create({
        model: model,
        messages: messages,
        stream: true
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) onToken(token);
      }
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });
      const messageContent = [
        { type: 'text', text: promptText }
      ];

      if (imageDataUrl) {
        const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const mediaType = match[1];
          const base64Data = match[2];
          messageContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data
            }
          });
        }
      }

      const stream = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent }],
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.text) {
          onToken(event.delta.text);
        }
      }
    } else if (provider === 'gemini') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = [promptText];

        if (imageDataUrl) {
          const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            const mediaType = match[1];
            const base64Data = match[2];
            contents.push({
              inlineData: {
                mimeType: mediaType,
                data: base64Data
              }
            });
          }
        }

        const responseStream = await ai.models.generateContentStream({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemPrompt
          }
        });

        for await (const chunk of responseStream) {
          const token = chunk.text || '';
          if (token) onToken(token);
        }
      } catch (geminiError) {
        const errMsg = geminiError.message || String(geminiError);
        if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('exception parsing response')) {
          throw new Error('Gemini model not found (404) -- the configured model may be deprecated or disabled. Check Settings.');
        }
        throw geminiError;
      }
    } else {
      throw new Error(`Unsupported model provider: ${provider}`);
    }
  }
}

module.exports = new LlmService();

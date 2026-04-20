import type OpenAI from 'openai';
import useSettingStore from '@/stores/setting';
import { createOpenAIClient } from './utils';

export interface QuickPrompt {
  id: string
  text: string
}

/**
 * Get inspiration model configuration
 * @returns Inspiration model configuration, or null if not configured
 */
async function getInspirationModelConfig() {
  const settingStore = useSettingStore.getState()
  const inspirationModelId = settingStore.inspirationModel

  // Find configured inspiration model from AI model list
  const aiModelList = settingStore.aiModelList
  for (const config of aiModelList) {
    if (config.models) {
      const model = config.models.find(m => m.id === inspirationModelId || `${config.key}-${m.id}` === inspirationModelId)
      if (model) {
        return config
      }
    }
  }

  // If no inspiration model found, use default NoteGen chat model as fallback
  const { noteGenDefaultModels } = await import('@/app/model-config')
  const noteGenChat = noteGenDefaultModels[0]?.models?.find(m => m.modelType === 'chat')
  if (noteGenChat) {
    return noteGenDefaultModels[0]
  }

  return null
}

/**
 * Generate input placeholder suggestion
 * @param text Context content
 * @returns Placeholder text, returns false on failure
 */
export async function fetchAiPlaceholder(text: string): Promise<string | false> {
  try {
    // Dynamically import model-config to get default model configuration
    const { noteGenDefaultModels } = await import('@/app/model-config')

    // Use first default model configuration (NoteGen Free)
    const defaultConfig = noteGenDefaultModels[0]
    const chatModel = defaultConfig.models?.find(m => m.modelType === 'chat')

    if (!defaultConfig || !chatModel) {
      console.error('No default chat model found in noteGenDefaultModels')
      return false
    }

    // Build placeholder prompt
    const placeholderPrompt = `
      You are a note-taking software with an intelligent assistant. You can refer to the recorded content to take notes.
      IMPORTANT: Do not exceed 10 characters. Keep it extremely short.
      There is only one line left. Line breaks are strictly prohibited.
      Do not generate any special characters or punctuation.
      Leave it as plain text and no format is required.
      CRITICAL: Each response must be different and varied. Generate diverse suggestions each time, do not repeat previous patterns.
      Generate a very short question based on the following content:
      ${text}`

    // Prepare messages - don't load memories, use simple messages directly
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'user', content: placeholderPrompt }
    ]

    const openai = await createOpenAIClient(defaultConfig)

    const completion = await openai.chat.completions.create({
      model: chatModel.model || '',
      messages: messages,
      temperature: chatModel.temperature || 1,
      top_p: chatModel.topP || 1,
    })

    const result = completion.choices[0]?.message?.content || ''

    // Remove all newlines and special characters, excluding spaces
    return result.trim()
  } catch (error) {
    console.error('Error in fetchAiPlaceholder:', error)
    return false
  }
}

/**
 * Generate 4 inspiration prompts
 * @param text Context content
 * @returns Array of inspiration prompts, empty array on failure
 */
export async function fetchAiQuickPrompts(text: string): Promise<QuickPrompt[]> {
  try {
    const config = await getInspirationModelConfig()
    const chatModel = config?.models?.find(m => m.modelType === 'chat')

    if (!config || !chatModel) {
      console.error('No valid chat model found for inspiration')
      return []
    }

    // Build prompt for generating 4 suggestions
    const prompt = `
You are a note-taking software assistant. Generate 4 different quick prompt suggestions.

Requirements:
1. Each prompt: short, actionable, under 15 characters
2. All 4 prompts must be different
3. Use English unless content is clearly in another language
4. NO special characters or punctuation
5. Respond with ONLY a valid JSON array

Your response must be exactly this format (nothing else):
["prompt1", "prompt2", "prompt3", "prompt4"]

Content: ${text || 'General note-taking'}`

    // Prepare messages - don't load memories, use simple messages directly
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt }
    ]

    const openai = await createOpenAIClient(config)

    const completion = await openai.chat.completions.create({
      model: chatModel.model || '',
      messages: messages,
      temperature: 0.8, // Use higher temperature for more diverse results
      top_p: chatModel.topP || 1,
    })

    const result = completion.choices[0]?.message?.content || ''

    // Try to parse JSON result
    try {
      // Clean up possible markdown code block markers
      let cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      // Try to extract JSON array (handle case where response contains extra content)
      const arrayMatch = cleanResult.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        cleanResult = arrayMatch[0]
      }

      // Try to fix common JSON issues (like missing quotes)
      try {
        const prompts = JSON.parse(cleanResult)

        if (Array.isArray(prompts) && prompts.length >= 4) {
          return prompts.slice(0, 4).map((text, index) => ({
            id: `ai-prompt-${index}`,
            text: String(text).trim()
          }))
        }

        // If parsed array has less than 4 items, return what we can parse
        if (Array.isArray(prompts)) {
          return prompts.map((text, index) => ({
            id: `ai-prompt-${index}`,
            text: String(text).trim()
          }))
        }
      } catch {
        // JSON parse failed, continue to fallback
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
    }

    // If JSON parsing fails, try splitting by lines
    const lines = result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'))

    if (lines.length >= 4) {
      return lines.slice(0, 4).map((text, index) => ({
        id: `ai-prompt-${index}`,
        text: text.replace(/^["']|["']$/g, '').trim()
      }))
    }

    return []
  } catch (error) {
    console.error('Error in fetchAiQuickPrompts:', error)
    return []
  }
}

/**
 * Generate single inspiration prompt (for placeholder)
 * @param text Context content
 * @returns Prompt text, empty string on failure
 */
export async function fetchAiSinglePrompt(text: string): Promise<string> {
  try {
    const config = await getInspirationModelConfig()
    const chatModel = config?.models?.find(m => m.modelType === 'chat')

    if (!config || !chatModel) {
      console.error('No valid chat model found for inspiration')
      return ''
    }

    const prompt = `
Generate ONE very short and actionable prompt suggestion (under 15 characters) based on the following content.
Return ONLY the prompt text, nothing else.
Do not include any special characters or punctuation.

Content: ${text || 'No content provided'}`

    // Prepare messages - don't load memories, use simple messages directly
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt }
    ]

    const openai = await createOpenAIClient(config)

    const completion = await openai.chat.completions.create({
      model: chatModel.model || '',
      messages: messages,
      temperature: 0.8,
      top_p: chatModel.topP || 1,
    })

    const result = completion.choices[0]?.message?.content || ''
    return result.trim()
  } catch (error) {
    console.error('Error in fetchAiSinglePrompt:', error)
    return ''
  }
}

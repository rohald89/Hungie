import OpenAI from 'openai'

export class OpenAIProvider {
	static client() {
		return new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		})
	}
}

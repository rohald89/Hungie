import { OpenAI } from 'openai'
import { MOCK_OPENAI, MOCK_OPENAI_HEADER } from './constants'

const shouldMock =
	process.env.OPENAI_API_KEY?.startsWith('MOCK_') ||
	process.env.NODE_ENV === 'test'

const mockResponse = {
	choices: [
		{
			message: {
				content: JSON.stringify({
					detectedIngredients: [
						{
							name: 'Test Ingredient',
							category: 'Test Category',
						},
					],
					suggestedRecipes: [
						{
							title: 'Test Recipe',
							cookingTime: '30 mins',
							difficulty: 'Easy',
							ingredients: [
								{
									item: 'Test Ingredient',
									amount: '1 cup',
									required: true,
								},
							],
							instructions: ['Test step'],
							nutritionalInfo: {
								calories: '100',
								protein: '5g',
								carbs: '10g',
								fat: '2g',
							},
						},
					],
				}),
			},
		},
	],
}

export class OpenAIProvider {
	static client() {
		if (shouldMock) {
			return {
				chat: {
					completions: {
						create: async () => mockResponse,
					},
				},
			}
		}
		return new OpenAI({
			apiKey: process.env.OPENAI_API_KEY || MOCK_OPENAI,
        })
	}
}

import { expect, test, vi } from 'vitest'
import { analyzeFridgeContents, generateRecipes } from './ai.server'

vi.mock('openai', () => ({
	OpenAI: vi.fn(() => ({
		chat: {
			completions: {
				create: vi.fn(() => ({
					choices: [
						{
							message: {
								content: JSON.stringify({
									detectedIngredients: [
										{
											name: 'Apple',
											category: 'Produce',
											quantity: '2',
										},
									],
									suggestedRecipes: [
										{
											title: 'Apple Pie',
											cookingTime: '1 hour',
											difficulty: 'Medium',
											ingredients: [
												{
													item: 'Apple',
													amount: '2',
													required: true,
												},
											],
											instructions: ['Step 1'],
											nutritionalInfo: {
												calories: '200',
												protein: '2g',
												carbs: '30g',
												fat: '10g',
											},
										},
									],
								}),
							},
						},
					],
				})),
			},
		},
	})),
}))

test('analyzeFridgeContents returns mocked data during tests', async () => {
	const result = await analyzeFridgeContents('fake-image-url')
	expect(result).toBeDefined()
}) 

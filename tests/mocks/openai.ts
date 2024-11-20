import { http, HttpResponse } from 'msw'

export const openaiHandlers = [
	http.post('https://api.openai.com/v1/chat/completions', () => {
		return HttpResponse.json({
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
		})
	}),
]

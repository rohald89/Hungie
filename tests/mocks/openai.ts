import { HttpResponse, http, type HttpHandler, passthrough } from 'msw'
import { faker } from '@faker-js/faker'

const { json } = HttpResponse

function createOpenAIResponse() {
	return {
		id: faker.string.uuid(),
		object: 'chat.completion',
		created: Date.now(),
		model: 'gpt-4-vision-preview',
		usage: {
			prompt_tokens: 123,
			completion_tokens: 456,
			total_tokens: 579,
		},
		choices: [
			{
				message: {
					role: 'assistant',
					content: JSON.stringify({
						detectedIngredients: [
							{
								name: faker.commerce.productName(),
								category: faker.commerce.department(),
								quantity: faker.number.int({ min: 1, max: 5 }).toString(),
							},
						],
						suggestedRecipes: [
							{
								title: faker.commerce.productName(),
								cookingTime: `${faker.number.int({ min: 10, max: 60 })} mins`,
								difficulty: faker.helpers.arrayElement(['Easy', 'Medium', 'Hard']),
								ingredients: [
									{
										item: faker.commerce.productName(),
										amount: `${faker.number.int({ min: 1, max: 5 })} cups`,
										required: faker.datatype.boolean(),
									},
								],
								instructions: [faker.lorem.sentence()],
								nutritionalInfo: {
									calories: `${faker.number.int({ min: 100, max: 1000 })}`,
									protein: `${faker.number.int({ min: 5, max: 50 })}g`,
									carbs: `${faker.number.int({ min: 10, max: 100 })}g`,
									fat: `${faker.number.int({ min: 2, max: 30 })}g`,
								},
							},
						],
					}),
				},
				finish_reason: 'stop',
				index: 0,
			},
		],
	}
}

const passthroughOpenAI =
	!process.env.OPENAI_API_KEY?.startsWith('MOCK_') &&
	process.env.NODE_ENV !== 'test'

export const handlers: Array<HttpHandler> = [
	http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
		if (passthroughOpenAI) return passthrough()

		// Log the request for debugging
		console.log('OpenAI request:', {
			url: request.url,
			headers: Object.fromEntries(request.headers.entries()),
			body: await request.json(),
		})

		return json(createOpenAIResponse(), {
			headers: {
				'Content-Type': 'application/json',
				'OpenAI-Organization': 'mock-org',
				'OpenAI-Processing-Ms': '750',
				'OpenAI-Version': '2020-10-01',
				'x-request-id': faker.string.uuid(),
			},
		})
	}),
]

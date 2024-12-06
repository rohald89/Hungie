import { z } from 'zod'
import { OpenAIProvider } from './providers/openai.server.ts'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

const openai = OpenAIProvider.client()

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
export type Difficulty = typeof DIFFICULTIES[number]

const RecipeSchema = z.object({
	title: z.string(),
	cookingTime: z.number().min(1),
	difficulty: z.enum(DIFFICULTIES),
	ingredients: z.array(
		z.object({
			item: z.string(),
			amount: z.string(),
		}),
	),
	instructions: z.array(z.string()),
	nutritionalInfo: z.object({
		calories: z.number().min(0),
		protein: z.number().min(0),
		carbs: z.number().min(0),
		fat: z.number().min(0),
	}),
})

const RecipeResponseSchema = z.object({
	detectedIngredients: z.array(
		z.object({
			name: z.string(),
			category: z.string(),
			quantity: z.string().optional(),
		}),
	),
	suggestedRecipes: z.array(RecipeSchema),
})

export type Recipe = z.infer<typeof RecipeSchema>
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>

export const IngredientsSchema = z.object({
	dairy: z.array(z.string()),
	meat: z.array(z.string()),
	beverages: z.array(z.string()),
	produce: z.array(z.string()),
	condiments: z.array(z.string()),
	packaged: z.array(z.string()),
})

export type Ingredients = z.infer<typeof IngredientsSchema>

type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant'
	content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export async function analyzeFridgeContents(imageUrls: Array<string>) {
	const messages: Array<OpenAIMessage> = [
		{
			role: 'system',
			content: `You are a helpful kitchen assistant that identifies ingredients in a fridge or pantry.
            If the images are empty, completely unclear, or contain no food-related items, respond with "NO_INGREDIENTS_FOUND".
            Otherwise, return a JSON object with the following categories as arrays:
            {
                "dairy": ["milk", "yogurt", "cheese"],
                "meat": ["beef", "chicken", "pork"],
                "beverages": ["juice", "soda", "water"],
                "produce": ["lettuce", "tomatoes", "carrots"],
                "condiments": ["mayonnaise", "mustard", "ketchup"],
                "packaged": ["bread", "cereal", "pasta"]
            }

            Guidelines:
            - You MUST identify at least 2-3 items for each category! returning less items for a category will result in a failure
            - If a category seems empty, make educated guesses based on:
              - Partially visible items
              - Common items typically stored together
              - Shapes and containers that suggest certain foods
              - Common kitchen staples for that category
            - If uncertain about a specific item, list it as what it most likely is based on:
              - Container shape/size
              - Storage location
              - Color and appearance
              - Common household patterns
            - Use lowercase for all items
            - Keep descriptions simple and direct
            - Group similar items (e.g., if you see multiple cheeses, list as "cheese")
            - For packaged items, focus on the main content rather than the brand
            - Place items in their most commonly associated category
            - Prioritize accuracy while ensuring each category has meaningful suggestions

            Remember: The goal is to provide a comprehensive and useful inventory while maintaining reasonable accuracy. Make informed assumptions when necessary to ensure 2-3 items per category.`
		},
	]

	imageUrls.forEach((url, index) => {
		messages.push({
			role: 'user',
			content: [
				{
					type: 'text',
					text: `What ingredients can you identify in image ${index + 1}?`,
				},
				{
					type: 'image_url',
					image_url: { url },
				},
			],
		} as const)
	})

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o',
		messages: messages as ChatCompletionMessageParam[],
		max_tokens: 500,
		response_format: { type: 'json_object' },
	})

	const content = completion.choices[0]?.message.content ?? ''
	console.log('content', content)
	return content === 'NO_INGREDIENTS_FOUND' ? null : JSON.parse(content)
}

export async function generateRecipes(ingredients: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You are a cooking assistant that generates recipes. The ingredients will be provided in a format like "category: item1, item2; category2: item3, item4".
					Generate 3 diverse recipes that make good use of the available ingredients.
					Return a raw JSON response (no markdown formatting) with the following structure:
					{
						"detectedIngredients": [
							{ "name": string, "category": string, "quantity": string }
						],
						"suggestedRecipes": [{
							"title": string,
							"cookingTime": number,
							"difficulty": "EASY" | "MEDIUM" | "HARD",
							"ingredients": [
								{ "item": string, "amount": string }
							],
							"instructions": string[],
							"nutritionalInfo": {
								"calories": number,
								"protein": number,
								"carbs": number,
								"fat": number
							}
						}]
					}`,
			},
			{
				role: 'user',
				content: `Generate recipes using these ingredients: ${ingredients}`,
			},
		],
	})

	const content = completion.choices[0]?.message.content ?? ''
	// Clean markdown formatting if present
	const jsonString = content.replace(/```json\n?|\n?```/g, '').trim()

	const parsed = RecipeResponseSchema.safeParse(JSON.parse(jsonString))

	if (!parsed.success) {
		console.error('Failed to parse recipe response:', parsed.error)
		throw new Error('Failed to generate recipes')
	}

	return parsed.data
}

export async function analyzeImage(imageUrl: string) {
	const ingredients = await analyzeFridgeContents([imageUrl])
	if (!ingredients) {
		throw new Error('No ingredients were detected in the image. Please try again with a clearer photo of food items')
	}
	return ingredients
}

export async function generateRecipesFromIngredients(ingredients: string) {
	const recipes = await generateRecipes(ingredients)
	return recipes
}

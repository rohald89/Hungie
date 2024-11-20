import { OpenAI } from 'openai'
import { z } from 'zod'

const openai = new OpenAI()

const RecipeSchema = z.object({
	title: z.string(),
	cookingTime: z.string(),
	difficulty: z.string(),
	ingredients: z.array(
		z.object({
			item: z.string(),
			amount: z.string(),
			required: z.boolean(),
		}),
	),
	instructions: z.array(z.string()),
	nutritionalInfo: z.object({
		calories: z.string(),
		protein: z.string(),
		carbs: z.string(),
		fat: z.string(),
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

export async function analyzeFridgeContents(imageUrl: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					'You are a kitchen assistant that identifies ingredients in a fridge or pantry. List all visible food items and ingredients, categorized by type (produce, dairy, meat, etc). Only include items that are clearly visible and identifiable.',
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'What ingredients can you identify in this image? Group them by category.',
					},
					{
						type: 'image_url',
						image_url: {
							url: imageUrl,
						},
					},
				],
			},
		],
		max_tokens: 500,
	})

	return completion.choices[0]?.message.content ?? ''
}

export async function generateRecipes(ingredients: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You are a creative chef. Generate 3 possible recipes using the provided ingredients.
				Focus on recipes that use mostly the available ingredients, but you can suggest a few additional ingredients if needed.
				For each recipe, include:
				- Title
				- Cooking time
				- Difficulty level
				- List of ingredients (marking which ones are from the user's fridge and which need to be bought)
				- Step-by-step instructions (do not number the steps)
				- Basic nutritional information

				Format your response as a JSON object matching this structure:
				{
					"detectedIngredients": [
						{ "name": string, "category": string, "quantity": string }
					],
					"suggestedRecipes": [
						{
							"title": string,
							"cookingTime": string,
							"difficulty": string,
							"ingredients": [
								{ "item": string, "amount": string, "required": boolean }
							],
							"instructions": string[],
							"nutritionalInfo": {
								"calories": string,
								"protein": string,
								"carbs": string,
								"fat": string
							}
						}
					]
				}`,
			},
			{
				role: 'user',
				content: `Generate recipes using these ingredients: ${ingredients}`,
			},
		],
		response_format: { type: 'json_object' },
	})

	const parsed = RecipeResponseSchema.safeParse(
		JSON.parse(completion.choices[0]?.message.content ?? ''),
	)

	if (!parsed.success) {
		console.error('Failed to parse recipe response:', parsed.error)
		throw new Error('Failed to generate recipes')
	}

	return parsed.data
}

export async function analyzeAndGenerateRecipes(imageUrl: string) {
	const ingredients = await analyzeFridgeContents(imageUrl)
	const recipes = await generateRecipes(ingredients)
	return {
		ingredients,
		recipes,
	}
}

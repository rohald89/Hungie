import { type Recipe as AIRecipe } from './ai.server'
import { prisma } from './db.server'
import { OpenAIProvider } from './providers/openai.server'

const openai = OpenAIProvider.client()

async function generateAndSaveImage(title: string, recipeId: string) {
	const completion = await openai.images.generate({
		model: 'dall-e-3',
		prompt: `A professional food photography style image of ${title}. The image should be well-lit, appetizing, and styled like a cookbook photo.`,
		size: '1024x1024',
		quality: 'standard',
		n: 1,
	})

	const imageUrl = completion.data[0]?.url
	if (!imageUrl) throw new Error('Failed to generate image')

	const response = await fetch(imageUrl)
	const buffer = Buffer.from(await response.arrayBuffer())

	await prisma.recipeImage.create({
		data: {
			recipeId,
			contentType: 'image/jpeg',
			blob: buffer,
			altText: `AI generated image of ${title}`,
		},
	})
}

export async function saveRecipe({
	recipe,
	userId,
}: {
	recipe: AIRecipe
	userId: string
}) {
	const savedRecipe = await prisma.recipe.create({
		data: {
			title: recipe.title,
			cookingTime: recipe.cookingTime,
			difficulty: recipe.difficulty,
			instructions: JSON.stringify(recipe.instructions),
			calories: recipe.nutritionalInfo.calories,
			protein: recipe.nutritionalInfo.protein,
			carbs: recipe.nutritionalInfo.carbs,
			fat: recipe.nutritionalInfo.fat,
			userId,
			ingredients: {
				create: recipe.ingredients.map(ingredient => ({
					item: ingredient.item,
					amount: ingredient.amount,
				})),
			},
		},
		include: {
			ingredients: true,
			image: true,
		},
	})

	// Generate image after recipe is saved
	await generateAndSaveImage(recipe.title, savedRecipe.id)

	return savedRecipe
}

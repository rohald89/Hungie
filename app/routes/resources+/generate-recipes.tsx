import { json, type ActionFunctionArgs } from '@remix-run/node'
import { generateRecipesFromIngredients } from '#app/utils/ai.server'
import { requireUserId } from '#app/utils/auth.server'
import { saveRecipe } from '#app/utils/recipes.server'
import { prisma } from '#app/utils/db.server'

export async function action({ request }: ActionFunctionArgs) {
	try {
		const userId = await requireUserId(request)
		const formData = await request.formData()
		const ingredients = formData.get('ingredients')
		const scanId = formData.get('scanId')

		if (typeof ingredients !== 'string' || typeof scanId !== 'string') {
			return json({ error: 'Invalid request parameters' }, { status: 400 })
		}

		// Verify scan ownership
		const scan = await prisma.scan.findFirst({
			where: { id: scanId, userId },
			select: { id: true },
		})
		if (!scan) {
			return json({ error: 'Scan not found' }, { status: 404 })
		}

		const recipes = await generateRecipesFromIngredients(ingredients)

		// Save all generated recipes with scan relationship
		await Promise.all(
			recipes.suggestedRecipes.map((recipe) =>
				saveRecipe({ recipe, userId, scanId: scan.id }),
			),
		)

		return json(recipes)
	} catch (error) {
		console.error('Failed to generate recipes:', error)
		return json(
			{
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			},
			{ status: 500 },
		)
	}
}

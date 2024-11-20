import { json, type ActionFunctionArgs } from '@remix-run/node'
import { generateRecipesFromIngredients } from '#app/utils/ai.server'
import { requireUserId } from '#app/utils/auth.server'

export async function action({ request }: ActionFunctionArgs) {
	try {
		await requireUserId(request)

		const body = await request.json()
		if (!body || typeof body !== 'object' || !('ingredients' in body)) {
			return json({ error: 'Invalid request body' }, { status: 400 })
		}
		const { ingredients } = body
		if (typeof ingredients !== 'string') {
			return json({ error: 'Ingredients must be a string' }, { status: 400 })
		}

		const recipes = await generateRecipesFromIngredients(ingredients)
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

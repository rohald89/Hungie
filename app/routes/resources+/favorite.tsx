import { json, type ActionFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const recipeId = formData.get('recipeId')

	if (typeof recipeId !== 'string') {
		return json({ error: 'Recipe ID is required' }, { status: 400 })
	}

	const existingFavorite = await prisma.favorite.findUnique({
		where: {
			userId_recipeId: {
				userId,
				recipeId,
			},
		},
	})

	if (existingFavorite) {
		await prisma.favorite.delete({
			where: { id: existingFavorite.id },
		})
		return json(
			{ isFavorited: false },
			{
				headers: {
					'X-Remix-Revalidate': 'routes/recipes,routes/scan+/$scanId_+/recipes',
				},
			},
		)
	}

	await prisma.favorite.create({
		data: {
			userId,
			recipeId,
		},
	})

	return json(
		{ isFavorited: true },
		{
			headers: {
				'X-Remix-Revalidate': 'routes/recipes,routes/scan+/$scanId_+/recipes',
			},
		},
	)
}

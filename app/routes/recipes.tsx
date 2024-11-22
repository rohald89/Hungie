import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { RecipeCard } from '#app/components/recipe-card'
import { prisma } from '#app/utils/db.server'
import { requireUserId } from '#app/utils/auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('search')

	const recipes = await prisma.recipe.findMany({
		where: {
			userId,
			OR: query
				? [
						{ title: { contains: query } },
						{
							ingredients: {
								some: { item: { contains: query } },
							},
						},
					]
				: undefined,
		},
		include: { ingredients: true },
		orderBy: { createdAt: 'desc' },
	})

	return json({
		status: 'idle',
		recipes,
	})
}

export default function RecipesRoute() {
	const { recipes } = useLoaderData<typeof loader>()

	if (!recipes.length) {
		return (
			<div className="container py-8">
				<h1 className="mb-8 text-3xl font-bold">My Recipes</h1>
				<div className="text-center text-muted-foreground">
					<p>No recipes yet.</p>
					<p className="text-sm">
						Scan your fridge to get personalized recipe suggestions!
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">My Recipes</h1>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{recipes.map((recipe) => (
					<RecipeCard
						key={recipe.id}
						recipe={{
							...recipe,
							instructions: JSON.parse(recipe.instructions) as string[],
							difficulty: recipe.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
							nutritionalInfo: {
								calories: recipe.calories,
								protein: recipe.protein,
								carbs: recipe.carbs,
								fat: recipe.fat,
							},
						}}
					/>
				))}
			</div>
		</div>
	)
}

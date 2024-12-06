import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { RecipeCard } from '#app/components/recipe-card'
import { SearchBar } from '#app/components/search-bar'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

const RECIPES_PER_PAGE = 6

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('search')
	const page = Number(searchParams.get('page') || '1')
	const skip = (page - 1) * RECIPES_PER_PAGE

	const [recipes, totalRecipes] = await Promise.all([
		prisma.recipe.findMany({
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
			include: { ingredients: true, image: true },
			orderBy: { createdAt: 'desc' },
			take: RECIPES_PER_PAGE,
			skip,
		}),
		prisma.recipe.count({
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
		}),
	])

	const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE)

	return json({
		status: 'idle',
		recipes,
		pagination: {
			currentPage: page,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		},
	})
}

export default function RecipesRoute() {
	const { recipes, pagination } = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const query = searchParams.get('search')

	if (!recipes.length) {
		return (
			<div className="container py-8">
				<div className="flex justify-between">
					<h1 className="text-3xl font-bold">My Recipes</h1>
					<div className="w-1/3">
						<SearchBar status="idle" autoSubmit />
					</div>
				</div>
				<div className="mt-8 text-center text-muted-foreground">
					<p>No recipes found.</p>
					<p className="text-sm">
						{query
							? 'Try adjusting your search'
							: 'Scan your fridge to get started!'}
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container py-8">
			<div className="flex flex-col gap-8">
				<div className="flex justify-between">
					<h1 className="text-3xl font-bold">My Recipes</h1>
					<div className="w-1/3">
						<SearchBar status="idle" autoSubmit />
					</div>
				</div>

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

				<div className="flex justify-center gap-2">
					{pagination.hasPrevPage ? (
						<Link
							to={`?${new URLSearchParams({
								...Object.fromEntries(searchParams),
								page: String(pagination.currentPage - 1),
							})}`}
							className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground"
						>
							Previous
						</Link>
					) : null}
					<span className="flex items-center text-muted-foreground">
						Page {pagination.currentPage} of {pagination.totalPages}
					</span>
					{pagination.hasNextPage ? (
						<Link
							to={`?${new URLSearchParams({
								...Object.fromEntries(searchParams),
								page: String(pagination.currentPage + 1),
							})}`}
							className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground"
						>
							Next
						</Link>
					) : null}
				</div>
			</div>
		</div>
	)
}

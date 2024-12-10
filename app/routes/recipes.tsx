import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useRouteLoaderData, useSearchParams } from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper.js'
import { RecipeCard } from '#app/components/recipe-card.js'
import { SearchBar } from '#app/components/search-bar.js'
import { getUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

export const meta = () => [{ title: 'Hungie' }]

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('search')

	const recipes = await prisma.recipe.findMany({
		where: query
			? {
					OR: [
						{ title: { contains: query } },
						{ ingredients: { some: { item: { contains: query } } } },
					],
				}
			: undefined,
		select: {
			id: true,
			title: true,
			difficulty: true,
			cookingTime: true,
			calories: true,
			favorites: userId
				? {
						where: { userId },
						select: { id: true },
					}
				: undefined,
		},
		orderBy: { createdAt: 'desc' },
	})

	return json({
		recipes: recipes.map((recipe) => ({
			...recipe,
			isFavorited: recipe.favorites?.length > 0,
			favorites: undefined,
		})),
		status: 'idle' as const,
	})
}

export default function Index() {
	return (
		<>
			<p className="text-5xl">🍽️</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">Explore Recipes</h2>
			<p className="mt-4 text-body-md">
				See what others are making here on Hungie with our global list of
				recipes!
			</p>
		</>
	)
}

export const handle = {
	panel: PanelContent,
}

function PanelContent() {
	const data = useRouteLoaderData<typeof loader>('routes/recipes')
	const [searchParams] = useSearchParams()
	const query = searchParams.get('search')

	return (
		<PanelWrapper title="Explore Recipes" rightButton={false}>
			<div className="mb-8 w-full">
				<SearchBar
					autoSubmit
					formAction="/recipes"
					placeholder="Search recipes..."
				/>
			</div>
			<div className="mt-8 flex flex-col gap-8 pb-10">
				{data?.recipes.length === 0 ? (
					<p className="text-center text-muted-foreground">
						{query
							? 'No recipes found. Try adjusting your search.'
							: 'No recipes have been added yet.'}
					</p>
				) : (
					data?.recipes.map((recipe) => (
						<RecipeCard key={recipe.id} recipe={recipe} />
					))
				)}
			</div>
		</PanelWrapper>
	)
}

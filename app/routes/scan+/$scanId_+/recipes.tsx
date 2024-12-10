import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper'
import { RecipeCard } from '#app/components/recipe-card.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	const scan = await prisma.scan.findUnique({
		where: { id: params.scanId },
		select: {
			id: true,
			userId: true,
			recipes: {
				select: {
					id: true,
					title: true,
					difficulty: true,
					cookingTime: true,
					calories: true,
					favorites: {
						where: { userId },
						select: { id: true },
					},
				},
			},
		},
	})

	if (!scan) {
		throw new Response('Not found', { status: 404 })
	}

	if (scan.userId !== userId) {
		throw new Response('Not found', { status: 404 })
	}

	return json({
		scan: {
			...scan,
			recipes: scan.recipes.map(recipe => ({
				...recipe,
				isFavorited: recipe.favorites.length > 0,
				favorites: undefined,
			})),
		},
	})
}

function RecipesPanel() {
	const data = useRouteLoaderData<typeof loader>(
		'routes/scan+/$scanId_+/recipes',
	)

	return (
		<PanelWrapper title="Recipes">
			{!data?.scan?.recipes?.length ? (
				<NoRecipes />
			) : (
				<div className="mt-8 flex flex-col gap-8">
					{data.scan.recipes.map((recipe) => (
						<RecipeCard key={recipe.id} recipe={recipe} />
					))}
				</div>
			)}
		</PanelWrapper>
	)
}

export const handle = {
	panel: RecipesPanel,
}

export default function RecipesRoute() {
	return (
		<>
			<p className="text-5xl">📝</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">Step 2</h2>
			<p className="mt-4 text-body-md">Your recipes are ready!</p>
			<p className="mt-4 text-body-md">Choose one to start cooking.</p>
		</>
	)
}

function NoRecipes() {
	return (
		<div className="flex h-full items-center justify-center">
			<p className="text-body-md text-muted-foreground">No recipes found</p>
			<Button>
				<Icon name="plus" />
				Generate recipe
			</Button>
		</div>
	)
}

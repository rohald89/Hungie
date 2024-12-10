import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useNavigate, useRouteLoaderData } from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper'
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

	return json({ scan })
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
		<main className="mt-40">
			<p className="text-h2">📝</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">Step 2</h2>
			<p className="mt-4 text-body-md">Your recipes are ready!</p>
			<p className="mt-4 text-body-md">Choose one to start cooking.</p>
		</main>
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

type SerializedRecipe = {
	id: string
	title: string
	difficulty: string
	cookingTime: number
	calories: number
}

function RecipeCard({ recipe }: { recipe: SerializedRecipe }) {
	return (
		<div className="rounded-md bg-[#E8ECF9] px-8">
			<div className="flex items-center justify-between border-b-2 border-b-[#C6CEED] py-6">
				<h3 className="text-h7">{recipe.title}</h3>
				<Button
					asChild
					variant="ghost"
					className="h-auto p-0 text-body-sm underline"
				>
					<Link to={`/scan/${recipe.id}/recipes/${recipe.id}`}>
						View recipe
					</Link>
				</Button>
			</div>
			<div className="flex items-center justify-between py-6">
				<div className="flex items-center gap-4">
					<p className="text-body-sm capitalize text-muted-foreground">
						👨‍🍳 {recipe.difficulty.toLowerCase()}
					</p>
					<p className="text-body-sm text-muted-foreground">
						⏲️ {recipe.cookingTime} minutes
					</p>
					<p className="text-body-sm text-muted-foreground">
						🥘 {recipe.calories} calories
					</p>
				</div>
			</div>
		</div>
	)
}

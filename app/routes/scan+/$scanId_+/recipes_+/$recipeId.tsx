import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useFetcher, useRouteLoaderData } from '@remix-run/react'
import { PanelWrapper } from '#app/components/panel-wrapper.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { useEffect } from 'react'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	const recipe = await prisma.recipe.findUnique({
		where: { id: params.recipeId },
		select: {
			id: true,
			title: true,
			difficulty: true,
			cookingTime: true,
			calories: true,
			protein: true,
			carbs: true,
			fat: true,
			instructions: true,
			ingredients: true,
			image: {
				select: {
					id: true,
					altText: true,
					contentType: true,
				},
			},
			scan: {
				select: {
					userId: true,
				},
			},
		},
	})

	if (!recipe) {
		throw new Response('Not found', { status: 404 })
	}

	if (recipe.scan?.userId !== userId) {
		throw new Response('Not found', { status: 404 })
	}

	return json({
		recipe: {
			...recipe,
			instructions: JSON.parse(recipe.instructions) as Array<string>,
		},
	})
}

function RecipePanel() {
	const imageFetcher = useFetcher<{ imageUrl: string }>()
	const data = useRouteLoaderData<typeof loader>(
		'routes/scan+/$scanId_+/recipes_+/$recipeId',
	)

	useEffect(() => {
		if (data?.recipe && !data.recipe.image) {
			imageFetcher.submit(
				{ recipeId: data.recipe.id, title: data.recipe.title },
				{ method: 'POST', action: '/resources/generate-recipe-image' },
			)
		}
	}, [data?.recipe, imageFetcher])

	if (!data) return null

	const { recipe } = data
	const imageUrl = recipe.image?.id
		? `/resources/recipe-images/${recipe.image.id}`
		: imageFetcher.data?.imageUrl

	return (
		<PanelWrapper title={recipe.title}>
			<div className="space-y-8">
				<div className="rounded-lg bg-muted">
					{imageUrl && (
						<div className="aspect-video">
							<img
								src={imageUrl}
								alt={recipe.title}
								className="h-full w-full rounded-t-lg object-cover"
							/>
						</div>
					)}
					<div className="flex items-center justify-center gap-10 py-8">
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

				<div>
					<h2 className="text-h4">Ingredients</h2>
					<ul className="mt-6 flex flex-wrap gap-y-5">
						{recipe.ingredients.map((ingredient, index) => (
							<li key={index} className="flex basis-1/2 items-center gap-2">
								<div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50">
									<Icon
										name="check2"
										className="h-4 w-4 translate-x-1/2 text-blue-900"
									/>
								</div>
								<span className="text-body-md">{ingredient.item}</span>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h2 className="text-h4">Instructions</h2>
					<ol className="mt-2 list-inside list-decimal space-y-2">
						{recipe.instructions.map((instruction, index) => (
							<li key={index} className="text-body-md">
								{instruction}
							</li>
						))}
					</ol>
				</div>
			</div>
		</PanelWrapper>
	)
}

export const handle = {
	panel: RecipePanel,
}

export default function RecipeRoute() {
	return (
		<main className="mt-40">
			<p className="text-h2">🥘</p>
			<h2 className="mt-5 text-h6 text-muted-foreground">Step 3</h2>
			<p className="mt-4 text-body-md">
				Here are your personalized recipes based on your available ingredients.
			</p>
			<p className="mt-4 text-body-md">
				Select a recipe to view its details and cooking instructions.
			</p>
		</main>
	)
}

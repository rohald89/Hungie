import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useFetcher, useNavigate, useRouteLoaderData } from '@remix-run/react'
import { useCallback } from 'react'
import { PanelWrapper } from '#app/components/panel-wrapper.js'
import { Icon } from '#app/components/ui/icon.js'
import { getUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { useOptionalUser } from '#app/utils/user'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
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
			favorites: userId
				? {
						where: { userId },
						select: { id: true },
					}
				: undefined,
		},
	})

	if (!recipe) {
		throw new Response('Not found', { status: 404 })
	}

	return json({
		recipe: {
			...recipe,
			instructions: JSON.parse(recipe.instructions) as Array<string>,
			isFavorited: recipe.favorites?.length > 0 ?? false,
			favorites: undefined,
		},
	})
}

function RecipePanel() {
	const navigate = useNavigate()
	const user = useOptionalUser()
	const favoriteFetcher = useFetcher<{ isFavorited: boolean }>()
	const data = useRouteLoaderData<typeof loader>('routes/recipes.$recipeId')

	const handleFavorite = useCallback(() => {
		if (!data?.recipe) return
		favoriteFetcher.submit(
			{ recipeId: data.recipe.id },
			{ method: 'post', action: '/resources/favorite' },
		)
	}, [data?.recipe, favoriteFetcher])

	if (!data) return null

	const { recipe } = data
	const imageUrl = recipe.image?.id
		? `/resources/recipe-images/${recipe.image.id}`
		: null

	const isFavorited =
		favoriteFetcher.data?.isFavorited ?? recipe.isFavorited ?? false

	return (
		<PanelWrapper
			title={recipe.title}
			leftButton={{
				icon: <Icon name="arrow-left1" className="h-5 w-5" />,
				className: 'bg-white hover:bg-white transition hover:-translate-x-1',
				onClick: () => navigate(-1),
				ariaLabel: 'Navigate back',
			}}
			rightButton={
				user
					? {
							icon: (
								<Icon
									name="star"
									className="h-5 w-5"
									data-state={isFavorited ? 'favorited' : 'unfavorited'}
									style={{
										fill: isFavorited ? 'currentColor' : 'none',
									}}
								/>
							),
							className:
								'bg-white hover:bg-white data-[state=favorited]:text-yellow-500 data-[state=unfavorited]:text-muted-foreground',
							onClick: handleFavorite,
							ariaLabel: isFavorited
								? 'Remove from favorites'
								: 'Add to favorites',
						}
					: undefined
			}
		>
			<div className="space-y-8">
				<div className="rounded-lg bg-muted">
					{imageUrl ? (
						<div className="max-h-56 w-full">
							<img
								src={imageUrl}
								alt={recipe.title}
								className="max-h-56 w-full rounded-t-lg object-cover"
							/>
						</div>
					) : null}
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

				<div className="pb-12">
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
	return null
}

import { type Recipe as AIRecipe } from '#app/utils/ai.server'
import { cn } from '#app/utils/misc.js'
import { useFetcher } from '@remix-run/react'
import { useEffect } from 'react'

type DatabaseRecipe = {
	id: string
	title: string
	cookingTime: number
	difficulty: string
	ingredients: Array<{ item: string; amount: string }>
	nutritionalInfo: {
		calories: number
		protein: number
		carbs: number
		fat: number
	}
	image?: { id: string } | null
}

export function RecipeCard({
	recipe,
	size = 'md',
}: {
	recipe: DatabaseRecipe
	size?: 'sm' | 'md'
}) {
	const imageFetcher = useFetcher<{ imageUrl: string }>()

	useEffect(() => {
		if (!('image' in recipe) && recipe.id) {
			imageFetcher.submit(
				{ recipeId: recipe.id, title: recipe.title },
				{ method: 'POST', action: '/resources/generate-recipe-image' },
			)
		}
	}, [recipe.id])

	const imageUrl =
		'image' in recipe && recipe.image?.id
			? `/resources/recipe-images/${recipe.image.id}`
			: imageFetcher.data?.imageUrl

	return (
		<div
			className={cn(
				'flex h-full flex-col rounded-lg border',
				size === 'sm' ? 'p-4' : 'space-y-4 p-6',
			)}
		>
			{imageUrl && (
				<img
					src={imageUrl}
					alt={recipe.title}
					className="aspect-video w-full rounded-md object-cover"
				/>
			)}
			<div>
				<h3
					className={cn('font-semibold', size === 'sm' ? 'text-lg' : 'text-xl')}
				>
					{recipe.title}
				</h3>
				<div className="mb-3 mt-2 flex items-center gap-4 text-sm text-muted-foreground">
					<span>{recipe.cookingTime} mins</span>
					<span>•</span>
					<span className="capitalize">{recipe.difficulty.toLowerCase()}</span>
				</div>
			</div>

			{size === 'md' && (
				<div className="flex-1">
					<h4 className="font-medium">Ingredients</h4>
					<ul className="mt-2 space-y-1 text-sm">
						{recipe.ingredients.slice(0, 3).map((ingredient) => (
							<li key={ingredient.item}>
								{ingredient.amount} {ingredient.item}
							</li>
						))}
						{recipe.ingredients.length > 3 && (
							<li className="text-muted-foreground">
								+{recipe.ingredients.length - 3} more
							</li>
						)}
					</ul>
				</div>
			)}

			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<div className="text-muted-foreground">Calories</div>
					<div className="font-medium">{recipe.nutritionalInfo.calories}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Protein</div>
					<div className="font-medium">{recipe.nutritionalInfo.protein}g</div>
				</div>
			</div>
		</div>
	)
}

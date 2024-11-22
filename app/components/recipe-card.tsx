import { type Recipe } from '#app/utils/ai.server'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
	return (
		<div className="flex h-full flex-col space-y-4 rounded-lg border p-6">
			<div>
				<h3 className="text-xl font-semibold">{recipe.title}</h3>
				<div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
					<span>{recipe.cookingTime} mins</span>
					<span>•</span>
					<span className="capitalize">{recipe.difficulty.toLowerCase()}</span>
				</div>
			</div>

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

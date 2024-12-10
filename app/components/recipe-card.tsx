import { Link } from '@remix-run/react'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

type SerializedRecipe = {
	id: string
	title: string
	difficulty: string
	cookingTime: number
	calories: number
}

export function RecipeCard({ recipe }: { recipe: SerializedRecipe }) {
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
						View Recipe
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
				<Button variant="ghost" size="icon">
					<Icon name="star" className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}

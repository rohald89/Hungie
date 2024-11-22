import { type Recipe as AIRecipe } from './ai.server'
import { prisma } from './db.server'

export async function saveRecipe({
	recipe,
	userId,
}: {
	recipe: AIRecipe
	userId: string
}) {
	return prisma.recipe.create({
		data: {
			title: recipe.title,
			cookingTime: recipe.cookingTime,
			difficulty: recipe.difficulty,
			instructions: JSON.stringify(recipe.instructions),
			calories: recipe.nutritionalInfo.calories,
			protein: recipe.nutritionalInfo.protein,
			carbs: recipe.nutritionalInfo.carbs,
			fat: recipe.nutritionalInfo.fat,
			userId,
			ingredients: {
				create: recipe.ingredients.map(ingredient => ({
					item: ingredient.item,
					amount: ingredient.amount,
				})),
			},
		},
		include: {
			ingredients: true,
		},
	})
}

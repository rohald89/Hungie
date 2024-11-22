import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { FridgeImageInput } from '#app/components/fridge-image-input'
import { requireUserId } from '#app/utils/auth.server.js'
import { useState } from 'react'
import { type RecipeResponse } from '#app/utils/ai.server'
import { useDelayedIsPending } from '#app/utils/misc.js'
import { RecipeCard } from '#app/components/recipe-card'

export const meta: MetaFunction = () => [{ title: 'Scan Fridge | RecipeRadar' }]

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return null
}

export default function ScanRoute() {
	const isPending = useDelayedIsPending({
		formAction: '/resources/generate-recipes',
		delay: 300,
		minDuration: 1000,
	})
	const [result, setResult] = useState<RecipeResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">Scan Your Fridge</h1>
			<FridgeImageInput
				onAnalyzeStart={() => {
					setError(null)
				}}
				onAnalyzeComplete={(data) => {
					setResult(data)
				}}
				onError={(err) => {
					setError(err)
				}}
			/>

			{isPending ? (
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<RecipeSkeleton />
					<RecipeSkeleton />
					<RecipeSkeleton />
				</div>
			) : error ? (
				<div className="mt-8 rounded-md bg-destructive/10 p-4 text-destructive">
					{error}
				</div>
			) : result ? (
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{result.suggestedRecipes.map((recipe, i) => (
						<div
							key={recipe.title}
							className="animate-fade-up"
							style={{ animationDelay: `${i * 150}ms` }}
						>
							<RecipeCard recipe={recipe} size="sm" />
						</div>
					))}
				</div>
			) : null}
		</div>
	)
}

export function RecipeSkeleton() {
	return (
		<div className="animate-pulse space-y-4 rounded-lg border p-4">
			<div className="h-6 w-3/4 rounded bg-muted" />
			<div className="space-y-2">
				<div className="h-4 w-1/4 rounded bg-muted" />
				<div className="h-4 w-1/3 rounded bg-muted" />
			</div>
			<div className="space-y-2">
				<div className="h-4 w-full rounded bg-muted" />
				<div className="h-4 w-5/6 rounded bg-muted" />
			</div>
		</div>
	)
}

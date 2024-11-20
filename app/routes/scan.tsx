import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { FridgeImageInput } from '#app/components/fridge-image-input'
import { requireUserId } from '#app/utils/auth.server.js'
import { useState } from 'react'
import { type RecipeResponse } from '#app/utils/ai.server'

export const meta: MetaFunction = () => [{ title: 'Scan Fridge | RecipeRadar' }]

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return null
}

export default function ScanRoute() {
	const [stage, setStage] = useState<'idle' | 'analyzing' | 'generating'>('idle')
	const [result, setResult] = useState<RecipeResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">Scan Your Fridge</h1>
			<FridgeImageInput
				onAnalyzeStart={() => {
					setStage('analyzing')
					setError(null)
				}}
				onAnalyzeComplete={(data) => {
					setStage('idle')
					setResult(data)
				}}
				onError={(err) => {
					setStage('idle')
					setError(err)
				}}
				onGeneratingRecipes={() => {
					setStage('generating')
				}}
			/>

			{stage === 'analyzing' ? (
				<div className="mt-8 text-center text-muted-foreground">
					<p>Analyzing your fridge contents...</p>
					<p className="text-sm">This may take up to 30 seconds</p>
				</div>
			) : stage === 'generating' ? (
				<div className="mt-8 text-center text-muted-foreground">
					<p>Generating recipe suggestions...</p>
					<p className="text-sm">Almost there!</p>
				</div>
			) : error ? (
				<div className="mt-8 rounded-md bg-destructive/10 p-4 text-destructive">
					{error}
				</div>
			) : result ? (
				<pre className="mt-8 whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
					{JSON.stringify(result, null, 2)}
				</pre>
			) : null}
		</div>
	)
}

import { type MetaFunction } from '@remix-run/node'
import { WebcamCapture } from '#app/components/webcam-capture.tsx'

export const meta: MetaFunction = () => [{ title: 'Scan Fridge | RecipeRadar' }]

export default function ScanRoute() {
	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">Scan Your Fridge</h1>
			<WebcamCapture />
		</div>
	)
}

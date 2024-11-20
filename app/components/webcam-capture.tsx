import { useRef, useState } from 'react'
import { Form, useNavigation } from '@remix-run/react'
import Webcam from 'react-webcam'
import { Button } from './ui/button'

const WEBCAM_CONSTRAINTS = {
	width: 720,
	height: 720,
	facingMode: { ideal: 'environment' },
	audio: false,
}

export function WebcamCapture() {
	const webcamRef = useRef<Webcam>(null)
	const [imageData, setImageData] = useState<string | null>(null)
	const [cameraError, setCameraError] = useState<string | null>(null)
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	function capture() {
		const imageSrc = webcamRef.current?.getScreenshot()
		setImageData(imageSrc ?? null)
	}

	function reset() {
		setImageData(null)
	}

	function handleUserMediaError(error: string | DOMException) {
		console.error('Webcam Error:', error)
		setCameraError(
			'Unable to access camera. Please ensure you have granted camera permissions.',
		)
	}

	return (
		<div className="mx-auto max-w-2xl">
			<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
				<div className="p-4">
					{cameraError ? (
						<div className="rounded-md bg-destructive/10 p-4 text-destructive">
							{cameraError}
						</div>
					) : imageData ? (
						<img
							src={imageData}
							alt="Captured"
							className="aspect-square w-full rounded-md object-cover"
						/>
					) : (
						<Webcam
							ref={webcamRef}
							screenshotFormat="image/jpeg"
							videoConstraints={WEBCAM_CONSTRAINTS}
							onUserMediaError={handleUserMediaError}
							className="aspect-square w-full rounded-md"
							mirrored={false}
						/>
					)}
				</div>
				<div className="flex items-center gap-2 p-4">
					{imageData ? (
						<>
							<Form method="POST" action="/resources/fridge-scan">
								<input type="hidden" name="image" value={imageData} />
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? 'Analyzing...' : 'Analyze Contents'}
								</Button>
							</Form>
							<Button variant="outline" onClick={reset}>
								Retake
							</Button>
						</>
					) : (
						<Button onClick={capture}>Take Photo</Button>
					)}
				</div>
			</div>
		</div>
	)
}

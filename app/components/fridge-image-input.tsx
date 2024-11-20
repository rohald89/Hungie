import { useRef, useState } from 'react'
import { Form, useNavigation, useActionData } from '@remix-run/react'
import Webcam from 'react-webcam'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

const WEBCAM_CONSTRAINTS = {
	width: 720,
	height: 720,
	facingMode: { ideal: 'environment' },
	audio: false,
}

function dataURLtoFile(dataurl: string, filename: string) {
	const arr = dataurl.split(',')
	const mime = arr[0]?.match(/:(.*?);/)?.[1]
	const bstr = atob(arr[1] ?? '')
	let n = bstr.length
	const u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new File([u8arr], filename, { type: mime })
}

export function FridgeImageInput() {
	const webcamRef = useRef<Webcam>(null)
	const [imageData, setImageData] = useState<string | null>(null)
	const [cameraError, setCameraError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [showCamera, setShowCamera] = useState(false)
	const [isWebcamReady, setIsWebcamReady] = useState(false)
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	function capture() {
		const imageSrc = webcamRef.current?.getScreenshot()
		setImageData(imageSrc ?? null)
		setShowCamera(false)
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setImageData(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	function reset() {
		setImageData(null)
		setShowCamera(false)
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSubmitError(null)

		if (!imageData) return

		try {
			const formData = new FormData()
			const file = dataURLtoFile(imageData, 'fridge-image.jpg')
			formData.append('image', file)

			const response = await fetch('/resources/fridge-scan', {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) {
				const data = (await response.json()) as { error?: string }
				throw new Error(data.error || 'Failed to analyze image')
			}

			const data = await response.json()
			console.log('Analysis result:', data)
			// Handle successful response here
		} catch (error) {
			console.error('Submission error:', error)
			setSubmitError(
				error instanceof Error ? error.message : 'Failed to submit image',
			)
		}
	}

	return (
		<div className="mx-auto max-w-2xl">
			<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
				<div className="p-4">
					{submitError ? (
						<div className="mb-4 rounded-md bg-destructive/10 p-4 text-destructive">
							{submitError}
						</div>
					) : null}
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
					) : showCamera ? (
						<div className="flex flex-col gap-4">
							<Webcam
								ref={webcamRef}
								screenshotFormat="image/jpeg"
								videoConstraints={WEBCAM_CONSTRAINTS}
								className="aspect-square w-full rounded-md"
								mirrored={false}
								onUserMedia={() => setIsWebcamReady(true)}
								onUserMediaError={(error) => {
									console.error('Webcam Error:', error)
									setCameraError(
										'Unable to access camera. Please ensure you have granted camera permissions.',
									)
								}}
							/>
							<Button
								onClick={capture}
								className="w-full"
								disabled={!isWebcamReady}
							>
								<Icon name="camera" className="mr-2" />
								Capture Photo
							</Button>
						</div>
					) : (
						<div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed">
							<div className="flex flex-col items-center gap-2">
								<Icon name="camera" className="h-8 w-8" />
								<span className="text-sm text-muted-foreground">
									Take a photo or upload an image
								</span>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2 p-4">
					{imageData ? (
						<>
							<form onSubmit={handleSubmit} encType="multipart/form-data">
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? 'Analyzing...' : 'Analyze Contents'}
								</Button>
							</form>
							<Button variant="outline" onClick={reset}>
								Start Over
							</Button>
						</>
					) : !showCamera ? (
						<div className="flex w-full gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setShowCamera(true)}
							>
								<Icon name="camera" className="mr-2" />
								Take Photo
							</Button>
							<div className="relative flex-1">
								<Button variant="outline" className="w-full">
									<Icon name="upload" className="mr-2" />
									Upload Image
								</Button>
								<input
									type="file"
									accept="image/*"
									onChange={handleFileChange}
									className="absolute inset-0 cursor-pointer opacity-0"
								/>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

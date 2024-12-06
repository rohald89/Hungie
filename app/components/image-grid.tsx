function ImageGrid() {
	return (
		<div className="-mt-8 ml-16 flex gap-x-8">
			{/* Column 1 - 3 images */}
			<div className="flex flex-col gap-y-24 pt-36">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="flex aspect-square w-[200px] items-center justify-center rounded-2xl bg-white"
					>
						<img
							src={`/img/hungie-grid-${i}.png`}
							alt={`Food item ${i}`}
							className="h-[200px] w-[200px] rounded-2xl object-cover"
						/>
					</div>
				))}
			</div>

			{/* Column 2 - 4 images */}
			<div className="flex flex-col gap-y-24">
				{[4, 5, 6, 7].map((i) => (
					<div
						key={i}
						className="flex aspect-square w-[200px] items-center justify-center rounded-2xl bg-white"
					>
						<img
							src={`/img/hungie-grid-${i}.png`}
							alt={`Food item ${i}`}
							className="h-[200px] w-[200px] rounded-2xl object-cover"
						/>
					</div>
				))}
			</div>

			{/* Column 3 - 3 images */}
			<div className="flex flex-col gap-y-24 pt-36">
				{[8, 9, 10].map((i) => (
					<div
						key={i}
						className="flex aspect-square w-[200px] items-center justify-center rounded-2xl bg-white"
					>
						<img
							src={`/img/hungie-grid-${i}.png`}
							alt={`Food item ${i}`}
							className="h-[200px] w-[200px] rounded-2xl object-cover"
						/>
					</div>
				))}
			</div>

			{/* Column 4 - 4 images */}
			<div className="flex flex-col gap-y-24">
				{[11, 12, 13, 14].map((i) => (
					<div
						key={i}
						className="flex aspect-square w-[200px] items-center justify-center rounded-2xl bg-white"
					>
						<img
							src={`/img/hungie-grid-${i}.png`}
							alt={`Food item ${i}`}
							className="h-[200px] w-[200px] rounded-2xl object-cover"
						/>
					</div>
				))}
			</div>
		</div>
	)
}

export default ImageGrid

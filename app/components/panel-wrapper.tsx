import { useNavigate } from '@remix-run/react'
import { Icon } from './ui/icon'
import { ScrollArea } from './ui/scrollarea'
import { cn } from '#app/utils/misc'

type ButtonConfig = {
	icon: React.ReactNode
	onClick: () => void
	className?: string
	ariaLabel?: string
}

type PanelWrapperProps = {
	title: string
	children: React.ReactNode
	leftButton?: ButtonConfig
	rightButton?: ButtonConfig | false
	className?: string
}

export function PanelWrapper({
	title,
	children,
	leftButton,
	rightButton = {
		icon: <Icon name="arrow-up" className="h-5 w-5" />,
		onClick: () => window.history.back(),
		ariaLabel: 'Go back',
	},
	className,
}: PanelWrapperProps) {
	const renderButton = (config: ButtonConfig, position: 'left' | 'right') => (
		<button
			onClick={config.onClick}
			aria-label={config.ariaLabel}
			className={cn(
				'absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-black transition hover:-translate-y-1 hover:bg-gray-800',
				position === 'left' ? 'left-0' : 'right-0',
				config.className,
			)}
		>
			{config.icon}
		</button>
	)

	return (
		<div className={cn('h-full px-12 py-20', className)}>
			<div className="relative h-full rounded-2xl border border-[#D9D9D9]">
				<ScrollArea className="h-full px-8">
					<div className="relative my-8 flex h-10 items-center justify-center">
						<h3 className="text-center text-h6 uppercase text-muted-foreground">
							{title}
						</h3>
						{leftButton && renderButton(leftButton, 'left')}
						{rightButton && renderButton(rightButton, 'right')}
					</div>
					{children}
				</ScrollArea>
			</div>
		</div>
	)
}

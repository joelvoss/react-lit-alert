import * as React from 'react';
import { render, userEvent, wait } from './test-utils';

import { Alert } from '../src/index';

describe('<Alert />', () => {
	const Comp = () => {
		const [messages, setMessages] = React.useState([]);
		return (
			<div>
				<button
					onClick={() => {
						setMessages(prevMessages =>
							prevMessages.concat([`Message #${prevMessages.length + 1}`]),
						);
						setTimeout(() => {
							setMessages(prevMessages => prevMessages.slice(1));
						}, 5000);
					}}
				>
					Add a message
				</button>
				<div>
					{messages.map((message, index) => (
						<Alert key={index}>{message}</Alert>
					))}
				</div>
			</div>
		);
	};

	it('should not have ARIA violations', async () => {
		let { container, queryByText } = render(<Comp />);
		await expect(container).toHaveNoAxeViolations();
		await userEvent.click(queryByText(/Add a message/i));
		await wait(501);
		await expect(container).toHaveNoAxeViolations();
	});

	it('should render proper HTML', async () => {
		const { queryByText, queryAllByText } = render(<Comp />);
		await userEvent.click(queryByText(/Add a message/i));
		await wait(501);

		const elements = queryAllByText(/Message #1/i);
		const mirror = elements[0].parentElement;

		expect(elements.length).toBe(2);
		expect(mirror.getAttribute('aria-live')).toBe('polite');
		expect(mirror.getAttribute('role')).toBe('status');
	});
});

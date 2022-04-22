import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { VisuallyHidden } from '@react-lit/visually-hidden';
import {
	usePrevious,
	getOwnerDocument,
	useComposeRefs,
} from '@react-lit/helper';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): Singleton state is fine because you don't server render
// an alert (SRs don't read them on first load anyway)

/** @typedef {"polite" | "assertive"} RegionTypes */

/**
 * @typedef {{[key in RegionTypes]: number}} RegionKeys
 */
const keys = {
	polite: -1,
	assertive: -1,
};

/**
 * @typedef {{[key in RegionTypes]: { [key: string]: JSX.Element }}} ElementTypes
 */
const elements = {
	polite: {},
	assertive: {},
};

/**
 * @typedef {{ [key in RegionTypes]: T | null }} RegionElements
 * @template T
 */
const liveRegions = {
	polite: null,
	assertive: null,
};

/** @type {number | null} */
let renderTimer;

////////////////////////////////////////////////////////////////////////////////

/**
 * Alert renders screen-reader-friendly alert messages.
 */
export const Alert = React.forwardRef(
	(
		{ as: Comp = 'div', children, type: regionType = 'polite', ...props },
		parentRef,
	) => {
		const ownRef = React.useRef(null);
		const ref = useComposeRefs(parentRef, ownRef);

		const child = React.useMemo(
			() => (
				<Comp {...props} ref={ref}>
					{children}
				</Comp>
			),
			// The mutable value `ref` isn't a valid dependency, so we can safely
			// disable the exhaustive-deps rule.
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[children, props],
		);

		useMirrorEffects(regionType, child, ownRef);

		return child;
	},
);

////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} Mirror
 * @prop {(element: JSX.Element) => void} mount
 * @prop {(element: JSX.Element) => void} update
 * @prop {() => void} unmount
 */

/**
 * createMirror
 * @param {RegionTypes} type
 * @param {Document} doc
 * @returns {Mirror}
 */
function createMirror(type, doc) {
	const key = ++keys[type];

	/**
	 * mount
	 * @param {JSX.Element} element
	 */
	function mount(element) {
		if (liveRegions[type]) {
			elements[type][key] = element;
			renderAlerts();
		} else {
			let node = doc.createElement('div');
			node.setAttribute(`data-react-lit-live-${type}`, 'true');
			liveRegions[type] = createRoot(node);
			doc.body.appendChild(node);
			mount(element);
		}
	}

	/**
	 * update
	 * @param {JSX.Element} element
	 */
	function update(element) {
		elements[type][key] = element;
		renderAlerts();
	}

	/**
	 * unmount
	 */
	function unmount() {
		delete elements[type][key];
		renderAlerts();
	}

	return { mount, update, unmount };
}

////////////////////////////////////////////////////////////////////////////////

/**
 * renderAlerts
 */
function renderAlerts() {
	if (renderTimer != null) {
		window.clearTimeout(renderTimer);
	}

	renderTimer = window.setTimeout(() => {
		Object.keys(elements).forEach(elementType => {
			const regionType = elementType;
			const containerRoot = liveRegions[regionType];
			if (containerRoot) {
				containerRoot.render(
					<VisuallyHidden as="div">
						<div
							// @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_status_role
							role={regionType === 'assertive' ? 'alert' : 'status'}
							aria-live={regionType}
						>
							{Object.keys(elements[regionType]).map(key =>
								React.cloneElement(elements[regionType][key], {
									key,
									ref: null,
								}),
							)}
						</div>
					</VisuallyHidden>,
				);
			}
		});
	}, 500);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * useMirrorEffects
 * @param {RegionTypes} regionType
 * @param {JSX.Element} element
 * @param {React.RefObject<Element>} ref
 */
function useMirrorEffects(regionType, element, ref) {
	const prevType = usePrevious(regionType);
	const mirror = React.useRef();
	const mounted = React.useRef(false);

	React.useEffect(() => {
		const ownerDocument = getOwnerDocument(ref.current);

		if (!mounted.current) {
			mounted.current = true;
			mirror.current = createMirror(regionType, ownerDocument);
			mirror.current.mount(element);
		} else if (prevType !== regionType) {
			mirror.current && mirror.current.unmount();
			mirror.current = createMirror(regionType, ownerDocument);
			mirror.current.mount(element);
		} else {
			mirror.current && mirror.current.update(element);
		}
	}, [element, regionType, prevType, ref]);

	React.useEffect(
		() => () => {
			mirror.current && mirror.current.unmount();
		},
		[],
	);
}

function trimContent(node) {
	node.value = node.value.trim();
}

function resizeTextarea(node) {
	node.style.height = 'auto';

	const scrollHeight = node.scrollHeight;
	const lineHeight = parseFloat(getComputedStyle(node).lineHeight);

	const minHeight = lineHeight * node.value.split('\n').length;

	node.style.height = Math.max(minHeight, scrollHeight) + 'px';
}

function appendConsole(node) {
	const consoleElement = document.createElement('div');
	consoleElement.classList.add('eval-container');
	consoleElement.dataset.siblingId = node.dataset.codeId;

	consoleElement.innerHTML = `
		<div class="eval-controls">
			<button data-action="run">&raquo;</button><button data-action="clear">&times;</button>
		</div>
		<pre class="eval-output"></pre>
	`;

	node.insertAdjacentElement('afterend', consoleElement);
}

const toString = (value) => {
	if (value == null) {
		return '' + value;
	}

	if (typeof value === 'object' && ! Array.isArray(value) && value.constructor.name !== 'Object') {
		return value.constructor.name + ' { }';
	}

	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'function' || typeof value === 'symbol') {
		return value.toString();
	}

	return JSON.stringify(value, (k, v) => {
			if (Array.isArray(v)) {
				const n = Array(v.length);
				for (let i = 0; i < v.length; i++) {
					if (i in v) {
						n[i] = v[i];
					} else {
						n[i] = "***empty***";
					}

					if (typeof n[i] === 'undefined') {
						n[i] = "***undefined***";
					} else if (typeof n[i] === 'function' || typeof n[i] === 'symbol') {
						n[i] = '***' + n[i].toString() + '***';
					} else if (typeof n[i] === 'object' && n[i] != null && ! Array.isArray(n[i]) && n[i].constructor.name !== 'Object') {
						n[i] = '***' + n[i].constructor.name + ' { }***';
					}
				}

				return n;
			} else if (typeof v === 'undefined') {
				return "***undefined***";
			}

			return v;
		}).replace(/"\*\*\*(.+?)\*\*\*"/g, "$1");
};

const codeWrap = (className, value) => {
	const codeNode = document.createElement('code');
	codeNode.classList.add(className);
	codeNode.textContent = value;

	return codeNode;
};

window.logStorage = [];
window.log = (...args) => {
	window.logStorage.push(codeWrap('eval-log', args.map(toString).join(' ')));
};

document.addEventListener('click', (event) => {
	if ( ! event.target.matches('button[data-action]')) {
		return;
	}

	const action = event.target.dataset.action;

	const containerNode = event.target.closest('.eval-container');
	const outputNode = containerNode.querySelector('pre.eval-output');
	outputNode.classList.remove('active');

	switch (action) {
		case 'run': {
			const codeNode = document.querySelector(`[data-code-id="${containerNode.dataset.siblingId}"]`);

			outputNode.innerHTML = '';
			try {
				window.logStorage = [];

				const windowKeys = Object.keys(window);

				const fragments = (codeNode.dataset.prepend || '').split(',').map((id) => {
					const script = document.querySelector(`script#fragment-${id.trim()}`);
					if (!script) {
						return '';
					}
					return script.innerText;
				});

				const code = [...fragments, codeNode.value].join('\n');
				const result = codeNode.dataset.hasOwnProperty('noStrict') ?  eval(`${code}`) : eval(`"use strict"; ${code}`);

				Object.keys(window).forEach((key) => {
					if (!windowKeys.includes(key)) {
						delete window[key];
					}
				});

				[...window.logStorage, codeWrap('eval-result', toString(result))].forEach((element) => {
					outputNode.appendChild(element);
				});
			} catch (error) {
				[...window.logStorage, codeWrap('eval-error', error.message)].forEach((element) => {
					outputNode.appendChild(element);
				});
			}

			const codeNodes = outputNode.querySelectorAll('code');

			for (let i = 0; i < codeNodes.length; ++i) {
				if ( ! codeNodes[i].animate) { break; }

				codeNodes[i].animate([
					{ opacity: '0' },
					{ opacity: '1' }
				], {
					duration: 125,
					iterations: 1
				});
			}

			break;
		}
		case 'clear':
		default: {
			outputNode.textContent = '';
		}
	}

	event.preventDefault();
});

document.addEventListener('input', (event) => {
	if ( ! event.target.matches('textarea')) {
		return;
	}

	resizeTextarea(event.target);
});

const evalNodes = document.querySelectorAll('.eval');

for (let i = 0; i < evalNodes.length; ++i) {
	const evalNode = evalNodes[i];
	evalNode.dataset.codeId = i;
	trimContent(evalNode);
	appendConsole(evalNode);
	setTimeout(() => resizeTextarea(evalNode), 16);
}

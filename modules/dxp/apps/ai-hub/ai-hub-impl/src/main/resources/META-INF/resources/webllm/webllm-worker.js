import * as webllm from 'https://esm.run/@mlc-ai/web-llm';

const browserSessionId = crypto.randomUUID();

const model = 'Qwen2.5-3B-Instruct-q4f32_1-MLC';

let engine;

const socket = new WebSocket(
	`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/o/ai-hub/webllm`
);

socket.addEventListener('open', async () => {
	engine = await webllm.CreateMLCEngine(model);
	
	socket.send(JSON.stringify({
		type: "register",
		browserSessionId,
		companyId: Liferay.ThemeDisplay.getCompanyId(),
		userId: Liferay.ThemeDisplay.getUserId(),
		capabilities: {
			model,
			streaming: true,
			maxContextTokens: 32768,
			webGPU: !!navigator.gpu
		}
	}));	
	
});

socket.addEventListener('message', async (event) => {
	const message = JSON.parse(event.data);

	if (message.type !== 'job') {
		return;
	}

	await handleJob(message);
});

async function handleJob(job) {
	try {
		const chunks = await engine.chat.completions.create({
			messages: job.messages,
			stream: true,
			temperature: job.options?.temperature ?? 0.2
		});

		let text = '';

		for await (const chunk of chunks) {
			const token = chunk.choices?.[0]?.delta?.content || '';

			if (!token) {
				continue;
			}

			text += token;

			socket.send(JSON.stringify({
				type: 'token',
				jobId: job.jobId,
				text: token
			}));
		}

		socket.send(JSON.stringify({
			type: 'complete',
			jobId: job.jobId,
			text
		}));
	}
	catch (error) {
		socket.send(JSON.stringify({
			type: 'error',
			jobId: job.jobId,
			message: error.message || String(error)
		}));
	}
}

console.log("[AI Hub WebLLM] script loaded");

console.log("[AI Hub WebLLM] loading model", model);

engine = await webllm.CreateMLCEngine(model, {
	initProgressCallback: (progress) => {
		console.log("[AI Hub WebLLM] progress", progress);
	}
});

console.log("[AI Hub WebLLM] model ready", model);

globalThis.aiHubWebLLM = {
	engine,
	model,
	ready: true
};
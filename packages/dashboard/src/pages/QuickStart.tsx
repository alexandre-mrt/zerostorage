import { Copy } from "lucide-react";

function CodeBlock({ title, code }: { title: string; code: string }) {
	return (
		<div className="mb-6">
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm font-medium text-gray-700">{title}</span>
				<button
					type="button"
					onClick={() => navigator.clipboard.writeText(code)}
					className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
				>
					<Copy className="w-3 h-3" /> Copy
				</button>
			</div>
			<pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
				<code>{code}</code>
			</pre>
		</div>
	);
}

export function QuickStart() {
	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-2">Quick Start</h1>
			<p className="text-gray-500 mb-8">
				Get started with ZeroStore in minutes. Upload files to 0G decentralized
				storage with a simple API.
			</p>

			<div className="bg-white rounded-xl border p-6">
				<h2 className="text-lg font-semibold mb-4">1. Install the SDK</h2>
				<CodeBlock title="npm / bun" code="bun add zerostorage" />

				<h2 className="text-lg font-semibold mb-4">2. Upload a file</h2>
				<CodeBlock
					title="TypeScript"
					code={`import { ZeroStore } from 'zerostorage';

const store = new ZeroStore({
  apiKey: 'zs_your_api_key',
  baseUrl: 'https://api.zerostorage.dev',
});

// Upload
const file = new File(['Hello 0G!'], 'hello.txt');
const { rootHash } = await store.upload(file);
console.log('Uploaded:', rootHash);

// Download
const blob = await store.download(rootHash);
console.log('Downloaded:', await blob.text());

// List files
const { files } = await store.list({ page: 1, limit: 20 });
console.log('Files:', files);`}
				/>

				<h2 className="text-lg font-semibold mb-4">3. Or use cURL</h2>
				<CodeBlock
					title="Upload with cURL"
					code={`# Upload a file
curl -X POST https://api.zerostorage.dev/api/v1/files/upload \\
  -H "Authorization: Bearer zs_your_api_key" \\
  -F "file=@./myfile.pdf"

# Download a file
curl https://api.zerostorage.dev/api/v1/files/{rootHash} \\
  -H "Authorization: Bearer zs_your_api_key" \\
  -o downloaded.pdf

# List files
curl https://api.zerostorage.dev/api/v1/files \\
  -H "Authorization: Bearer zs_your_api_key"`}
				/>

				<h2 className="text-lg font-semibold mb-4">4. Check usage</h2>
				<CodeBlock
					title="TypeScript"
					code={`const usage = await store.usage();
console.log('Storage used:', usage.storage.bytesUsed);
console.log('Files count:', usage.storage.filesCount);`}
				/>
			</div>
		</div>
	);
}

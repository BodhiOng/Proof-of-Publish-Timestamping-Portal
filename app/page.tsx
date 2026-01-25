export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <main className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Blockchain Assignment Part 2
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Next.js + TypeScript + Tailwind CSS
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Read Docs
          </a>
          <a
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Learn Next.js
          </a>
        </div>
      </main>
    </div>
  );
}

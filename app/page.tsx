import Link from 'next/link';

export default function Home() {
  const tools = [
    {
      name: 'Hyperlink Generator',
      description: 'Generate HTML hyperlinks with custom text and URLs',
      href: '/tools/hyperlink-generator',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Web Tools Collection
          </h1>
          <p className="text-xl text-gray-600">
            Simple, useful tools for web development
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.name}
              </h2>
              <p className="text-gray-600">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

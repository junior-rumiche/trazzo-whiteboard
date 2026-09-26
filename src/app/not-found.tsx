import Link from "next/link";

export default function NotFound() {
  return (
    <main className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-[#fbfbfe] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 px-4 text-center transition-colors">
      <div className="max-w-md p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm flex flex-col items-center">
        <span className="text-6xl font-black text-indigo-500 mb-2 font-mono">404</span>
        <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          El lienzo o la página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-sm"
        >
          Volver a la pizarra
        </Link>
      </div>
    </main>
  );
}

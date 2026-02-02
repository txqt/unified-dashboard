import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
            <h2 className="text-4xl font-bold">404</h2>
            <p className="mt-2 text-slate-400">Page Not Found</p>
            <Link
                href="/"
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-700"
            >
                Return Home
            </Link>
        </div>
    );
}

export default function Loader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

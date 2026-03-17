export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-6">
      <div>
        <p className="text-5xl mb-4">🚫</p>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-gray-500 mt-2 text-sm">Your account does not have admin privileges.</p>
      </div>
    </div>
  );
}

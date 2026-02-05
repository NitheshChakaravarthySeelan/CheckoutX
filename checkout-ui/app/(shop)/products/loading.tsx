export default function ProductsLoading() {
  const loadingProducts = Array.from({ length: 9 }); // Show more loading cards

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loadingProducts.map((_, index) => (
          <div
            key={index}
            className="flex flex-col overflow-hidden rounded-lg border bg-card animate-pulse"
          >
            <div className="relative block aspect-video w-full bg-muted"></div>
            <div className="p-4 flex-grow">
              <div className="h-6 bg-muted w-3/4 mb-2 rounded"></div>
              <div className="h-4 bg-muted w-full mb-2 rounded"></div>
              <div className="h-4 bg-muted w-1/2 rounded"></div>
            </div>
            <div className="p-4 pt-0">
              <div className="h-6 bg-muted w-1/3 rounded"></div>
            </div>
            <div className="p-4 pt-0 flex justify-between">
              <div className="h-10 w-24 bg-muted rounded-md"></div>
              <div className="h-10 w-24 bg-muted rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

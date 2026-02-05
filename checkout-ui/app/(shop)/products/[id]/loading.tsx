export default function ProductDetailLoading() {
  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-muted"></div>
      <div className="flex flex-col gap-4">
        <div className="h-10 bg-muted w-3/4 rounded-md"></div>
        <div className="h-6 bg-muted w-full rounded-md"></div>
        <div className="h-6 bg-muted w-5/6 rounded-md"></div>
        <div className="flex items-baseline gap-2">
          <div className="h-8 bg-muted w-1/4 rounded-md"></div>
          <div className="h-5 bg-muted w-1/5 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-12 bg-muted w-1/3 rounded-md"></div>
          <div className="h-12 bg-muted w-1/3 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-8">
          <div className="h-4 bg-muted w-1/2 rounded-md"></div>
          <div className="h-4 bg-muted w-1/2 rounded-md"></div>
          <div className="h-4 bg-muted w-1/2 rounded-md"></div>
          <div className="h-4 bg-muted w-1/2 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

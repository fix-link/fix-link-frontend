const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
      role="status"
      aria-label="Loading"
    />
  </div>
);

export default PageLoader;

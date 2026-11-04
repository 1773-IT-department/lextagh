// Lets plain Node (with type stripping) load the site's TypeScript the way the bundler does: relative imports
// without an extension resolve to the .ts file. Test use only.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if ((specifier.startsWith(".") || specifier.startsWith("/")) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    throw error;
  }
}

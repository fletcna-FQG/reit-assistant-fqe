/** Rewrite root-path HMR URLs (e.g. /?platform=web) to the expo-router entry bundle. */
function patchHmrRequestUrl(config) {
  const previousRewrite = config.server?.rewriteRequestUrl ?? ((url) => url);

  config.server = {
    ...config.server,
    rewriteRequestUrl: (url) => {
      const rewritten = previousRewrite(url);

      try {
        const parsed = new URL(rewritten);
        const isRootPath = parsed.pathname === '/' || parsed.pathname === '';
        if (isRootPath && parsed.searchParams.has('platform')) {
          parsed.pathname = '/node_modules/expo-router/entry.bundle';
          return parsed.toString();
        }
      } catch {
        // Keep the original URL if parsing fails.
      }

      return rewritten;
    },
  };

  return config;
}

module.exports = { patchHmrRequestUrl };

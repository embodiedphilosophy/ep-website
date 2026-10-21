Rebuild `public/circle/blob-client.js` (the Vercel Blob upload helper the Sahṛdaya Upāya page loads in Circle, which has no bundler):
`npm i --no-save esbuild && npx esbuild scripts/circle-build/blob-client-entry.js --bundle --minify --format=iife --global-name=EPBlob --platform=browser --target=es2019 --outfile=public/circle/blob-client.js`
